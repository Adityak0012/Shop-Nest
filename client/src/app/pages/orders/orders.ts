import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Order, STATUS_ICON, STATUS_LABEL, errorMessage } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { InrPipe } from '../../shared/inr.pipe';

@Component({
  selector: 'app-orders',
  imports: [RouterLink, DatePipe, InrPipe],
  template: `
    <div class="container py-4" style="max-width: 60rem">
      <h1 class="h2 mb-4">My orders</h1>
      @if (loading()) {
        <div class="d-grid gap-3">@for (i of [1,2,3]; track i) { <div class="skeleton" style="height:7rem"></div> }</div>
      } @else if (error()) {
        <div class="surface empty-state">
          <div class="empty-icon" style="background:rgba(224,134,106,0.14);color:#e5361b"><i class="bi bi-wifi-off"></i></div>
          <p class="text-muted">{{ error() }}</p>
          <button class="btn btn-primary" type="button" (click)="load()">Try again</button>
        </div>
      } @else if (orders().length === 0) {
        <div class="surface empty-state">
          <div class="empty-icon"><i class="bi bi-receipt"></i></div>
          <h2 class="h5">No orders yet</h2>
          <p class="text-muted">When you place an order it will appear here.</p>
          <a routerLink="/shop" class="btn btn-primary">Start shopping</a>
        </div>
      } @else {
        <div class="d-grid gap-3">
          @for (o of orders(); track o._id) {
            <a [routerLink]="['/orders', o._id]" class="surface p-3 p-md-4 text-reset text-decoration-none order-row">
              <div class="d-flex flex-wrap justify-content-between gap-2 mb-3">
                <div>
                  <div class="fw-bold">Order #{{ o._id.slice(-6).toUpperCase() }}</div>
                  <div class="small text-muted">{{ o.createdAt | date: 'd MMM y, h:mm a' }} · {{ o.items.length }} {{ o.items.length === 1 ? 'item' : 'items' }}</div>
                </div>
                <div class="text-end">
                  <span class="status" [class]="'status-' + o.status"><i class="bi" [class]="statusIcon[o.status]"></i>{{ statusLabel[o.status] }}</span>
                  <div class="fw-bold mt-1">{{ o.total | inr }}</div>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                @for (i of o.items.slice(0, 5); track i.product) {
                  <div class="icon-tile tile-xs" [style.--tile]="i.color" [title]="i.name"><i class="bi" [class]="i.icon"></i>@if (i.image) { <img [src]="i.image" alt="" loading="lazy" (error)="$any($event.target).remove()"> }</div>
                }
                @if (o.items.length > 5) { <span class="small text-muted">+{{ o.items.length - 5 }} more</span> }
                <span class="ms-auto small fw-semibold text-primary">View details <i class="bi bi-chevron-right"></i></span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: `.order-row { transition: box-shadow .2s, border-color .2s; } .order-row:hover { box-shadow: var(--sn-shadow-md); border-color: #bdbdb8; }`,
})
export class Orders {
  private shop = inject(ShopService);
  readonly statusLabel = STATUS_LABEL;
  readonly statusIcon = STATUS_ICON;
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.shop.myOrders().subscribe({
      next: (o) => { this.orders.set(o); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
