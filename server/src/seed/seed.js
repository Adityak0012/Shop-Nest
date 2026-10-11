import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Product, slugify } from '../models/Product.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { env } from '../config/env.js';
import crypto from 'node:crypto';
import { demoProducts } from './products.js';
import { Review } from '../models/Review.js';
import { Coupon } from '../models/Coupon.js';
import { REVIEWERS, buildSampleReviews } from './reviews.js';

// Photos created by "npm run images" live in the Angular app's public folder
export const IMAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../client/public/images/products');

/** Returns "/images/products/<file>" if a photo for this slug exists, otherwise "" (the icon is shown). */
export function findImage(slug) {
  for (const ext of ['webp', 'jpg', 'jpeg', 'png']) {
    if (fs.existsSync(path.join(IMAGE_DIR, `${slug}.${ext}`))) return `/images/products/${slug}.${ext}`;
  }
  return '';
}

/** Extra gallery photos named "<slug>-2.jpg", "<slug>-3.jpg" ... (up to 6) */
export function findGallery(slug) {
  const out = [];
  for (let n = 2; n <= 6; n++) {
    const ext = ['webp', 'jpg', 'jpeg', 'png'].find((e) => fs.existsSync(path.join(IMAGE_DIR, `${slug}-${n}.${e}`)));
    if (ext) out.push(`/images/products/${slug}-${n}.${ext}`);
  }
  return out;
}

/** Links photos to existing products that don't have one yet (keeps your own database data). */
export async function syncProductImages() {
  const products = await Product.find({ $or: [{ image: '' }, { image: { $exists: false } }] }).select('slug');
  let linked = 0;
  for (const p of products) {
    const image = findImage(p.slug);
    if (image) {
      await Product.updateOne({ _id: p._id }, { image });
      linked++;
    }
  }
  if (linked) console.log(`[seed] linked ${linked} new product photos`);
}

/** Replaces all products and creates the admin + demo customer accounts if missing. */
export async function seedDatabase() {
  await Product.deleteMany({});
  // Spread createdAt so "Newest" sorting has a meaningful order
  const now = Date.now();
  const products = await Product.insertMany(
    demoProducts.map((p, i) => {
      const slug = slugify(p.name);
      return { ...p, slug, image: findImage(slug), createdAt: new Date(now - i * 3600_000) };
    })
  );

  // Sample reviews from demo shoppers (these accounts cannot log in: random passwords)
  const reviewers = [];
  for (const [i, name] of REVIEWERS.entries()) {
    const email = `reviewer${i + 1}@shopnest.dev`;
    reviewers.push(
      (await User.findOne({ email })) ||
        (await User.create({ name, email, password: crypto.randomBytes(16).toString('hex') }))
    );
  }
  await Review.deleteMany({});
  await Review.insertMany(buildSampleReviews(products, reviewers));
  for (const p of products) await Review.refreshProductRating(p._id);

  if (!(await User.exists({ email: env.adminEmail }))) {
    await User.create({ name: 'Store Admin', email: env.adminEmail, password: env.adminPassword, role: 'admin' });
  }
  if (!(await User.exists({ email: 'demo@shopnest.dev' }))) {
    await User.create({ name: 'Demo Customer', email: 'demo@shopnest.dev', password: 'Demo@123' });
  }

  // Demo coupons (only created if missing, so admin edits are kept)
  const coupons = [
    { code: 'WELCOME10', type: 'percent', value: 10, maxDiscount: 500, minOrder: 999, description: '10% off your order, up to ₹500' },
    { code: 'FLAT250', type: 'flat', value: 250, minOrder: 2999, description: '₹250 off orders over ₹2,999' },
    { code: 'MEGA15', type: 'percent', value: 15, maxDiscount: 3000, minOrder: 20000, description: '15% off big buys, up to ₹3,000' },
  ];
  for (const c of coupons) if (!(await Coupon.exists({ code: c.code }))) await Coupon.create(c);

  const withPhotos = demoProducts.filter((p) => findImage(slugify(p.name))).length;
  console.log(`[seed] ${demoProducts.length} products loaded (${withPhotos} with photos), ${await Review.countDocuments()} sample reviews`);
  console.log(`[seed] admin login: ${env.adminEmail} / ${env.adminPassword}`);
  console.log('[seed] customer login: demo@shopnest.dev / Demo@123');
}

// Allow "npm run seed" to run this file directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { connectDB, disconnectDB } = await import('../config/db.js');
  await connectDB();
  await Order.deleteMany({});
  await seedDatabase();
  await disconnectDB();
}
