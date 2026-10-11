import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ORDER_STATUS_LIST, Order, OrderStatus, Paged, STATUS_ICON, STATUS_LABEL, errorMessage } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { ToastService } from '../../core/services/toast.service';
import { InrPipe } from '../../shared/inr.pipe';
import { Pagination } from '../../shared/pagination/pagination';

/** Allowed next steps, mirrors the API rules */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled'],
  placed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};
const ACTION_LABEL: Partial<Record<OrderStatus, string>> = { shipped: 'Mark shipped', delivered: 'Mark delivered', cancelled: 'Cancel' };

@Component({
  selector: 'app-admin-orders',
  imports: [DatePipe, RouterLink, InrPipe, Pagination],
  template: `
    <h1 class="h2 mb-3">Orders</h1>

    <div class="d-flex gap-2 overflow-auto pb-2 mb-2" role="tablist" aria-label="Filter by status">
      <button type="button" class="tab" role="tab" [class.active]="status() === ''" [attr.aria-selected]="status() === ''" (click)="setStatus('')">All</button>
      @for (s of statuses; track s) {
        <button type="button" class="tab" role="tab" [class.active]="status() === s" [attr.aria-selected]="status() === s" (click)="setStatus(s)">
          <i class="bi" [class]="statusIcon[s]"></i>{{ statusLabel[s] }}
        </button>
      }
    </div>

    @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }

    <div class="surface">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr class="small text-muted"><th class="ps-3">Order</th><th>Customer</th><th>Items</th><th class="text-end">Total</th><th>Payment</th><th>Status</th><th class="text-end pe-3">Update</th></tr>
          </thead>
          <tbody [class.opacity-50]="loading()">
            @if (loading() && !result()) {
              @for (i of [1,2,3,4]; track i) { <tr><td colspan="7" class="p-3"><div class="skeleton" style="height:2.25rem"></div></td></tr> }
            }
            @for (o of result()?.items ?? []; track o._id) {
              <tr>
                <td class="ps-3">
                  <a [routerLink]="['/orders', o._id]" class="fw-semibold">#{{ o._id.slice(-6).toUpperCase() }}</a>
                  <div class="small text-muted">{{ o.createdAt | date: 'd MMM y, h:mm a' }}</div>
                </td>
                <td>
                  <div class="small fw-semibold">{{ $any(o.user)?.name ?? '—' }}</div>
                  <div class="small text-muted">{{ o.shippingAddress.city }}, {{ o.shippingAddress.pincode }}</div>
                </td>
                <td>
                  <div class="d-flex gap-1">
                    @for (i of o.items.slice(0, 3); track i.product) {
                      <div class="icon-tile tile-xs" [style.--tile]="i.color" [title]="i.qty + ' × ' + i.name"><i class="bi" [class]="i.icon"></i>@if (i.image) { <img [src]="i.image" alt="" loading="lazy" (error)="$any($event.target).remove()"> }</div>
                    }
                    @if (o.items.length > 3) { <span class="small text-muted align-self-center">+{{ o.items.length - 3 }}</span> }
                  </div>
                </td>
                <td class="text-end fw-semibold">{{ o.total | inr }}</td>
                <td class="small">
                  {{ o.paymentMethod === 'cod' ? 'COD' : 'Online' }} ·
                  <span class="text-capitalize" [class.text-success]="o.payment.status === 'paid'">{{ o.payment.status }}</span>
                </td>
                <td><span class="status" [class]="'status-' + o.status">{{ statusLabel[o.status] }}</span></td>
                <td class="text-end pe-3">
                  @for (n of next[o.status]; track n) {
                    <button type="button" class="btn btn-sm ms-1" [class]="n === 'cancelled' ? 'btn-outline-danger' : 'btn-outline-primary'"
                            [disabled]="busyId() === o._id" (click)="setOrderStatus(o, n)">{{ actionLabel[n] }}</button>
                  } @empty { <span class="small text-muted">—</span> }
                </td>
              </tr>
            } @empty {
              @if (!loading()) { <tr><td colspan="7" class="text-center text-muted py-5">No orders {{ status() ? 'with this status' : 'yet' }}.</td></tr> }
            }
          </tbody>
        </table>
      </div>
    </div>
    @if (result(); as r) { <app-pagination [page]="r.page" [pages]="r.pages" (pageChange)="load($event)" /> }
  `,
  styles: `
    td, th { white-space: nowrap; }
    .tab { display: inline-flex; align-items: center; gap: .4rem; border: 1px solid #e1e8f5; background: #fff; border-radius: 999px;
      padding: .45rem .9rem; font-weight: 600; font-size: .85rem; color: #3d4863; white-space: nowrap; min-height: 2.5rem; }
    .tab:hover { border-color: #0b1530; }
    .tab.active { background: #0b1530; border-color: #0b1530; color: #fff; }
  `,
})
export class AdminOrders {
  private shop = inject(ShopService);
  private toast = inject(ToastService);

  readonly statuses = ORDER_STATUS_LIST;
  readonly statusLabel = STATUS_LABEL;
  readonly statusIcon = STATUS_ICON;
  readonly next = NEXT;
  readonly actionLabel = ACTION_LABEL;
  readonly status = signal<OrderStatus | ''>('');
  readonly result = signal<Paged<Order> | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly busyId = signal<string | null>(null);

  constructor() {
    this.load(1);
  }

  setStatus(s: OrderStatus | ''): void {
    this.status.set(s);
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.error.set('');
    this.shop.adminOrders(this.status(), page).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }

  setOrderStatus(o: Order, status: OrderStatus): void {
    this.busyId.set(o._id);
    this.shop.updateOrderStatus(o._id, status).subscribe({
      next: (updated) => {
        this.toast.success(`Order #${o._id.slice(-6).toUpperCase()} is now ${STATUS_LABEL[status].toLowerCase()}`);
        this.busyId.set(null);
        const r = this.result();
        if (!r) return;
        if (this.status() && this.status() !== status) {
          this.load(r.page); // it no longer belongs in this filter
        } else {
          this.result.set({ ...r, items: r.items.map((x) => (x._id === o._id ? updated : x)) });
        }
      },
      error: (e) => { this.toast.error(errorMessage(e)); this.busyId.set(null); },
    });
  }
}
