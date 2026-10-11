import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminStats, CATEGORY_ICON, ORDER_STATUS_LIST, STATUS_LABEL, errorMessage } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { ToastService } from '../../core/services/toast.service';
import { InrPipe } from '../../shared/inr.pipe';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, FormsModule, InrPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private shop = inject(ShopService);
  private toast = inject(ToastService);

  readonly statusLabel = STATUS_LABEL;
  readonly statusList = ORDER_STATUS_LIST;
  readonly categoryIcon = CATEGORY_ICON;
  readonly stats = signal<AdminStats | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly stockDraft: Record<string, number> = {};
  readonly savingStock = signal<string | null>(null);

  readonly totalOrders = computed(() => {
    const s = this.stats();
    return s ? Object.values(s.ordersByStatus).reduce((a, b) => a + b, 0) : 0;
  });
  readonly maxCategoryRevenue = computed(() => Math.max(1, ...(this.stats()?.revenueByCategory.map((c) => c.revenue) ?? [1])));
  readonly avgOrderValue = computed(() => { const s = this.stats(); return s && s.orders ? Math.round(s.revenue / s.orders) : 0; });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.shop.adminStats().subscribe({
      next: (s) => {
        this.stats.set(s);
        s.lowStock.forEach((p) => (this.stockDraft[p._id] = p.stock));
        this.loading.set(false);
      },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }

  saveStock(id: string, name: string): void {
    const value = Number(this.stockDraft[id]);
    if (!Number.isInteger(value) || value < 0) { this.toast.error('Stock must be a whole number, 0 or more'); return; }
    this.savingStock.set(id);
    this.shop.updateStock(id, value).subscribe({
      next: () => { this.toast.success(`Stock for ${name} set to ${value}`); this.savingStock.set(null); this.load(); },
      error: (e) => { this.toast.error(errorMessage(e)); this.savingStock.set(null); },
    });
  }

  statusShare(count: number): number {
    return this.totalOrders() ? Math.round((count / this.totalOrders()) * 100) : 0;
  }
}
