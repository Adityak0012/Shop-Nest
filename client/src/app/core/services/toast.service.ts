import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
  action?: { label: string; link: string };
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  show(text: string, type: Toast['type'] = 'success', action?: Toast['action'], ms = 3500): void {
    const id = this.nextId++;
    this.toasts.update((t) => [...t.slice(-2), { id, type, text, action }]);
    setTimeout(() => this.dismiss(id), ms);
  }

  success(text: string, action?: Toast['action']): void { this.show(text, 'success', action); }
  error(text: string): void { this.show(text, 'error', undefined, 5000); }

  dismiss(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
