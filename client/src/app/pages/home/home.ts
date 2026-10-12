import { Component, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { animate, scroll } from 'motion';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CATEGORY_ICON, CATEGORY_IMAGE, Category, Product, errorMessage } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { ProductCard } from '../../shared/product-card/product-card';
import { Reveal } from '../../shared/reveal';
import { RecentService } from '../../core/services/recent.service';
import { InrPipe } from '../../shared/inr.pipe';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard, InrPipe, Reveal],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private shop = inject(ShopService);
  readonly recent = inject(RecentService).items;

  readonly categoryIcon = CATEGORY_ICON;
  readonly categoryImage = CATEGORY_IMAGE;
  readonly categories = signal<Category[]>([]);
  readonly featured = signal<Product[]>([]);
  readonly bestSellers = signal<Product[]>([]);
  readonly newest = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  private hero = viewChild<ElementRef<HTMLElement>>('hero');
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  readonly freeShippingAbove = () => this.shop.paymentConfig().freeShippingAbove;

  constructor() {
    this.load();
    afterNextRender(() => {
      // Hero photos drift at different speeds as you scroll past (one gentle scroll-linked effect).
      const hero = this.hero()?.nativeElement;
      if (!hero || this.reduced || !matchMedia('(min-width: 992px)').matches) return;
      [['.ph-a', -28], ['.ph-b', 36], ['.ph-c', -64]].forEach(([sel, y]) => {
        const el = hero.querySelector(sel as string);
        if (el) scroll(animate(el, { transform: ['translateY(0px)', `translateY(${y}px)`] }, { ease: 'linear' }), { target: hero, offset: ['start start', 'end start'] });
      });
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      categories: this.shop.getCategories(),
      featured: this.shop.getProducts({ featured: true, sort: 'rating', limit: 8 }),
      best: this.shop.getProducts({ sort: 'popular', inStock: true, limit: 4 }),
      fresh: this.shop.getProducts({ sort: 'newest', inStock: true, limit: 8 }),
    }).subscribe({
      next: ({ categories, featured, best, fresh }) => {
        this.categories.set(categories.filter((c) => c.count > 0));
        this.featured.set(featured.items);
        this.bestSellers.set(best.items);
        this.newest.set(fresh.items);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  hideImg(e: Event): void {
    (e.target as HTMLElement).remove();
  }
}
