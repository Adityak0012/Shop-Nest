import { Router } from 'express';
import { body } from 'express-validator';
import { Coupon } from '../models/Coupon.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { ApiError } from '../utils/ApiError.js';
import { evaluateCoupon, itemsTotalFor } from '../utils/coupons.js';

const router = Router();

const publicView = (c) => ({ code: c.code, description: c.description || c.summary(), summary: c.summary(), minOrder: c.minOrder, expiresAt: c.expiresAt });

/** GET /api/coupons - offers shoppers can use right now (shown at checkout) */
router.get('/', async (_req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({ active: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }).sort({ minOrder: 1 });
  res.json(coupons.filter((c) => !c.usageLimit || c.usedCount < c.usageLimit).map(publicView));
});

/** POST /api/coupons/validate { code, items:[{productId, qty}] } -> { code, discount, summary } */
router.post(
  '/validate',
  protect,
  body('code').trim().notEmpty().withMessage('Enter a coupon code'),
  body('items').isArray({ min: 1 }).withMessage('Your bag is empty'),
  validate,
  async (req, res) => {
    const itemsTotal = await itemsTotalFor(req.body.items);
    const { coupon, discount } = await evaluateCoupon(req.body.code, itemsTotal, req.user._id);
    res.json({ code: coupon.code, discount, summary: coupon.summary(), itemsTotal });
  }
);

// ---------- Admin ----------
const rules = [
  body('code').trim().toUpperCase().matches(/^[A-Z0-9]{3,20}$/).withMessage('Code must be 3-20 letters or numbers'),
  body('type').isIn(['percent', 'flat']).withMessage('Choose percent or flat'),
  body('value').isFloat({ min: 1 }).withMessage('Value must be 1 or more').toFloat(),
  body('value').custom((v, { req }) => {
    if (req.body.type === 'percent' && v > 90) throw new Error('Percent can be at most 90');
    return true;
  }),
  body('minOrder').optional().isFloat({ min: 0 }).toFloat(),
  body('maxDiscount').optional().isFloat({ min: 0 }).toFloat(),
  body('usageLimit').optional().isInt({ min: 0 }).toInt(),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid expiry date').toDate(),
  body('description').optional().trim().isLength({ max: 120 }),
  validate,
];
const pick = (b) => ({
  code: b.code, type: b.type, value: b.value, minOrder: b.minOrder || 0, maxDiscount: b.maxDiscount || 0,
  usageLimit: b.usageLimit || 0, expiresAt: b.expiresAt || null, description: b.description || '',
  onePerCustomer: b.onePerCustomer !== false, active: b.active !== false,
});

router.get('/admin', protect, adminOnly, async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons.map((c) => ({ ...c.toObject(), summary: c.summary() })));
});

router.post('/admin', protect, adminOnly, rules, async (req, res) => {
  if (await Coupon.exists({ code: req.body.code })) throw new ApiError(409, `Coupon ${req.body.code} already exists`);
  const c = await Coupon.create(pick(req.body));
  res.status(201).json({ ...c.toObject(), summary: c.summary() });
});

router.put('/admin/:id', protect, adminOnly, rules, async (req, res) => {
  const c = await Coupon.findById(req.params.id);
  if (!c) throw new ApiError(404, 'Coupon not found');
  Object.assign(c, pick(req.body));
  await c.save();
  res.json({ ...c.toObject(), summary: c.summary() });
});

router.patch('/admin/:id/active', protect, adminOnly, async (req, res) => {
  const c = await Coupon.findById(req.params.id);
  if (!c) throw new ApiError(404, 'Coupon not found');
  c.active = Boolean(req.body.active);
  await c.save();
  res.json({ ...c.toObject(), summary: c.summary() });
});

router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  const c = await Coupon.findByIdAndDelete(req.params.id);
  if (!c) throw new ApiError(404, 'Coupon not found');
  res.json({ message: 'Coupon deleted' });
});

export default router;
