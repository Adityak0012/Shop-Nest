import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CouponOffer, errorMessage } from '../../../core/models';
import { CartService } from '../../../core/services/cart.service';
import { ShopService } from '../../../core/services/shop.service';
import { ToastService } from '../../../core/services/toast.service';
import { InrPipe } from '../../../shared/inr.pipe';

/** Coupon input plus the list of current offers, shown on the checkout page. */
@Component({
  selector: 'app-coupon-box',
  imports: [FormsModule, InrPipe],
  template: `
    <section class="coupon-box">
      <h2 class="h6 mb-3"><i class="bi bi-ticket-perforated me-2"></i>Offers & coupons</h2>

      @if (cart.coupon(); as c) {
        <div class="applied">
          <i class="bi bi-check-circle-fill"></i>
          <div class="flex-grow-1">
            <div class="fw-semibold"><span class="code">{{ c.code }}</span> applied</div>
            <div class="small">You save {{ c.discount | inr }} · {{ c.summary }}</div>
          </div>
          <button type="button" class="btn btn-link btn-sm text-reset" (click)="cart.removeCoupon()">Remove</button>
        </div>
      } @else {
        <form class="d-flex gap-2" (ngSubmit)="apply(code)">
          <label for="coupon" class="visually-hidden">Coupon code</label>
          <input id="coupon" name="coupon" class="form-control text-uppercase" placeholder="Enter coupon code" [(ngModel)]="code"
                 autocomplete="off" maxlength="20" [class.is-invalid]="error()" (ngModelChange)="error.set('')">
          <button type="submit" class="btn btn-outline-primary px-3" [disabled]="busy() || !code.trim()">
            @if (busy()) { <span class="spinner-border spinner-border-sm"></span> } @else { Apply }
          </button>
        </form>
        @if (error()) { <p class="small text-danger mt-2 mb-0" role="alert">{{ error() }}</p> }
      }
      @if (cart.couponNotice()) { <p class="small text-warning-emphasis mt-2 mb-0"><i class="bi bi-info-circle me-1"></i>{{ cart.couponNotice() }}</p> }

      @if (offers().length) {
        <ul class="list-unstyled offers mb-0 mt-3">
          @for (o of offers(); track o.code) {
            @let short = o.minOrder - cart.subtotal();
            <li [class.locked]="short > 0">
              <div class="flex-grow-1 min-w-0">
                <span class="code">{{ o.code }}</span>
                <div class="small mt-1">{{ o.description }}</div>
                @if (short > 0) { <div class="small text-muted">Add {{ short | inr }} more to unlock</div> }
              </div>
              @if (cart.coupon()?.code === o.code) {
                <span class="small fw-semibold text-success">Applied</span>
              } @else {
                <button type="button" class="btn btn-sm btn-light" [disabled]="short > 0 || busy()" (click)="apply(o.code)">Apply</button>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .coupon-box { background: var(--sn-surface); border: 1px solid #dcdcd8; border-radius: .75rem; padding: 1.25rem 1.5rem; }
    .code { font-weight: 700; letter-spacing: .08em; font-size: .78rem; border: 1px dashed #17171a; color: #17171a; border-radius: .35rem; padding: .15rem .45rem; }
    .applied { display: flex; align-items: center; gap: .75rem; background: rgba(27, 127, 85,0.12); color: #1b7f55; border-radius: .6rem; padding: .75rem .9rem; }
    .applied .bi { font-size: 1.2rem; }
    .offers li { display: flex; align-items: center; gap: .75rem; padding: .75rem 0; border-top: 1px solid #ecece9; }
    .offers li.locked { opacity: .65; }
    .min-w-0 { min-width: 0; }
  `,
})
export class CouponBox {
  readonly cart = inject(CartService);
  private shop = inject(ShopService);
  private toast = inject(ToastService);

  readonly offers = signal<CouponOffer[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  code = '';

  constructor() {
    this.shop.offers().subscribe({ next: (o) => this.offers.set(o), error: () => {} });
  }

  apply(code: string): void {
    const c = code.trim().toUpperCase();
    if (!c) return;
    this.busy.set(true);
    this.error.set('');
    this.cart.applyCoupon(c).subscribe({
      next: (applied) => {
        this.busy.set(false);
        this.code = '';
        this.toast.success(`${applied.code} applied. You save ₹${applied.discount.toLocaleString('en-IN')}!`);
      },
      error: (e) => { this.busy.set(false); this.error.set(errorMessage(e)); },
    });
  }
}
