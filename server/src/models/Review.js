import mongoose from 'mongoose';
import { Product } from './Product.js';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true }, // reviewer's display name at the time of writing
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 80 },
    comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    verified: { type: Boolean, default: false }, // bought this product
  },
  { timestamps: true }
);

// One review per customer per product (they can edit it)
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

/** Recomputes a product's average rating and review count from its reviews. */
reviewSchema.statics.refreshProductRating = async function (productId) {
  const reviews = await this.find({ product: productId }).select('rating').lean();
  const numReviews = reviews.length;
  const rating = numReviews ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / numReviews) * 10) / 10 : 0;
  await Product.updateOne({ _id: productId }, { rating, numReviews });
  return { rating, numReviews };
};

export const Review = mongoose.model('Review', reviewSchema);
