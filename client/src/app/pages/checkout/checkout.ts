import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Address, PaymentMethod, errorMessage } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ShopService } from '../../core/services/shop.service';
import { RazorpayService } from '../../core/services/razorpay.service';
import { ToastService } from '../../core/services/toast.service';
import { OrderSummary } from '../cart/order-summary';
import { CouponBox } from './coupon-box/coupon-box';
import { InrPipe } from '../../shared/inr.pipe';

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, OrderSummary, InrPipe, CouponBox],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private shop = inject(ShopService);
  private razorpay = inject(RazorpayService);
  private toast = inject(ToastService);
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);

  readonly states = INDIAN_STATES;
  readonly payment = computed(() => this.shop.paymentConfig());
  readonly placing = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(60)]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    line1: ['', [Validators.required, Validators.maxLength(120)]],
    line2: ['', [Validators.maxLength(120)]],
    city: ['', [Validators.required, Validators.maxLength(60)]],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    paymentMethod: ['cod' as PaymentMethod, Validators.required],
  });

  constructor() {
    const u = this.auth.user();
    this.form.patchValue({ fullName: u?.name ?? '', ...(u?.address ?? {}) });
    // Prefer online payment once we know Razorpay is configured (config loads asynchronously)
    effect(() => {
      if (this.payment().razorpay && !this.form.controls.paymentMethod.dirty) this.form.controls.paymentMethod.setValue('razorpay');
    });
  }

  /** Show a field error after the user leaves the field or presses Place order. */
  invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  placeOrder(): void {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      document.querySelector<HTMLElement>('.is-invalid')?.focus();
      return;
    }
    if (!this.cart.items().length) return;

    const { paymentMethod, ...address } = this.form.getRawValue();
    this.placing.set(true);

    this.shop
      .createOrder({
        items: this.cart.items().map((i) => ({ productId: i.productId, qty: i.qty })),
        shippingAddress: address as Address,
        paymentMethod,
        couponCode: this.cart.coupon()?.code,
      })
      .subscribe({
        next: async ({ order, razorpay }) => {
          this.auth.setAddress(address as Address);
          this.cart.clear(); // stock is now reserved for this order
          if (!razorpay) {
            this.router.navigate(['/orders', order._id], { queryParams: { placed: 1 } });
            return;
          }
          try {
            const res = await this.razorpay.pay({
              key: razorpay.keyId,
              amount: razorpay.amount,
              currency: razorpay.currency,
              order_id: razorpay.orderId,
              name: 'ShopNest',
              description: `Order #${order._id.slice(-6).toUpperCase()}`,
              prefill: { name: address.fullName, email: this.auth.user()?.email, contact: address.phone },
              theme: { color: '#0b1530' },
            });
            this.shop.verifyPayment(order._id, { ...res }).subscribe({
              next: () => this.router.navigate(['/orders', order._id], { queryParams: { placed: 1 } }),
              error: (e) => {
                this.toast.error(errorMessage(e));
                this.router.navigate(['/orders', order._id]);
              },
            });
          } catch (e) {
            this.toast.show((e as Error).message + '. Your order is saved, you can pay from the order page.', 'info');
            this.router.navigate(['/orders', order._id]);
          }
        },
        error: (e) => {
          const msg = errorMessage(e);
          const c = this.cart.coupon();
          if (c && msg.includes(c.code)) this.cart.removeCoupon(); // coupon no longer valid, drop it so the next try works
          this.error.set(msg);
          this.placing.set(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      });
  }
}
