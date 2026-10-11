import { Router } from 'express';
import { body } from 'express-validator';
import { Product, CATEGORIES, slugify } from '../models/Product.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { ApiError } from '../utils/ApiError.js';
import { findImage, findGallery } from '../seed/seed.js';
import { Review } from '../models/Review.js';

/** Photos dropped into client/public/images/products show up without a server restart. */
const withImage = (p) => (p && !p.image ? { ...p, image: findImage(p.slug) } : p);
/** Product page: main photo + gallery (saved URLs, or "<slug>-2.jpg"... files in the photos folder) */
const withGallery = (p) => {
  const q = withImage(p);
  return { ...q, images: q.images?.length ? q.images : findGallery(q.slug) };
};

const router = Router();

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1, numReviews: -1 },
  popular: { sold: -1 },
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/products
 * Query: search, category, minPrice, maxPrice, inStock, sort, page, limit
 * Search, filtering, sorting and pagination all happen in MongoDB (server side).
 */
router.get('/', async (req, res) => {
  const { search = '', category, minPrice, maxPrice, inStock, sort = 'newest', featured } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));

  const filter = {};
  if (search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: rx }, { brand: rx }, { category: rx }];
  }
  if (category && CATEGORIES.includes(category)) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (featured === 'true') filter.featured = true;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ ...(SORTS[sort] || SORTS.newest), _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ items: items.map(withImage), total, page, pages: Math.max(1, Math.ceil(total / limit)), limit });
});

/** GET /api/products/suggest?q=head -> up to 6 quick matches for the search box, plus matching categories */
router.get('/suggest', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q.length < 2) return res.json({ products: [], categories: [] });
  const rx = new RegExp(escapeRegex(q), 'i');
  const products = await Product.find({ $or: [{ name: rx }, { brand: rx }, { category: rx }] })
    .sort({ rating: -1, sold: -1 })
    .limit(30)
    .select('name slug brand category price mrp image icon color stock')
    .lean();
  // Name matches first, then brand, then category; earlier matches in the name rank higher
  const rank = (p) => (rx.test(p.name) ? p.name.toLowerCase().indexOf(q.toLowerCase()) / 100 : rx.test(p.brand) ? 1 : 2);
  products.sort((a, b) => rank(a) - rank(b));
  res.json({ products: products.slice(0, 6).map(withImage), categories: CATEGORIES.filter((c) => rx.test(c)) });
});

/** GET /api/products/categories -> [{ name, count }] */
router.get('/categories', async (_req, res) => {
  const counts = await Promise.all(CATEGORIES.map((name) => Product.countDocuments({ category: name })));
  res.json(CATEGORIES.map((name, i) => ({ name, count: counts[i] })));
});

router.get('/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).lean();
  if (!product) throw new ApiError(404, 'Product not found');
  const related = await Product.find({ category: product.category, _id: { $ne: product._id } })
    .sort({ rating: -1 })
    .limit(4)
    .lean();
  res.json({ product: withGallery(product), related: related.map(withImage) });
});

// ---------- Admin: create, update, delete ----------
const productRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('category').isIn(CATEGORIES).withMessage('Pick a valid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be 0 or more').toFloat(),
  body('mrp').isFloat({ min: 0 }).withMessage('MRP must be 0 or more').toFloat(),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a whole number, 0 or more').toInt(),
  body('icon').optional().matches(/^bi-[a-z0-9-]+$/).withMessage('Icon must be a Bootstrap Icon class like bi-laptop'),
  body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a hex value like #4F46E5'),
  body('image').optional({ values: 'falsy' }).trim().isLength({ max: 300 }).matches(/^(\/|https:\/\/)/)
    .withMessage('Photo must be a path like /images/products/name.jpg or an https:// URL'),
  body('mrp').custom((mrp, { req }) => {
    if (mrp < req.body.price) throw new Error('MRP cannot be lower than the selling price');
    return true;
  }),
];

const pick = (b) => ({
  name: b.name,
  description: b.description,
  brand: b.brand,
  category: b.category,
  price: b.price,
  mrp: b.mrp,
  stock: b.stock,
  icon: b.icon,
  color: b.color,
  image: b.image || '',
  images: Array.isArray(b.images) ? b.images.map((u) => String(u).trim()).filter((u) => /^(\/|https:\/\/)/.test(u)).slice(0, 6) : [],
  featured: Boolean(b.featured),
  highlights: Array.isArray(b.highlights) ? b.highlights.filter(Boolean).slice(0, 6) : [],
});

async function uniqueSlug(name, ignoreId) {
  const base = slugify(name) || 'product';
  let slug = base;
  for (let i = 2; await Product.exists({ slug, ...(ignoreId ? { _id: { $ne: ignoreId } } : {}) }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

router.post('/', protect, adminOnly, productRules, validate, async (req, res) => {
  const data = pick(req.body);
  const product = await Product.create({ ...data, slug: await uniqueSlug(data.name) });
  res.status(201).json(product);
});

router.put('/:id', protect, adminOnly, productRules, validate, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  const data = pick(req.body);
  if (data.name !== product.name) product.slug = await uniqueSlug(data.name, product._id);
  Object.assign(product, data);
  await product.save();
  res.json(product);
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  await Review.deleteMany({ product: product._id });
  res.json({ message: 'Product deleted' });
});

export default router;
