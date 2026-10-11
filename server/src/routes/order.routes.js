import { Router } from 'express';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { body } from 'express-validator';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { ApiError } from '../utils/ApiError.js';
import { env, razorpayEnabled } from '../config/env.js';
import { findImage } from '../seed/seed.js';
import { evaluateCoupon, claimCoupon, releaseCoupon } from '../utils/coupons.js';

const router = Router();
const razorpay = razorpayEnabled
  ? new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret })
  : null;

export const FREE_SHIPPING_ABOVE = 999;
export const SHIPPING_FEE = 49;

/** Puts stock back for every item of an order (used on cancel). */
export async function restock(order) {
  await releaseCoupon(order.coupon?.code);
  await Promise.all(
    order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.qty, sold: -i.qty } }))
  );
}

/** Tells the checkout page which payment options are available. */
router.get('/payment-config', (_req, res) => {
  res.json({
    razorpay: razorpayEnabled,
    keyId: razorpayEnabled ? env.razorpayKeyId : null,
    freeShippingAbove: FREE_SHIPPING_ABOVE,
    shippingFee: SHIPPING_FEE,
  });
});

router.use(protect);

/**
 * POST /api/orders
 * Body: { items: [{ productId, qty }], shippingAddress, paymentMethod: 'razorpay' | 'cod' }
 * Prices always come from the database, never from the browser.
 * Stock is reserved atomically so two buyers cannot take the last unit.
 */
router.post(
  '/',
  body('items').isArray({ min: 1, max: 30 }).withMessage('Your cart is empty'),
  body('items.*.productId').isMongoId().withMessage('Invalid product in cart'),
  body('items.*.qty').isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10').toInt(),
  body('paymentMethod').isIn(['razorpay', 'cod']).withMessage('Choose a payment method'),
  body('couponCode').optional({ values: 'falsy' }).trim().toUpperCase(),
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('shippingAddress.phone').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('shippingAddress.line1').trim().notEmpty().withMessage('Address is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.pincode').trim().matches(/^\d{6}$/).withMessage('Enter a valid 6-digit PIN code'),
  validate,
  async (req, res) => {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;
    if (paymentMethod === 'razorpay' && !razorpayEnabled) {
      throw new ApiError(400, 'Online payment is not configured. Choose Cash on Delivery.');
    }

    // Merge duplicate lines and load products
    const qtyById = new Map();
    for (const { productId, qty } of items) qtyById.set(productId, (qtyById.get(productId) || 0) + qty);
    const products = await Product.find({ _id: { $in: [...qtyById.keys()] } });
    if (products.length !== qtyById.size) throw new ApiError(400, 'Some products in your cart no longer exist');

    // Check the coupon before touching stock (prices come from the database)
    const preTotal = products.reduce((sum, p) => sum + p.price * qtyById.get(p._id.toString()), 0);
    const applied = couponCode ? await evaluateCoupon(couponCode, preTotal, req.user._id) : null;

    // Reserve stock one product at a time; roll back if any product runs out
    const reserved = [];
    for (const p of products) {
      const qty = qtyById.get(p._id.toString());
      const r = await Product.updateOne({ _id: p._id, stock: { $gte: qty } }, { $inc: { stock: -qty, sold: qty } });
      if (r.modifiedCount === 0) {
        await Promise.all(reserved.map((x) => Product.updateOne({ _id: x.id }, { $inc: { stock: x.qty, sold: -x.qty } })));
        throw new ApiError(409, `Only ${p.stock} left of "${p.name}". Please update your cart.`);
      }
      reserved.push({ id: p._id, qty });
    }

    // Take one use of the coupon; if it ran out in the meantime, put the stock back
    if (applied && !(await claimCoupon(applied.coupon))) {
      await Promise.all(reserved.map((x) => Product.updateOne({ _id: x.id }, { $inc: { stock: x.qty, sold: -x.qty } })));
      throw new ApiError(409, `Coupon ${applied.coupon.code} has just run out. Please remove it and try again.`);
    }

    const orderItems = products.map((p) => ({
      product: p._id,
      name: p.name,
      category: p.category,
      icon: p.icon,
      color: p.color,
      image: p.image || findImage(p.slug),
      price: p.price,
      qty: qtyById.get(p._id.toString()),
      lineTotal: p.price * qtyById.get(p._id.toString()),
    }));
    const itemsTotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = itemsTotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE; // free delivery is based on the items total
    const discount = applied ? applied.discount : 0;
    const total = itemsTotal - discount + shipping;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      itemsTotal,
      discount,
      coupon: applied ? { code: applied.coupon.code, discount } : undefined,
      shipping,
      total,
      paymentMethod,
      status: paymentMethod === 'cod' ? 'placed' : 'pending_payment',
    });

    // Save the address for next time
    req.user.address = shippingAddress;
    await req.user.save();

    if (paymentMethod === 'cod') return res.status(201).json({ order });

    try {
      const rzOrder = await razorpay.orders.create({
        amount: Math.round(total * 100), // paise
        currency: 'INR',
        receipt: order._id.toString(),
      });
      order.payment.razorpayOrderId = rzOrder.id;
      await order.save();
      res.status(201).json({
        order,
        razorpay: { keyId: env.razorpayKeyId, orderId: rzOrder.id, amount: rzOrder.amount, currency: 'INR' },
      });
    } catch (err) {
      await restock(order);
      order.status = 'cancelled';
      order.payment.status = 'failed';
      await order.save();
      throw new ApiError(502, 'Could not start the payment. Please try again.', err?.error?.description);
    }
  }
);

/** POST /api/orders/:id/verify - checks the Razorpay signature, then marks the order paid. */
router.post('/:id/verify', async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.payment.status === 'paid') return res.json({ order });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(`${order.payment.razorpayOrderId}|${razorpay_payment_id}`)
    .digest('hex');

  const valid =
    razorpay_order_id === order.payment.razorpayOrderId &&
    typeof razorpay_signature === 'string' &&
    razorpay_signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

  if (!valid) {
    order.payment.status = 'failed';
    await order.save();
    throw new ApiError(400, 'Payment verification failed');
  }

  order.payment.status = 'paid';
  order.payment.razorpayPaymentId = razorpay_payment_id;
  order.payment.paidAt = new Date();
  order.status = 'placed';
  await order.save();
  res.json({ order });
});

router.get('/mine', async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

router.get('/:id', async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email').lean();
  if (!order) throw new ApiError(404, 'Order not found');
  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(403, 'Not your order');
  res.json(order);
});

/** Customers can cancel before the order ships; stock goes back. */
router.post('/:id/cancel', async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (!['pending_payment', 'placed'].includes(order.status)) {
    throw new ApiError(400, 'This order can no longer be cancelled');
  }
  await restock(order);
  order.status = 'cancelled';
  if (order.payment.status === 'paid') order.payment.status = 'refunded';
  await order.save();
  res.json({ order });
});

export default router;
