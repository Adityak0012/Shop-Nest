import { Coupon } from '../models/Coupon.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ApiError } from './ApiError.js';

const inr = (n) => `₹${n.toLocaleString('en-IN')}`;

/** Items total from the database for a list of { productId, qty } (never trust prices from the browser). */
export async function itemsTotalFor(items) {
  const qty = new Map();
  for (const { productId, qty: q } of items) qty.set(String(productId), (qty.get(String(productId)) || 0) + Number(q || 0));
  const products = await Product.find({ _id: { $in: [...qty.keys()] } }).select('price').lean();
  return products.reduce((s, p) => s + p.price * qty.get(String(p._id)), 0);
}

/**
 * Checks a coupon for a customer and an items total.
 * Returns { coupon, discount } or throws a 400 with a message the shopper can understand.
 */
export async function evaluateCoupon(rawCode, itemsTotal, userId) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) throw new ApiError(400, 'Enter a coupon code');
  const coupon = await Coupon.findOne({ code });
  if (!coupon || !coupon.active) throw new ApiError(400, `"${code}" is not a valid coupon`);
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, `"${code}" has expired`);
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, `"${code}" has been fully used`);
  if (itemsTotal < coupon.minOrder) {
    throw new ApiError(400, `Add ${inr(coupon.minOrder - itemsTotal)} more to use ${code} (minimum order ${inr(coupon.minOrder)})`);
  }
  if (coupon.onePerCustomer && userId) {
    const used = await Order.exists({ user: userId, 'coupon.code': code, status: { $ne: 'cancelled' } });
    if (used) throw new ApiError(400, `You have already used ${code}`);
  }
  return { coupon, discount: coupon.discountFor(itemsTotal) };
}

/** Takes one use of the coupon. Returns false if the usage limit was reached in the meantime. */
export async function claimCoupon(coupon) {
  const filter = coupon.usageLimit > 0 ? { _id: coupon._id, usedCount: { $lt: coupon.usageLimit } } : { _id: coupon._id };
  const r = await Coupon.updateOne(filter, { $inc: { usedCount: 1 } });
  return r.modifiedCount === 1;
}

export async function releaseCoupon(code) {
  if (code) await Coupon.updateOne({ code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
}
