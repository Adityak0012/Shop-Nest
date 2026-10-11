import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending_payment', 'placed', 'shipped', 'delivered', 'cancelled'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    category: String,
    icon: String,
    color: String,
    image: String,
    price: Number, // price at the time of purchase
    qty: { type: Number, min: 1 },
    lineTotal: Number, // price x qty
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    itemsTotal: Number,
    discount: { type: Number, default: 0 },
    coupon: { code: String, discount: Number },
    shipping: Number,
    total: Number,
    paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
    payment: {
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      paidAt: Date,
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending_payment', index: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);
