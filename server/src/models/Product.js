import mongoose from 'mongoose';

export const CATEGORIES = ['Mobiles', 'Laptops', 'Audio', 'Wearables', 'Gaming', 'Home & Kitchen', 'Fashion', 'Books', 'Sports'];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, maxlength: 2000 },
    brand: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: CATEGORIES, index: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sold: { type: Number, default: 0 },
    // Fallback look when there is no photo: a Bootstrap Icon on a coloured tile.
    icon: { type: String, default: 'bi-box-seam' },
    color: { type: String, default: '#4F46E5' },
    // Optional photo path, e.g. /images/products/<slug>.jpg (served by the Angular app). Empty = show the icon.
    image: { type: String, default: '', trim: true, maxlength: 300 },
    // Extra gallery photos shown as thumbnails on the product page
    images: { type: [{ type: String, trim: true, maxlength: 300 }], default: [] },
    rating: { type: Number, min: 0, max: 5, default: 4 },
    numReviews: { type: Number, default: 0 },
    highlights: [{ type: String }],
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const Product = mongoose.model('Product', productSchema);
