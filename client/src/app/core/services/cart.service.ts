import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { AppliedCoupon, CartItem, Product } from '../models';
import { readJson, safeSet } from './auth.service';
import { ShopService } from './shop.service';

const CART_KEY = 'shopnest.cart';
const MAX_QTY = 10;

@Injectable({ providedIn: 'root' })
export class CartService {
  private shop = inject(ShopService);
  private readonly _items = signal<CartItem[]>(readJson<CartItem[]>(CART_KEY) ?? []);

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((n, i) => n + i.qty, 0));
  readonly subtotal = computed(() => this._items().reduce((s, i) => s + i.price * i.qty, 0));
  readonly savings = computed(() => this._items().reduce((s, i) => s + (i.mrp - i.price) * i.qty, 0));
  readonly shipping = computed(() => {
    const cfg = this.shop.paymentConfig();
    if (!this._items().length) return 0;
    return this.subtotal() >= cfg.freeShippingAbove ? 0 : cfg.shippingFee;
  });
  /** Coupon applied at checkout. The server checks it again when the order is placed. */
  readonly coupon = signal<AppliedCoupon | null>(null);
  readonly couponNotice = signal('');
  readonly discount = computed(() => Math.min(this.coupon()?.discount ?? 0, this.subtotal()));
  readonly total = computed(() => this.subtotal() - this.discount() + this.shipping());
  readonly amountToFreeShipping = computed(() => Math.max(0, this.shop.paymentConfig().freeShippingAbove - this.subtotal()));

  constructor() {
    // Keep the cart in localStorage so it survives page reloads
    effect(() => safeSet(CART_KEY, JSON.stringify(this._items())));

    // When the bag changes, re-check the coupon (the discount or minimum order may change)
    effect(() => {
      const items = this._items();
      const code = untracked(() => this.coupon()?.code);
      if (!code) return;
      if (!items.length) { this.coupon.set(null); return; }
      untracked(() => this.applyCoupon(code).subscribe({
        error: (e) => {
          this.coupon.set(null);
          this.couponNotice.set(`${code} was removed: ${e?.error?.message ?? 'it no longer applies'}`);
        },
      }));
    });
  }

  lines(): { productId: string; qty: number }[] {
    return this._items().map((i) => ({ productId: i.productId, qty: i.qty }));
  }

  applyCoupon(code: string): Observable<AppliedCoupon> {
    return this.shop.validateCoupon(code, this.lines()).pipe(
      map(({ code: c, discount, summary }) => ({ code: c, discount, summary })),
      tap((applied) => { this.coupon.set(applied); this.couponNotice.set(''); })
    );
  }

  removeCoupon(): void {
    this.coupon.set(null);
    this.couponNotice.set('');
  }

  maxQty(item: { stock: number }): number {
    return Math.min(MAX_QTY, item.stock);
  }

  qtyOf(productId: string): number {
    return this._items().find((i) => i.productId === productId)?.qty ?? 0;
  }

  add(p: Product, qty = 1): void {
    if (p.stock <= 0) return;
    this._items.update((items) => {
      const existing = items.find((i) => i.productId === p._id);
      if (existing) {
        return items.map((i) =>
          i.productId === p._id ? { ...i, stock: p.stock, price: p.price, image: p.image, qty: Math.min(i.qty + qty, this.maxQty(p)) } : i
        );
      }
      const item: CartItem = {
        productId: p._id, slug: p.slug, name: p.name, brand: p.brand, price: p.price, mrp: p.mrp,
        icon: p.icon, color: p.color, image: p.image, stock: p.stock, qty: Math.min(qty, this.maxQty(p)),
      };
      return [...items, item];
    });
  }

  setQty(productId: string, qty: number): void {
    if (qty <= 0) return this.remove(productId);
    this._items.update((items) => items.map((i) => (i.productId === productId ? { ...i, qty: Math.min(qty, this.maxQty(i)) } : i)));
  }

  remove(productId: string): void {
    this._items.update((items) => items.filter((i) => i.productId !== productId));
  }

  clear(): void {
    this.coupon.set(null);
    this._items.set([]);
  }
}
