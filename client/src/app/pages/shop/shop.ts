import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { CATEGORY_ICON, Category, Paged, Product, ProductQuery, SortKey, errorMessage } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { ProductCard } from '../../shared/product-card/product-card';
import { Pagination } from '../../shared/pagination/pagination';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popular', label: 'Best selling' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

/** Product listing. All filter state lives in the URL, so results can be shared and the back button works. */
@Component({
  selector: 'app-shop',
  imports: [FormsModule, RouterLink, ProductCard, Pagination],
  templateUrl: './shop.html',
  styleUrl: './shop.scss',
})
export class Shop {
  private shop = inject(ShopService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sub?: Subscription;

  readonly sortOptions = SORT_OPTIONS;
  readonly categoryIcon = CATEGORY_ICON;
  readonly categories = signal<Category[]>([]);
  readonly result = signal<Paged<Product> | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly query = signal<ProductQuery>({});
  readonly filtersOpen = signal(false);

  // Local inputs for the price range (applied on button press)
  minPrice: number | null = null;
  maxPrice: number | null = null;

  readonly activeFilterCount = computed(() => {
    const q = this.query();
    return [q.search, q.category, q.minPrice, q.maxPrice, q.inStock].filter((v) => v !== undefined && v !== null && v !== '' && v !== false).length;
  });

  constructor() {
    this.shop.getCategories().subscribe({ next: (c) => this.categories.set(c), error: () => {} });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((p) => {
      const num = (k: string) => (p.get(k) ? Number(p.get(k)) : null);
      const q: ProductQuery = {
        search: p.get('search') ?? '',
        category: p.get('category') ?? '',
        minPrice: num('minPrice'),
        maxPrice: num('maxPrice'),
        inStock: p.get('inStock') === 'true',
        sort: (p.get('sort') as SortKey) || 'newest',
        page: Number(p.get('page')) || 1,
        limit: 12,
      };
      this.minPrice = q.minPrice ?? null;
      this.maxPrice = q.maxPrice ?? null;
      this.query.set(q);
      this.load(q);
    });
  }

  load(q = this.query()): void {
    this.sub?.unsubscribe(); // cancel a slower previous request
    this.loading.set(true);
    this.error.set('');
    this.sub = this.shop.getProducts(q).subscribe({
      next: (r) => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  /** Merge changes into the URL. Any filter change goes back to page 1. */
  update(changes: Partial<ProductQuery>, keepPage = false): void {
    const next = { ...this.query(), ...changes };
    if (!keepPage) next.page = 1;
    const queryParams: Record<string, string | number | null> = {
      search: next.search || null,
      category: next.category || null,
      minPrice: next.minPrice ?? null,
      maxPrice: next.maxPrice ?? null,
      inStock: next.inStock ? 'true' : null,
      sort: next.sort && next.sort !== 'newest' ? next.sort : null,
      page: next.page && next.page > 1 ? next.page : null,
    };
    this.router.navigate([], { queryParams });
    if (keepPage) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  applyPrice(): void {
    let min = this.minPrice ?? null;
    let max = this.maxPrice ?? null;
    if (min !== null && max !== null && min > max) [min, max] = [max, min];
    this.update({ minPrice: min, maxPrice: max });
  }

  clearAll(): void {
    this.router.navigate([], { queryParams: {} });
  }
}
