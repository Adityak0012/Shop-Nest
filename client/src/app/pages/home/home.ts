import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CATEGORY_ICON, CATEGORY_IMAGE, Category, Product, errorMessage } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { ProductCard } from '../../shared/product-card/product-card';
import { InrPipe } from '../../shared/inr.pipe';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard, InrPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private shop = inject(ShopService);

  readonly categoryIcon = CATEGORY_ICON;
  readonly categoryImage = CATEGORY_IMAGE;
  readonly categories = signal<Category[]>([]);
  readonly featured = signal<Product[]>([]);
  readonly bestSellers = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly freeShippingAbove = () => this.shop.paymentConfig().freeShippingAbove;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      categories: this.shop.getCategories(),
      featured: this.shop.getProducts({ featured: true, sort: 'rating', limit: 8 }),
      best: this.shop.getProducts({ sort: 'popular', inStock: true, limit: 4 }),
    }).subscribe({
      next: ({ categories, featured, best }) => {
        this.categories.set(categories.filter((c) => c.count > 0));
        this.featured.set(featured.items);
        this.bestSellers.set(best.items);
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
