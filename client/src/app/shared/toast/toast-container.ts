import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [RouterLink],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (t of toasts.toasts(); track t.id) {
        <div class="sn-toast fade-in" [class]="'sn-toast-' + t.type" role="status">
          <i class="bi" [class]="t.type === 'error' ? 'bi-exclamation-circle-fill' : t.type === 'info' ? 'bi-info-circle-fill' : 'bi-check-circle-fill'" aria-hidden="true"></i>
          <span class="flex-grow-1">{{ t.text }}</span>
          @if (t.action) {
            <a [routerLink]="t.action.link" class="fw-semibold text-white text-decoration-underline" (click)="toasts.dismiss(t.id)">{{ t.action.label }}</a>
          }
          <button type="button" class="btn-close btn-close-white btn-sm" aria-label="Dismiss" (click)="toasts.dismiss(t.id)"></button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-stack { position: fixed; z-index: 1090; right: 1rem; bottom: 1rem; left: 1rem; display: flex; flex-direction: column; gap: .5rem; align-items: flex-end; pointer-events: none; }
    .sn-toast { pointer-events: auto; display: flex; align-items: center; gap: .65rem; max-width: 26rem; width: 100%;
      color: #fff; background: #0b1530; border-radius: .75rem; padding: .75rem .9rem; box-shadow: 0 10px 30px rgba(0,0,0,.18); font-size: .9rem; }
    .sn-toast-success i.bi { color: #5eead4; }
    .sn-toast-error { background: #7f1d1d; }
    .sn-toast-info i.bi { color: #93c5fd; }
  `,
})
export class ToastContainer {
  readonly toasts = inject(ToastService);
}
