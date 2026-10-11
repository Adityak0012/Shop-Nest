import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CATEGORY_ICON, Category, Paged, Product, errorMessage } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { ToastService } from '../../core/services/toast.service';
import { InrPipe } from '../../shared/inr.pipe';
import { Pagination } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-admin-products',
  imports: [FormsModule, RouterLink, InrPipe, Pagination],
  template: `
    <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
      <div>
        <h1 class="h2 mb-1">Products</h1>
        <p class="text-muted small mb-0">@if (result(); as r) { {{ r.total }} products }</p>
      </div>
      <a routerLink="/admin/products/new" class="btn btn-primary"><i class="bi bi-plus-lg me-1"></i>Add product</a>
    </div>

    <div class="surface p-3 mb-3 d-flex flex-wrap gap-2">
      <div class="position-relative flex-grow-1" style="min-width: 14rem">
        <i class="bi bi-search position-absolute text-muted" style="left:.85rem;top:50%;transform:translateY(-50%)"></i>
        <label for="ps" class="visually-hidden">Search products</label>
        <input id="ps" type="search" class="form-control ps-5" placeholder="Search by name or brand" [ngModel]="search" (ngModelChange)="search$.next($event)">
      </div>
      <label for="pc" class="visually-hidden">Category</label>
      <select id="pc" class="form-select" style="max-width: 14rem" [(ngModel)]="category" (ngModelChange)="go(1)">
        <option value="">All categories</option>
        @for (c of categories(); track c.name) { <option [value]="c.name">{{ c.name }} ({{ c.count }})</option> }
      </select>
    </div>

    @if (error()) {
      <div class="alert alert-danger">{{ error() }} <button class="btn btn-link alert-link p-0" (click)="go(page)">Retry</button></div>
    }

    <div class="surface">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr class="small text-muted">
              <th class="ps-3">Product</th><th>Category</th><th class="text-end">Price</th><th class="text-end">Stock</th><th class="text-end">Sold</th><th class="text-end pe-3">Actions</th>
            </tr>
          </thead>
          <tbody [class.opacity-50]="loading()">
            @if (loading() && !result()) {
              @for (i of [1,2,3,4,5]; track i) { <tr><td colspan="6" class="p-3"><div class="skeleton" style="height:2.25rem"></div></td></tr> }
            }
            @for (p of result()?.items ?? []; track p._id) {
              <tr>
                <td class="ps-3">
                  <div class="d-flex align-items-center gap-2">
                    <div class="icon-tile tile-xs" [style.--tile]="p.color"><i class="bi" [class]="p.icon"></i>@if (p.image) { <img [src]="p.image" alt="" loading="lazy" (error)="$any($event.target).remove()"> }</div>
                    <div class="min-w-0">
                      <div class="fw-semibold text-truncate" style="max-width: 18rem">{{ p.name }} @if (p.featured) { <i class="bi bi-star-fill text-warning small" title="Featured"></i> }</div>
                      <div class="small text-muted">{{ p.brand }}</div>
                    </div>
                  </div>
                </td>
                <td class="small"><i class="bi me-1 text-muted" [class]="categoryIcon[p.category]"></i>{{ p.category }}</td>
                <td class="text-end fw-semibold">{{ p.price | inr }}</td>
                <td class="text-end">
                  <span class="badge-soft" [class]="p.stock === 0 ? 'badge-out' : p.stock <= 5 ? 'badge-low' : 'text-body'">{{ p.stock }}</span>
                </td>
                <td class="text-end small">{{ p.sold }}</td>
                <td class="text-end pe-3 text-nowrap">
                  @if (confirmId() === p._id) {
                    <span class="small me-2">Delete?</span>
                    <button type="button" class="btn btn-sm btn-danger" (click)="remove(p)" [disabled]="deleting()">Yes</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary ms-1" (click)="confirmId.set(null)">No</button>
                  } @else {
                    <a [routerLink]="['/product', p.slug]" class="btn btn-sm btn-light" title="View in store" [attr.aria-label]="'View ' + p.name"><i class="bi bi-eye"></i></a>
                    <a [routerLink]="['/admin/products', p.slug, 'edit']" class="btn btn-sm btn-light ms-1" [attr.aria-label]="'Edit ' + p.name"><i class="bi bi-pencil"></i></a>
                    <button type="button" class="btn btn-sm btn-light text-danger ms-1" (click)="confirmId.set(p._id)" [attr.aria-label]="'Delete ' + p.name"><i class="bi bi-trash3"></i></button>
                  }
                </td>
              </tr>
            } @empty {
              @if (!loading()) { <tr><td colspan="6" class="text-center text-muted py-5">No products found.</td></tr> }
            }
          </tbody>
        </table>
      </div>
    </div>
    @if (result(); as r) { <app-pagination [page]="r.page" [pages]="r.pages" (pageChange)="go($event)" /> }
  `,
  styles: `.min-w-0 { min-width: 0; } td, th { white-space: nowrap; }`,
})
export class AdminProducts {
  private shop = inject(ShopService);
  private toast = inject(ToastService);

  readonly categoryIcon = CATEGORY_ICON;
  readonly categories = signal<Category[]>([]);
  readonly result = signal<Paged<Product> | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly confirmId = signal<string | null>(null);
  readonly deleting = signal(false);
  readonly search$ = new Subject<string>();
  search = '';
  category = '';
  page = 1;

  constructor() {
    this.shop.getCategories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed()).subscribe((s) => {
      this.search = s;
      this.go(1);
    });
    this.go(1);
  }

  go(page: number): void {
    this.page = page;
    this.loading.set(true);
    this.error.set('');
    this.shop.getProducts({ search: this.search, category: this.category, page, limit: 10, sort: 'newest' }).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }

  remove(p: Product): void {
    this.deleting.set(true);
    this.shop.deleteProduct(p._id).subscribe({
      next: () => {
        this.toast.success(`Deleted ${p.name}`);
        this.confirmId.set(null);
        this.deleting.set(false);
        const r = this.result();
        this.go(r && r.items.length === 1 && this.page > 1 ? this.page - 1 : this.page);
      },
      error: (e) => { this.toast.error(errorMessage(e)); this.deleting.set(false); },
    });
  }
}
