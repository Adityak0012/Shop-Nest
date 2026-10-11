import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/models';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { InrPipe, discountPercent } from '../inr.pipe';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, InrPipe],
  template: `
    @let p = product();
    <article class="product-card position-relative">
      <div class="media">
        <div class="icon-tile" [style.--tile]="p.color">
          <i class="bi" [class]="p.icon" aria-hidden="true"></i>
          @if (p.image) { <img [src]="p.image" [alt]="p.name" loading="lazy" (error)="$any($event.target).remove()"> }
        </div>
        <div class="position-absolute top-0 start-0 m-2 d-flex flex-column align-items-start gap-1 z-2">
          @if (p.stock === 0) { <span class="tag">Sold out</span> }
          @else if (discount() >= 30) { <span class="tag tag-ink">−{{ discount() }}%</span> }
          @else if (discount() > 0) { <span class="tag tag-deal">−{{ discount() }}%</span> }
          @if (p.featured && p.stock > 0) { <span class="tag">Bestseller</span> }
        </div>
        <button type="button" class="heart-btn" [class.on]="saved()" (click)="wishlist.toggle(p)"
                [attr.aria-pressed]="saved()" [attr.aria-label]="(saved() ? 'Remove ' : 'Save ') + p.name + (saved() ? ' from wishlist' : ' to wishlist')">
          <i class="bi" [class]="saved() ? 'bi-heart-fill' : 'bi-heart'" aria-hidden="true"></i>
        </button>
        @if (p.stock > 0) {
          <div class="quick-add">
            <button type="button" class="btn w-100 btn-sm py-2"
                    [class]="inCart() ? 'btn-light' : 'btn-primary'"
                    [disabled]="inCart() >= maxQty()" (click)="add()"
                    [attr.aria-label]="'Add ' + p.name + ' to bag'">
              @if (inCart()) { <i class="bi bi-check2 me-1"></i>{{ inCart() }} in bag } @else { <i class="bi bi-bag-plus me-1"></i>Add to bag }
            </button>
          </div>
        }
      </div>
      <p class="brand">{{ p.brand }}</p>
      <h3 class="title"><a [routerLink]="['/product', p.slug]" class="stretched-link text-reset">{{ p.name }}</a></h3>
      <div class="d-flex align-items-center gap-2 mb-1">
        <span class="price">{{ p.price | inr }}</span>
        @if (p.mrp > p.price) { <span class="mrp">{{ p.mrp | inr }}</span> }
      </div>
      <div class="d-flex align-items-center gap-2 small">
        <span class="rating-pill"><i class="bi bi-star-fill" aria-hidden="true"></i>{{ p.rating.toFixed(1) }}</span>
        <span class="text-muted">({{ p.numReviews.toLocaleString('en-IN') }})</span>
        @if (p.stock > 0 && p.stock <= 5) { <span class="ms-auto small fw-semibold" style="color:#8a4b08">Only {{ p.stock }} left</span> }
      </div>
    </article>
  `,
})
export class ProductCard {
  private cart = inject(CartService);
  private toast = inject(ToastService);
  readonly wishlist = inject(WishlistService);

  readonly product = input.required<Product>();
  readonly discount = computed(() => discountPercent(this.product().price, this.product().mrp));
  readonly inCart = computed(() => this.cart.qtyOf(this.product()._id));
  readonly maxQty = computed(() => this.cart.maxQty(this.product()));
  readonly saved = computed(() => this.wishlist.has(this.product()._id));

  add(): void {
    this.cart.add(this.product());
    this.toast.success(`Added ${this.product().name} to your bag`, { label: 'View bag', link: '/cart' });
  }
}
