import { Component, inject, input } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { InrPipe } from '../../shared/inr.pipe';

/** Price breakdown used on the cart and checkout pages. */
@Component({
  selector: 'app-order-summary',
  imports: [InrPipe],
  template: `
    <div class="surface p-3 p-md-4 summary">
      <h2 class="h5 mb-3">{{ heading() }}</h2>
      <dl class="mb-0">
        <div class="row-line"><dt>Items ({{ cart.count() }})</dt><dd>{{ cart.subtotal() + cart.savings() | inr }}</dd></div>
        @if (cart.savings() > 0) {
          <div class="row-line text-success"><dt>Discount</dt><dd>− {{ cart.savings() | inr }}</dd></div>
        }
        @if (cart.coupon(); as c) {
          <div class="row-line text-success"><dt>Coupon <span class="coupon-pill">{{ c.code }}</span></dt><dd>− {{ cart.discount() | inr }}</dd></div>
        }
        <div class="row-line"><dt>Delivery</dt>
          <dd>@if (cart.shipping() === 0) { <span class="text-success fw-semibold">Free</span> } @else { {{ cart.shipping() | inr }} }</dd>
        </div>
        <hr>
        <div class="row-line fs-5 fw-800"><dt>Total</dt><dd>{{ cart.total() | inr }}</dd></div>
      </dl>
      @if (cart.savings() + cart.discount() > 0) {
        <p class="small fw-semibold text-success mb-0 mt-2"><i class="bi bi-tag me-1"></i>You save {{ cart.savings() + cart.discount() | inr }} on this order</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .summary { position: sticky; top: 6rem; }
    .row-line { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: .5rem; }
    dt { font-weight: inherit; } dd { margin: 0; }
    .coupon-pill { font-size: .7rem; font-weight: 700; letter-spacing: .06em; border: 1px dashed currentColor; border-radius: .3rem; padding: .05rem .35rem; margin-left: .25rem; }
  `,
})
export class OrderSummary {
  readonly cart = inject(CartService);
  readonly heading = input('Order summary');
}
