import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminStats, Category, CreateOrderResponse, Order, OrderStatus, Paged, PaymentConfig, PaymentMethod, Product,
  ProductQuery, Address, Review, ReviewPage, CouponOffer, AppliedCoupon, AdminCoupon,
} from '../models';

/** All REST calls for products, orders and the admin area. */
@Injectable({ providedIn: 'root' })
export class ShopService {
  private http = inject(HttpClient);

  readonly paymentConfig = signal<PaymentConfig>({ razorpay: false, keyId: null, freeShippingAbove: 999, shippingFee: 49 });

  loadPaymentConfig(): void {
    this.http.get<PaymentConfig>('/api/orders/payment-config').subscribe({ next: (c) => this.paymentConfig.set(c), error: () => {} });
  }

  // ---------- Products ----------
  getProducts(q: ProductQuery): Observable<Paged<Product>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(q)) {
      if (v !== undefined && v !== null && v !== '' && v !== false) params = params.set(k, String(v));
    }
    return this.http.get<Paged<Product>>('/api/products', { params });
  }

  suggest(q: string): Observable<{ products: Product[]; categories: string[] }> {
    return this.http.get<{ products: Product[]; categories: string[] }>('/api/products/suggest', { params: { q } });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/products/categories');
  }

  getProduct(slug: string): Observable<{ product: Product; related: Product[] }> {
    return this.http.get<{ product: Product; related: Product[] }>(`/api/products/${encodeURIComponent(slug)}`);
  }

  createProduct(body: Partial<Product>): Observable<Product> {
    return this.http.post<Product>('/api/products', body);
  }

  updateProduct(id: string, body: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`/api/products/${id}`, body);
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/products/${id}`);
  }

  // ---------- Reviews ----------
  getReviews(productId: string, opts: { sort: string; page: number; stars?: number | null }): Observable<ReviewPage> {
    let params = new HttpParams().set('sort', opts.sort).set('page', opts.page);
    if (opts.stars) params = params.set('stars', opts.stars);
    return this.http.get<ReviewPage>(`/api/products/${productId}/reviews`, { params });
  }

  myReview(productId: string): Observable<{ canReview: boolean; review: Review | null }> {
    return this.http.get<{ canReview: boolean; review: Review | null }>(`/api/products/${productId}/reviews/mine`);
  }

  saveReview(productId: string, body: { rating: number; title?: string; comment: string }): Observable<{ review: Review; rating: number; numReviews: number }> {
    return this.http.post<{ review: Review; rating: number; numReviews: number }>(`/api/products/${productId}/reviews`, body);
  }

  deleteReview(productId: string, reviewId: string): Observable<{ rating: number; numReviews: number }> {
    return this.http.delete<{ rating: number; numReviews: number }>(`/api/products/${productId}/reviews/${reviewId}`);
  }

  // ---------- Orders ----------
  createOrder(body: {
    items: { productId: string; qty: number }[];
    shippingAddress: Address;
    paymentMethod: PaymentMethod;
    couponCode?: string;
  }): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>('/api/orders', body);
  }

  verifyPayment(orderId: string, payload: Record<string, string>): Observable<{ order: Order }> {
    return this.http.post<{ order: Order }>(`/api/orders/${orderId}/verify`, payload);
  }

  myOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/orders/mine');
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`/api/orders/${id}`);
  }

  cancelOrder(id: string): Observable<{ order: Order }> {
    return this.http.post<{ order: Order }>(`/api/orders/${id}/cancel`, {});
  }

  // ---------- Coupons ----------
  offers(): Observable<CouponOffer[]> {
    return this.http.get<CouponOffer[]>('/api/coupons');
  }

  validateCoupon(code: string, items: { productId: string; qty: number }[]): Observable<AppliedCoupon & { itemsTotal: number }> {
    return this.http.post<AppliedCoupon & { itemsTotal: number }>('/api/coupons/validate', { code, items });
  }

  adminCoupons(): Observable<AdminCoupon[]> {
    return this.http.get<AdminCoupon[]>('/api/coupons/admin');
  }

  saveCoupon(body: Partial<AdminCoupon>, id?: string): Observable<AdminCoupon> {
    return id ? this.http.put<AdminCoupon>(`/api/coupons/admin/${id}`, body) : this.http.post<AdminCoupon>('/api/coupons/admin', body);
  }

  setCouponActive(id: string, active: boolean): Observable<AdminCoupon> {
    return this.http.patch<AdminCoupon>(`/api/coupons/admin/${id}/active`, { active });
  }

  deleteCoupon(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/coupons/admin/${id}`);
  }

  // ---------- Admin ----------
  adminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>('/api/admin/stats');
  }

  adminOrders(status: string, page: number): Observable<Paged<Order>> {
    const params = new HttpParams({ fromObject: { page, ...(status ? { status } : {}) } });
    return this.http.get<Paged<Order>>('/api/admin/orders', { params });
  }

  updateOrderStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`/api/admin/orders/${id}/status`, { status });
  }

  updateStock(id: string, stock: number): Observable<Product> {
    return this.http.patch<Product>(`/api/admin/products/${id}/stock`, { stock });
  }
}
