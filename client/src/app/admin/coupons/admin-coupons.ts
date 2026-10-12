import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminCoupon, errorMessage } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-coupons',
  imports: [ReactiveFormsModule, DatePipe],
  template: `
    <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
      <div>
        <h1 class="h2 mb-1">Coupons</h1>
        <p class="text-muted small mb-0">Discount codes shoppers can apply at checkout. The server checks every rule again when an order is placed.</p>
      </div>
      <button type="button" class="btn btn-primary" (click)="openNew()"><i class="bi bi-plus-lg me-1"></i>New coupon</button>
    </div>

    @if (formOpen()) {
      <form class="surface p-3 p-md-4 mb-4 fade-in" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <h2 class="h6 mb-3">{{ editingId() ? 'Edit coupon' : 'New coupon' }}</h2>
        <div class="row g-3">
          <div class="col-md-3">
            <label for="c-code" class="form-label">Code</label>
            <input id="c-code" class="form-control text-uppercase" formControlName="code" maxlength="20" [class.is-invalid]="bad('code')">
            <div class="invalid-feedback">3-20 letters or numbers.</div>
          </div>
          <div class="col-md-3">
            <label for="c-type" class="form-label">Type</label>
            <select id="c-type" class="form-select" formControlName="type">
              <option value="percent">Percent off</option>
              <option value="flat">Flat ₹ off</option>
            </select>
          </div>
          <div class="col-md-3">
            <label for="c-value" class="form-label">{{ form.value.type === 'percent' ? 'Percent (%)' : 'Amount (₹)' }}</label>
            <input id="c-value" type="number" min="1" class="form-control" formControlName="value" [class.is-invalid]="bad('value')">
            <div class="invalid-feedback">{{ form.value.type === 'percent' ? 'Between 1 and 90.' : 'At least ₹1.' }}</div>
          </div>
          <div class="col-md-3">
            <label for="c-max" class="form-label">Max discount (₹)</label>
            <input id="c-max" type="number" min="0" class="form-control" formControlName="maxDiscount" [attr.disabled]="form.value.type === 'flat' ? true : null">
            <div class="form-text">0 = no cap</div>
          </div>
          <div class="col-md-3">
            <label for="c-min" class="form-label">Minimum order (₹)</label>
            <input id="c-min" type="number" min="0" class="form-control" formControlName="minOrder">
          </div>
          <div class="col-md-3">
            <label for="c-limit" class="form-label">Total uses</label>
            <input id="c-limit" type="number" min="0" class="form-control" formControlName="usageLimit">
            <div class="form-text">0 = unlimited</div>
          </div>
          <div class="col-md-3">
            <label for="c-exp" class="form-label">Expires on</label>
            <input id="c-exp" type="date" class="form-control" formControlName="expiresAt">
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" role="switch" id="c-once" formControlName="onePerCustomer">
              <label class="form-check-label" for="c-once">Once per customer</label>
            </div>
          </div>
          <div class="col-12">
            <label for="c-desc" class="form-label">Description shown to shoppers <span class="text-muted fw-normal">(optional)</span></label>
            <input id="c-desc" class="form-control" formControlName="description" maxlength="120" placeholder="e.g. Diwali sale: 20% off up to ₹1,000">
          </div>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ editingId() ? 'Save changes' : 'Create coupon' }}</button>
          <button type="button" class="btn btn-light" (click)="formOpen.set(false)">Cancel</button>
        </div>
      </form>
    }

    <div class="surface">
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead><tr class="small text-muted"><th class="ps-3">Code</th><th>Offer</th><th>Used</th><th>Expires</th><th>Status</th><th class="text-end pe-3">Actions</th></tr></thead>
          <tbody>
            @if (loading()) { <tr><td colspan="6" class="p-3"><div class="skeleton" style="height: 2.5rem"></div></td></tr> }
            @for (c of coupons(); track c._id) {
              <tr [class.opacity-50]="!c.active">
                <td class="ps-3"><span class="code">{{ c.code }}</span></td>
                <td class="small">{{ c.summary }}@if (c.onePerCustomer) { <span class="text-muted"> · once per customer</span> }</td>
                <td class="small">{{ c.usedCount }}{{ c.usageLimit ? ' / ' + c.usageLimit : '' }}</td>
                <td class="small">{{ c.expiresAt ? (c.expiresAt | date: 'd MMM y') : 'Never' }}</td>
                <td>
                  @if (!c.active) { <span class="status status-cancelled">Paused</span> }
                  @else if (expired(c)) { <span class="status status-pending_payment">Expired</span> }
                  @else { <span class="status status-delivered">Active</span> }
                </td>
                <td class="text-end pe-3 text-nowrap">
                  @if (confirmId() === c._id) {
                    <span class="small me-2">Delete?</span>
                    <button type="button" class="btn btn-sm btn-danger" (click)="remove(c)">Yes</button>
                    <button type="button" class="btn btn-sm btn-light ms-1" (click)="confirmId.set(null)">No</button>
                  } @else {
                    <button type="button" class="btn btn-sm btn-light" (click)="toggle(c)">{{ c.active ? 'Pause' : 'Activate' }}</button>
                    <button type="button" class="btn btn-sm btn-light ms-1" (click)="edit(c)" [attr.aria-label]="'Edit ' + c.code"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn btn-sm btn-light text-danger ms-1" (click)="confirmId.set(c._id)" [attr.aria-label]="'Delete ' + c.code"><i class="bi bi-trash3"></i></button>
                  }
                </td>
              </tr>
            } @empty {
              @if (!loading()) { <tr><td colspan="6" class="text-center text-muted py-5">No coupons yet.</td></tr> }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    td, th { white-space: nowrap; }
    .code { font-weight: 700; letter-spacing: .08em; font-size: .8rem; border: 1px dashed #17171a; color: #17171a; border-radius: .35rem; padding: .15rem .45rem; }
  `,
})
export class AdminCoupons {
  private shop = inject(ShopService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly coupons = signal<AdminCoupon[]>([]);
  readonly loading = signal(true);
  readonly formOpen = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly confirmId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{3,20}$/)]],
    type: ['percent' as 'percent' | 'flat'],
    value: [10, [Validators.required, Validators.min(1)]],
    maxDiscount: [0, Validators.min(0)],
    minOrder: [0, Validators.min(0)],
    usageLimit: [0, Validators.min(0)],
    expiresAt: [''],
    onePerCustomer: [true],
    description: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.shop.adminCoupons().subscribe({
      next: (c) => { this.coupons.set(c); this.loading.set(false); },
      error: (e) => { this.toast.error(errorMessage(e)); this.loading.set(false); },
    });
  }

  bad(name: 'code' | 'value'): boolean {
    const c = this.form.controls[name];
    const tooHigh = name === 'value' && this.form.value.type === 'percent' && Number(this.form.value.value) > 90;
    return (c.invalid || tooHigh) && c.touched;
  }

  expired(c: AdminCoupon): boolean {
    return !!c.expiresAt && new Date(c.expiresAt) < new Date();
  }

  openNew(): void {
    this.editingId.set(null);
    this.form.reset();
    this.formOpen.set(true);
  }

  edit(c: AdminCoupon): void {
    this.editingId.set(c._id);
    this.form.reset({ ...c, expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '' });
    this.formOpen.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  save(): void {
    this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    if (this.form.invalid || (v.type === 'percent' && v.value > 90)) return;
    this.saving.set(true);
    const body = { ...v, code: v.code.toUpperCase(), expiresAt: v.expiresAt || null, maxDiscount: v.type === 'flat' ? 0 : v.maxDiscount };
    this.shop.saveCoupon(body, this.editingId() ?? undefined).subscribe({
      next: (c) => {
        this.toast.success(`Coupon ${c.code} saved`);
        this.saving.set(false);
        this.formOpen.set(false);
        this.load();
      },
      error: (e) => { this.toast.error(errorMessage(e)); this.saving.set(false); },
    });
  }

  toggle(c: AdminCoupon): void {
    this.shop.setCouponActive(c._id, !c.active).subscribe({
      next: (u) => this.coupons.update((list) => list.map((x) => (x._id === u._id ? u : x))),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  remove(c: AdminCoupon): void {
    this.shop.deleteCoupon(c._id).subscribe({
      next: () => { this.toast.success(`Deleted ${c.code}`); this.confirmId.set(null); this.load(); },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
