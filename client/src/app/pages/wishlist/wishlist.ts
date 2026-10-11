import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, errorMessage } from '../../core/models';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductCard } from '../../shared/product-card/product-card';

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, ProductCard],
  template: `
    <div class="container py-4 py-lg-5">
      <div class="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div>
          <p class="eyebrow mb-2">Saved for later</p>
          <h1 class="mb-0" style="font-size: clamp(2.2rem, 4vw, 3.25rem); font-weight: 400">My wishlist</h1>
          @if (!loading() && visible().length) { <p class="text-muted small mt-2 mb-0">{{ visible().length }} {{ visible().length === 1 ? 'item' : 'items' }}</p> }
        </div>
        @if (inStock().length) {
          <button type="button" class="btn btn-primary" (click)="addAllToBag()"><i class="bi bi-bag-plus me-1"></i>Add {{ inStock().length }} in-stock to bag</button>
        }
      </div>

      @if (loading()) {
        <div class="row row-cols-2 row-cols-md-4 gx-3 gx-md-4 gy-5">
          @for (i of [1,2,3,4]; track i) { <div class="col"><div class="skeleton" style="aspect-ratio: 4/5"></div></div> }
        </div>
      } @else if (error()) {
        <div class="surface empty-state"><p class="text-muted">{{ error() }}</p><button class="btn btn-primary" (click)="load()">Try again</button></div>
      } @else if (visible().length === 0) {
        <div class="surface empty-state">
          <div class="empty-icon"><i class="bi bi-heart"></i></div>
          <h2 class="h4">Your wishlist is empty</h2>
          <p class="text-muted">Tap the heart on any product to save it here for later.</p>
          <a routerLink="/shop" class="btn btn-primary">Discover products</a>
        </div>
      } @else {
        <div class="row row-cols-2 row-cols-md-3 row-cols-xl-4 gx-3 gx-md-4 gy-5">
          @for (p of visible(); track p._id) { <div class="col fade-in"><app-product-card [product]="p" /></div> }
        </div>
      }
    </div>
  `,
})
export class Wishlist {
  private wishlist = inject(WishlistService);
  private cart = inject(CartService);
  private toast = inject(ToastService);

  private readonly items = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  /** Hide items as soon as they are un-hearted on this page */
  readonly visible = computed(() => this.items().filter((p) => this.wishlist.has(p._id)));
  readonly inStock = computed(() => this.visible().filter((p) => p.stock > 0));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.wishlist.list().subscribe({
      next: ({ items }) => { this.items.set(items); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }

  addAllToBag(): void {
    const list = this.inStock();
    list.forEach((p) => this.cart.add(p));
    this.toast.success(`Added ${list.length} items to your bag`, { label: 'View bag', link: '/cart' });
  }
}
