export type Role = 'customer' | 'admin';

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  address?: Address;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  mrp: number;
  stock: number;
  sold: number;
  icon: string;
  color: string;
  /** Optional photo, e.g. /images/products/pulse-anc-headphones.jpg. Falls back to the icon tile. */
  image?: string;
  /** Extra gallery photos (product page only) */
  images?: string[];
  rating: number;
  numReviews: number;
  highlights: string[];
  featured: boolean;
  createdAt: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit?: number;
}

export interface Category {
  name: string;
  count: number;
}

export interface ProductQuery {
  search?: string;
  category?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStock?: boolean;
  featured?: boolean;
  sort?: SortKey;
  page?: number;
  limit?: number;
}

export type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  mrp: number;
  icon: string;
  color: string;
  image?: string;
  stock: number;
  qty: number;
}

export type OrderStatus = 'pending_payment' | 'placed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'razorpay' | 'cod';

export interface OrderItem {
  product: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  image?: string;
  price: number;
  qty: number;
  lineTotal: number;
}

export interface Order {
  _id: string;
  user: string | { _id: string; name: string; email: string };
  items: OrderItem[];
  shippingAddress: Address;
  itemsTotal: number;
  discount?: number;
  coupon?: { code: string; discount: number };
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  payment: { status: 'pending' | 'paid' | 'failed' | 'refunded'; razorpayOrderId?: string; razorpayPaymentId?: string; paidAt?: string };
  status: OrderStatus;
  createdAt: string;
}

export interface PaymentConfig {
  razorpay: boolean;
  keyId: string | null;
  freeShippingAbove: number;
  shippingFee: number;
}

export interface CreateOrderResponse {
  order: Order;
  razorpay?: { keyId: string; orderId: string; amount: number; currency: string };
}

export interface AdminStats {
  revenue: number;
  orders: number;
  products: number;
  customers: number;
  outOfStock: number;
  lowStockThreshold: number;
  lowStock: Pick<Product, '_id' | 'name' | 'stock' | 'icon' | 'color' | 'image' | 'slug'>[];
  recentOrders: Order[];
  ordersByStatus: Record<OrderStatus, number>;
  revenueByCategory: { category: string; revenue: number }[];
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  placed: 'Placed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STATUS_ICON: Record<OrderStatus, string> = {
  pending_payment: 'bi-hourglass-split',
  placed: 'bi-bag-check',
  shipped: 'bi-truck',
  delivered: 'bi-box2-heart',
  cancelled: 'bi-x-circle',
};

export const CATEGORY_ICON: Record<string, string> = {
  Mobiles: 'bi-phone',
  Laptops: 'bi-laptop',
  Audio: 'bi-headphones',
  Wearables: 'bi-smartwatch',
  Gaming: 'bi-controller',
  'Home & Kitchen': 'bi-house-heart',
  Fashion: 'bi-handbag',
  Books: 'bi-book',
  Sports: 'bi-bicycle',
};

/** Extracts a readable message from an HttpErrorResponse */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { status?: number; error?: { message?: string } };
  if (e?.status === 0) return 'Cannot reach the server. Is the API running on port 5000?';
  return e?.error?.message || fallback;
}

export const ORDER_STATUS_LIST: OrderStatus[] = ['pending_payment', 'placed', 'shipped', 'delivered', 'cancelled'];

/** Photo used for each category tile (falls back to the category icon if missing). */
export const CATEGORY_IMAGE: Record<string, string> = {
  Mobiles: '/images/products/orbit-fold-z.jpg',
  Laptops: '/images/products/aerobook-14-thin-light.jpg',
  Audio: '/images/products/pulse-anc-headphones.jpg',
  Wearables: '/images/products/fitpulse-smartwatch-3.jpg',
  Gaming: '/images/products/novaplay-wireless-controller.jpg',
  'Home & Kitchen': '/images/products/steelbrew-gooseneck-kettle.jpg',
  Fashion: '/images/products/stride-running-sneakers.jpg',
  Books: '/images/products/heritage-leather-journal.jpg',
  Sports: '/images/products/velocity-road-bicycle.jpg',
};

export interface Review {
  _id: string;
  userId: string;
  name: string;
  rating: number;
  title?: string;
  comment: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPage extends Paged<Review> {
  summary: { average: number; count: number; breakdown: Record<'1' | '2' | '3' | '4' | '5', number> };
}

export interface CouponOffer {
  code: string;
  description: string;
  summary: string;
  minOrder: number;
  expiresAt: string | null;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  summary: string;
}

export interface AdminCoupon {
  _id: string;
  code: string;
  description: string;
  type: 'percent' | 'flat';
  value: number;
  minOrder: number;
  maxDiscount: number;
  expiresAt: string | null;
  usageLimit: number;
  usedCount: number;
  onePerCustomer: boolean;
  active: boolean;
  summary: string;
}
