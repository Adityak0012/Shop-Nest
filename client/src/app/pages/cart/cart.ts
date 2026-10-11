import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { InrPipe } from '../../shared/inr.pipe';
import { OrderSummary } from './order-summary';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, InrPipe, OrderSummary],
  template: `
    <div class="container py-4">
      <h1 class="h2 mb-4">Your bag @if (cart.count()) { <span class="text-muted fs-5 fw-semibold">({{ cart.count() }} items)</span> }</h1>

      @if (cart.items().length === 0) {
        <div class="surface empty-state">
          <div class="empty-icon"><i class="bi bi-bag"></i></div>
          <h2 class="h5">Your bag is empty</h2>
          <p class="text-muted">Find something you like and it will show up here.</p>
          <a routerLink="/shop" class="btn btn-primary">Start shopping</a>
        </div>
      } @else {
        <div class="row g-4">
          <section class="col-lg-8" aria-label="Cart items">
            @if (cart.amountToFreeShipping() > 0) {
              <div class="alert alert-light border d-flex align-items-center gap-2 mb-3">
                <i class="bi bi-truck text-primary fs-5"></i>
                <span>Add <strong>{{ cart.amountToFreeShipping() | inr }}</strong> more to get <strong>free delivery</strong>.</span>
              </div>
            } @else {
              <div class="alert border-0 d-flex align-items-center gap-2 mb-3" style="background:#ecfdf5;color:#166534">
                <i class="bi bi-check-circle-fill"></i><span>Your order qualifies for <strong>free delivery</strong>.</span>
              </div>
            }

            <div class="surface">
              @for (i of cart.items(); track i.productId; let last = $last) {
                <div class="d-flex gap-3 p-3" [class.border-bottom]="!last">
                  <a [routerLink]="['/product', i.slug]" class="flex-shrink-0" style="width: 5.5rem" [attr.aria-label]="i.name">
                    <div class="icon-tile" [style.--tile]="i.color"><i class="bi" [class]="i.icon" style="font-size:2.25rem"></i>@if (i.image) { <img [src]="i.image" alt="" loading="lazy" (error)="$any($event.target).remove()"> }</div>
                  </a>
                  <div class="flex-grow-1 min-w-0">
                    <div class="d-flex justify-content-between gap-2">
                      <div class="min-w-0">
                        <p class="small text-muted mb-0">{{ i.brand }}</p>
                        <a [routerLink]="['/product', i.slug]" class="fw-semibold text-reset d-block text-truncate">{{ i.name }}</a>
                      </div>
                      <div class="text-end">
                        <div class="fw-bold">{{ i.price * i.qty | inr }}</div>
                        @if (i.qty > 1) { <div class="small text-muted">{{ i.price | inr }} each</div> }
                      </div>
                    </div>
                    <div class="d-flex align-items-center justify-content-between mt-2">
                      <div class="qty-stepper" role="group" [attr.aria-label]="'Quantity of ' + i.name">
                        <button type="button" (click)="cart.setQty(i.productId, i.qty - 1)" [attr.aria-label]="i.qty === 1 ? 'Remove' : 'Decrease'">
                          <i class="bi" [class]="i.qty === 1 ? 'bi-trash3' : 'bi-dash'"></i>
                        </button>
                        <span>{{ i.qty }}</span>
                        <button type="button" (click)="cart.setQty(i.productId, i.qty + 1)" [disabled]="i.qty >= cart.maxQty(i)" aria-label="Increase"><i class="bi bi-plus"></i></button>
                      </div>
                      <button type="button" class="btn btn-link btn-sm text-danger text-decoration-none" (click)="cart.remove(i.productId)">
                        <i class="bi bi-trash3 me-1"></i>Remove
                      </button>
                    </div>
                    @if (i.qty >= cart.maxQty(i)) { <p class="small text-muted mb-0 mt-1">Maximum quantity for this item</p> }
                  </div>
                </div>
              }
            </div>
            <a routerLink="/shop" class="d-inline-block mt-3 fw-semibold"><i class="bi bi-arrow-left me-1"></i>Continue shopping</a>
          </section>

          <aside class="col-lg-4">
            <app-order-summary>
              <button type="button" class="btn btn-primary btn-lg w-100 mt-3" (click)="checkout()">
                {{ auth.isLoggedIn() ? 'Proceed to checkout' : 'Log in to checkout' }} <i class="bi bi-arrow-right ms-1"></i>
              </button>
              <p class="small text-muted text-center mt-2 mb-0"><i class="bi bi-ticket-perforated me-1"></i>Have a coupon? Apply it at checkout</p>
            </app-order-summary>
          </aside>
        </div>
      }
    </div>
  `,
  styles: `.min-w-0 { min-width: 0; }`,
})
export class Cart {
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  private router = inject(Router);

  checkout(): void {
    this.router.navigateByUrl('/checkout'); // authGuard sends guests to login, then back here
  }
}
