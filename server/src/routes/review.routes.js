import { Router } from 'express';
import { body } from 'express-validator';
import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { ApiError } from '../utils/ApiError.js';

// Mounted at /api/products/:productId/reviews
const router = Router({ mergeParams: true });

const SORTS = { newest: { createdAt: -1 }, highest: { rating: -1, createdAt: -1 }, lowest: { rating: 1, createdAt: -1 } };

/** Has this user bought the product? (an order that was not cancelled) */
async function hasPurchased(userId, productId) {
  return Boolean(
    await Order.exists({ user: userId, 'items.product': productId, status: { $in: ['placed', 'shipped', 'delivered'] } })
  );
}

async function loadProduct(id) {
  const product = await Product.findById(id).select('_id').lean();
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
}

/**
 * GET /api/products/:productId/reviews?sort=newest|highest|lowest&page=1&stars=5
 * Returns the reviews page plus the star breakdown used for the summary bars.
 */
router.get('/', async (req, res) => {
  const { productId } = req.params;
  await loadProduct(productId);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 5;
  const stars = Number(req.query.stars);
  const filter = { product: productId, ...(stars >= 1 && stars <= 5 ? { rating: stars } : {}) };

  const [items, total, counts] = await Promise.all([
    Review.find(filter).sort(SORTS[req.query.sort] || SORTS.newest).skip((page - 1) * limit).limit(limit).lean(),
    Review.countDocuments(filter),
    Promise.all([5, 4, 3, 2, 1].map((s) => Review.countDocuments({ product: productId, rating: s }))),
  ]);

  const count = counts.reduce((a, b) => a + b, 0);
  const average = count ? Math.round(([5, 4, 3, 2, 1].reduce((s, star, i) => s + star * counts[i], 0) / count) * 10) / 10 : 0;

  res.json({
    items: items.map(({ user, ...r }) => ({ ...r, userId: user })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    summary: { average, count, breakdown: { 5: counts[0], 4: counts[1], 3: counts[2], 2: counts[3], 1: counts[4] } },
  });
});

/** GET /api/products/:productId/reviews/mine - can I review, and my existing review if any */
router.get('/mine', protect, async (req, res) => {
  const { productId } = req.params;
  await loadProduct(productId);
  const [review, purchased] = await Promise.all([
    Review.findOne({ product: productId, user: req.user._id }).lean(),
    hasPurchased(req.user._id, productId),
  ]);
  res.json({ canReview: purchased, review });
});

/** POST /api/products/:productId/reviews - create or update my review (verified buyers only) */
router.post(
  '/',
  protect,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Choose a rating from 1 to 5 stars').toInt(),
  body('title').optional().trim().isLength({ max: 80 }).withMessage('Title can be up to 80 characters'),
  body('comment').trim().isLength({ min: 10, max: 1000 }).withMessage('Review must be 10 to 1000 characters'),
  validate,
  async (req, res) => {
    const { productId } = req.params;
    await loadProduct(productId);
    if (!(await hasPurchased(req.user._id, productId))) {
      throw new ApiError(403, 'Only customers who bought this product can review it');
    }
    const { rating, title, comment } = req.body;
    const review = await Review.findOneAndUpdate(
      { product: productId, user: req.user._id },
      { rating, title, comment, name: req.user.name, verified: true },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
    );
    const summary = await Review.refreshProductRating(productId);
    res.status(201).json({ review, ...summary });
  }
);

/** DELETE /api/products/:productId/reviews/:reviewId - author or admin */
router.delete('/:reviewId', protect, async (req, res) => {
  const review = await Review.findOne({ _id: req.params.reviewId, product: req.params.productId });
  if (!review) throw new ApiError(404, 'Review not found');
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own review');
  }
  await review.deleteOne();
  const summary = await Review.refreshProductRating(review.product);
  res.json({ message: 'Review deleted', ...summary });
});

export default router;
