import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, match: /^[A-Z0-9]{3,20}$/ },
    description: { type: String, trim: true, maxlength: 120, default: '' },
    type: { type: String, enum: ['percent', 'flat'], required: true },
    value: { type: Number, required: true, min: 1 }, // percent (1-90) or rupees
    minOrder: { type: Number, default: 0, min: 0 }, // items total needed, in rupees
    maxDiscount: { type: Number, default: 0, min: 0 }, // cap for percent coupons, 0 = no cap
    expiresAt: { type: Date, default: null },
    usageLimit: { type: Number, default: 0, min: 0 }, // total uses allowed, 0 = unlimited
    usedCount: { type: Number, default: 0, min: 0 },
    onePerCustomer: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/** Rupee discount this coupon gives on an items total (no eligibility checks). */
couponSchema.methods.discountFor = function (itemsTotal) {
  let d = this.type === 'percent' ? Math.floor((itemsTotal * this.value) / 100) : this.value;
  if (this.type === 'percent' && this.maxDiscount > 0) d = Math.min(d, this.maxDiscount);
  return Math.max(0, Math.min(d, itemsTotal));
};

/** Short text like "10% off up to ₹500 on orders over ₹999" */
couponSchema.methods.summary = function () {
  const inr = (n) => `₹${n.toLocaleString('en-IN')}`;
  const off = this.type === 'percent' ? `${this.value}% off${this.maxDiscount ? ` up to ${inr(this.maxDiscount)}` : ''}` : `${inr(this.value)} off`;
  return `${off}${this.minOrder ? ` on orders over ${inr(this.minOrder)}` : ''}`;
};

export const Coupon = mongoose.model('Coupon', couponSchema);
