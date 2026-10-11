import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Product, errorMessage } from '../models';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

/** Saved products, stored on the user's account in MongoDB so they follow the user across devices. */
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  private readonly _ids = signal<Set<string>>(new Set());
  readonly count = computed(() => this._ids().size);
  private pending = new Set<string>();

  constructor() {
    // Load the wishlist after login, clear it after logout
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      untracked(() => {
        if (loggedIn) this.http.get<{ ids: string[] }>('/api/wishlist').subscribe({ next: ({ ids }) => this.setIds(ids), error: () => {} });
        else this._ids.set(new Set());
      });
    });
  }

  has(productId: string): boolean {
    return this._ids().has(productId);
  }

  list(): Observable<{ items: Product[]; ids: string[] }> {
    return this.http.get<{ items: Product[]; ids: string[] }>('/api/wishlist').pipe(tap(({ ids }) => this.setIds(ids)));
  }

  /** Adds or removes a product. Updates the heart instantly and rolls back if the server call fails. */
  toggle(p: Pick<Product, '_id' | 'name'>): void {
    if (!this.auth.isLoggedIn()) {
      this.toast.show('Log in to save items to your wishlist', 'info');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    if (this.pending.has(p._id)) return;
    const adding = !this.has(p._id);
    this.pending.add(p._id);
    this.patch(p._id, adding);

    const req = adding
      ? this.http.post<{ ids: string[] }>(`/api/wishlist/${p._id}`, {})
      : this.http.delete<{ ids: string[] }>(`/api/wishlist/${p._id}`);
    req.subscribe({
      next: ({ ids }) => {
        this.setIds(ids);
        this.pending.delete(p._id);
        this.toast.success(adding ? `Saved ${p.name} to your wishlist` : `Removed ${p.name} from your wishlist`,
          adding ? { label: 'View wishlist', link: '/wishlist' } : undefined);
      },
      error: (e) => {
        this.patch(p._id, !adding);
        this.pending.delete(p._id);
        this.toast.error(errorMessage(e));
      },
    });
  }

  private patch(id: string, add: boolean): void {
    this._ids.update((s) => {
      const next = new Set(s);
      if (add) next.add(id); else next.delete(id);
      return next;
    });
  }

  private setIds(ids: string[]): void {
    this._ids.set(new Set(ids.map(String)));
  }
}
