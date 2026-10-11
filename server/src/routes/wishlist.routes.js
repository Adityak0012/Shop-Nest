import { Router } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { protect } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { findImage } from '../seed/seed.js';

const router = Router();
router.use(protect);

const wishlistIds = async (userId) => (await User.findById(userId).select('wishlist').lean()).wishlist || [];

const withImage = (p) => (p && !p.image ? { ...p, image: findImage(p.slug) } : p);

/** GET /api/wishlist - saved products (deleted products are dropped automatically) */
router.get('/', async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: 'wishlist', options: { lean: true } }).lean();
  const items = (user.wishlist || []).filter(Boolean).map(withImage).reverse(); // newest first
  res.json({ items, ids: items.map((p) => p._id) });
});

/** POST /api/wishlist/:productId - save a product */
router.post('/:productId', async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId) || !(await Product.exists({ _id: productId }))) {
    throw new ApiError(404, 'Product not found');
  }
  if ((req.user.wishlist || []).length >= 100) throw new ApiError(400, 'Your wishlist is full (100 items)');
  await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: productId } });
  res.status(201).json({ ids: await wishlistIds(req.user._id) });
});

/** DELETE /api/wishlist/:productId - remove a product */
router.delete('/:productId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.productId)) throw new ApiError(404, 'Product not found');
  await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: req.params.productId } });
  res.json({ ids: await wishlistIds(req.user._id) });
});

export default router;
