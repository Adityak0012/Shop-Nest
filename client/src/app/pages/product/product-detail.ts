import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { Product, errorMessage } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductCard } from '../../shared/product-card/product-card';
import { InrPipe, discountPercent } from '../../shared/inr.pipe';
import { ProductReviews } from './reviews/product-reviews';
import { ProductGallery } from './gallery/product-gallery';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, ProductCard, InrPipe, ProductReviews, ProductGallery],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private shop = inject(ShopService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(Title);
  readonly cart = inject(CartService);
  private toast = inject(ToastService);
  readonly wishlist = inject(WishlistService);

  readonly product = signal<Product | null>(null);
  readonly related = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notFound = signal(false);
  readonly qty = signal(1);

  readonly discount = computed(() => { const p = this.product(); return p ? discountPercent(p.price, p.mrp) : 0; });
  readonly inCart = computed(() => { const p = this.product(); return p ? this.cart.qtyOf(p._id) : 0; });
  readonly canAdd = computed(() => { const p = this.product(); return !!p && p.stock > 0 && this.inCart() + this.qty() <= this.cart.maxQty(p); });
  readonly maxSelectable = computed(() => { const p = this.product(); return p ? Math.max(1, this.cart.maxQty(p) - this.inCart()) : 1; });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading.set(true);
          this.error.set('');
          this.notFound.set(false);
          this.qty.set(1);
          return this.shop.getProduct(params.get('slug') ?? '');
        }),
        takeUntilDestroyed()
      )
      .subscribe({
        next: ({ product, related }) => {
          this.product.set(product);
          this.related.set(related);
          this.title.setTitle(`${product.name} · ShopNest`);
          this.loading.set(false);
        },
        error: (e) => {
          this.notFound.set(e?.status === 404);
          this.error.set(errorMessage(e));
          this.loading.set(false);
        },
      });
  }

  onRatingChange(r: { rating: number; numReviews: number }): void {
    this.product.update((p) => (p ? { ...p, ...r } : p));
  }

  scrollToReviews(e: Event): void {
    e.preventDefault();
    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
  }

  changeQty(d: number): void {
    this.qty.update((q) => Math.min(this.maxSelectable(), Math.max(1, q + d)));
  }

  addToCart(goToCart = false): void {
    const p = this.product();
    if (!p) return;
    if (this.canAdd()) this.cart.add(p, this.qty());
    if (goToCart) {
      this.router.navigateByUrl('/cart');
    } else {
      this.toast.success(`Added ${this.qty()} × ${p.name} to your cart`, { label: 'View cart', link: '/cart' });
      this.qty.set(1);
    }
  }
}
