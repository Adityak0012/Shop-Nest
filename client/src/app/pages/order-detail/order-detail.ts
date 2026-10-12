import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Order, OrderStatus, STATUS_ICON, STATUS_LABEL, errorMessage } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { AuthService } from '../../core/services/auth.service';
import { RazorpayService } from '../../core/services/razorpay.service';
import { ToastService } from '../../core/services/toast.service';
import { InrPipe } from '../../shared/inr.pipe';

const STEPS: OrderStatus[] = ['placed', 'shipped', 'delivered'];

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, DatePipe, InrPipe],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.scss',
})
export class OrderDetail {
  private route = inject(ActivatedRoute);
  private shop = inject(ShopService);
  private auth = inject(AuthService);
  private razorpay = inject(RazorpayService);
  private toast = inject(ToastService);

  readonly statusLabel = STATUS_LABEL;
  readonly statusIcon = STATUS_ICON;
  readonly steps = STEPS;
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly confirmCancel = signal(false);
  readonly justPlaced = this.route.snapshot.queryParamMap.get('placed') === '1';
  readonly canPayOnline = computed(() => this.shop.paymentConfig().razorpay);

  readonly stepIndex = computed(() => {
    const s = this.order()?.status;
    return s ? STEPS.indexOf(s) : -1;
  });
  readonly canCancel = computed(() => ['pending_payment', 'placed'].includes(this.order()?.status ?? ''));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.shop.getOrder(this.route.snapshot.paramMap.get('id') ?? '').subscribe({
      next: (o) => { this.order.set(o); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }

  cancel(): void {
    const o = this.order();
    if (!o) return;
    this.busy.set(true);
    this.shop.cancelOrder(o._id).subscribe({
      next: ({ order }) => {
        this.order.set({ ...o, ...order, user: o.user });
        this.busy.set(false);
        this.confirmCancel.set(false);
        this.toast.success('Your order was cancelled');
      },
      error: (e) => { this.toast.error(errorMessage(e)); this.busy.set(false); },
    });
  }

  /** Retry Razorpay for an order that was saved but not paid. */
  async payNow(): Promise<void> {
    const o = this.order();
    const keyId = this.shop.paymentConfig().keyId;
    if (!o?.payment.razorpayOrderId || !keyId) return;
    this.busy.set(true);
    try {
      const res = await this.razorpay.pay({
        key: keyId,
        amount: Math.round(o.total * 100),
        currency: 'INR',
        order_id: o.payment.razorpayOrderId,
        name: 'ShopNest',
        description: `Order #${o._id.slice(-6).toUpperCase()}`,
        prefill: { name: o.shippingAddress.fullName, email: this.auth.user()?.email, contact: o.shippingAddress.phone },
        theme: { color: '#111113' },
      });
      this.shop.verifyPayment(o._id, { ...res }).subscribe({
        next: ({ order }) => { this.order.set({ ...o, ...order, user: o.user }); this.toast.success('Payment received. Thank you!'); this.busy.set(false); },
        error: (e) => { this.toast.error(errorMessage(e)); this.busy.set(false); },
      });
    } catch (e) {
      this.toast.show((e as Error).message, 'info');
      this.busy.set(false);
    }
  }
}
