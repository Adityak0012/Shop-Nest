import { Component, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

const KEY = 'shopnest.pincode';
// First two digits of the big metro delivery hubs (Delhi, Mumbai, Pune, Bengaluru, Chennai, Kolkata, Hyderabad, Ahmedabad)
const METRO = ['11', '40', '41', '56', '60', '70', '50', '38'];

/** Delivery estimate for a pincode. A simple rule of thumb, since this is a demo store with no courier API. */
@Component({
  selector: 'app-pincode-check',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="pin">
      <label for="pin" class="form-label mb-1"><i class="bi bi-geo-alt me-1"></i>Check delivery</label>
      <form class="d-flex gap-2" (ngSubmit)="check()">
        <input id="pin" name="pin" class="form-control" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit pincode" autocomplete="postal-code"
               [(ngModel)]="pin" [class.is-invalid]="bad()" (ngModelChange)="bad.set(false); result.set(null)">
        <button type="submit" class="btn btn-outline-primary flex-shrink-0">Check</button>
      </form>
      @if (bad()) { <p class="small text-danger mt-2 mb-0">Enter a valid 6-digit Indian pincode.</p> }
      @if (result(); as r) {
        <p class="small mt-2 mb-0" role="status">
          <i class="bi bi-truck me-1"></i>Delivery by <strong>{{ r.from | date: 'EEE, d MMM' }}</strong> to <strong>{{ r.to | date: 'EEE, d MMM' }}</strong>
          <span class="text-muted"> · Cash on Delivery available</span>
        </p>
      }
    </div>
  `,
  styles: `.pin { padding: 1rem 1.1rem; background: #fff; border-radius: 0.5rem; }`,
})
export class PincodeCheck {
  pin = read();
  readonly bad = signal(false);
  readonly result = signal<{ from: Date; to: Date } | null>(null);
  readonly metro = computed(() => METRO.includes(this.pin.slice(0, 2)));

  constructor() { if (this.pin) this.check(); }

  check(): void {
    if (!/^[1-9][0-9]{5}$/.test(this.pin)) { this.bad.set(true); this.result.set(null); return; }
    const [min, max] = this.metro() ? [2, 3] : [4, 6];
    const day = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
    this.result.set({ from: day(min), to: day(max) });
    try { localStorage.setItem(KEY, this.pin); } catch { /* storage unavailable */ }
  }
}

function read(): string {
  try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; }
}
