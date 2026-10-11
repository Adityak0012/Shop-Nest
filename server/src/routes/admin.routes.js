import { Router } from 'express';
import { Order, ORDER_STATUSES } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { restock } from './order.routes.js';

const router = Router();
router.use(protect, adminOnly);

const LOW_STOCK = 5;

/** Dashboard numbers. Cancelled orders and unpaid online orders do not count as revenue. */
router.get('/stats', async (_req, res) => {
  const counted = { status: { $in: ['placed', 'shipped', 'delivered'] } };

  const [revenueAgg, orderCount, byStatus, byCategory, products, customers, lowStock, recentOrders, outOfStock] =
    await Promise.all([
      Order.aggregate([{ $match: counted }, { $group: { _id: null, revenue: { $sum: '$total' } } }]),
      Order.countDocuments(counted),
      Promise.all(ORDER_STATUSES.map(async (s) => ({ _id: s, count: await Order.countDocuments({ status: s }) }))),
      Order.aggregate([
        { $match: counted },
        { $unwind: '$items' },
        { $group: { _id: '$items.category', revenue: { $sum: '$items.lineTotal' } } },
        { $sort: { revenue: -1 } },
      ]),
      Product.countDocuments(),
      User.countDocuments({ role: 'customer', email: { $not: /^reviewer\d+@shopnest\.dev$/ } }),
      Product.find({ stock: { $lte: LOW_STOCK } }).sort({ stock: 1 }).limit(8).select('name stock icon color image slug').lean(),
      Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email').lean(),
      Product.countDocuments({ stock: 0 }),
    ]);

  res.json({
    revenue: revenueAgg[0]?.revenue || 0,
    orders: orderCount,
    products,
    customers,
    outOfStock,
    lowStockThreshold: LOW_STOCK,
    lowStock,
    recentOrders,
    ordersByStatus: Object.fromEntries(ORDER_STATUSES.map((s) => [s, byStatus.find((b) => b._id === s)?.count || 0])),
    revenueByCategory: byCategory.map((c) => ({ category: c._id, revenue: c.revenue })),
  });
});

router.get('/orders', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 10;
  const filter = ORDER_STATUSES.includes(req.query.status) ? { status: req.query.status } : {};
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email').lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

const NEXT = { pending_payment: ['cancelled'], placed: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };

router.patch('/orders/:id/status', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  const { status } = req.body;
  if (!NEXT[order.status].includes(status)) {
    throw new ApiError(400, `Cannot change an order from "${order.status}" to "${status}"`);
  }
  if (status === 'cancelled') {
    await restock(order);
    if (order.payment.status === 'paid') order.payment.status = 'refunded';
  }
  if (status === 'delivered' && order.paymentMethod === 'cod') {
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
  }
  order.status = status;
  await order.save();
  await order.populate('user', 'name email');
  res.json(order);
});

/** Quick stock update from the dashboard */
router.patch('/products/:id/stock', async (req, res) => {
  const stock = parseInt(req.body.stock, 10);
  if (!Number.isInteger(stock) || stock < 0) throw new ApiError(400, 'Stock must be a whole number, 0 or more');
  const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { returnDocument: 'after', runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json(product);
});

export default router;
