import { Injectable, signal } from '@angular/core';
import { Product } from '../models';

const KEY = 'shopnest.recent';
const MAX = 8;

/** Remembers the last few products a shopper opened (kept in this browser only). */
@Injectable({ providedIn: 'root' })
export class RecentService {
  readonly items = signal<Product[]>(read());

  add(p: Product): void {
    const next = [p, ...this.items().filter((x) => x._id !== p._id)].slice(0, MAX);
    this.items.set(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  }
}

function read(): Product[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v.slice(0, MAX) : []; } catch { return []; }
}
