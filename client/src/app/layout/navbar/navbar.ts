import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, filter, of, switchMap, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ShopService } from '../../core/services/shop.service';
import { Product } from '../../core/models';
import { InrPipe } from '../../shared/inr.pipe';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, FormsModule, InrPipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly wishlist = inject(WishlistService);
  private router = inject(Router);
  private shop = inject(ShopService);
  private searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly quickCategories = ['Audio', 'Laptops', 'Wearables', 'Home & Kitchen'];
  readonly popular = ['Headphones', 'Laptop', 'Smartwatch', 'Sneakers'];
  readonly menuOpen = signal(false);
  readonly userMenuOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly scrolled = signal(false);
  search = '';

  // ----- Live search suggestions -----
  private readonly query$ = new Subject<string>();
  readonly suggestions = signal<Product[]>([]);
  readonly suggestedCategories = signal<string[]>([]);
  readonly suggestLoading = signal(false);
  readonly activeIndex = signal(-1); // keyboard-highlighted row, -1 = none
  readonly lastQuery = signal('');

  constructor() {
    this.query$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) => {
          this.lastQuery.set(q);
          if (q.length < 2) return of({ products: [], categories: [] });
          this.suggestLoading.set(true);
          return this.shop.suggest(q).pipe(catchError(() => of({ products: [], categories: [] })));
        }),
        takeUntilDestroyed()
      )
      .subscribe(({ products, categories }) => {
        this.suggestions.set(products);
        this.suggestedCategories.set(categories);
        this.activeIndex.set(-1);
        this.suggestLoading.set(false);
      });

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => {
        this.menuOpen.set(false);
        this.userMenuOpen.set(false);
        this.searchOpen.set(false);
        const q = this.router.parseUrl(this.router.url).queryParams['search'];
        this.search = typeof q === 'string' ? q : '';
      });
  }

  toggleSearch(): void {
    this.searchOpen.update((v) => !v);
    if (this.searchOpen()) requestAnimationFrame(() => this.searchInput()?.nativeElement.focus());
  }

  onSearchInput(value: string): void {
    this.query$.next(value.trim());
  }

  /** Arrow keys move through suggestions, Enter opens the highlighted one */
  onSearchKey(e: KeyboardEvent): void {
    const n = this.suggestions().length;
    if (e.key === 'ArrowDown' && n) { e.preventDefault(); this.activeIndex.set((this.activeIndex() + 1) % n); }
    else if (e.key === 'ArrowUp' && n) { e.preventDefault(); this.activeIndex.set((this.activeIndex() - 1 + n) % n); }
    else if (e.key === 'Enter' && this.activeIndex() >= 0) {
      e.preventDefault();
      this.router.navigate(['/product', this.suggestions()[this.activeIndex()].slug]);
    }
  }

  /** Splits a name into parts so the matching text can be shown in bold */
  highlight(text: string): { t: string; m: boolean }[] {
    const q = this.lastQuery();
    const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
    if (i < 0) return [{ t: text, m: false }];
    return [{ t: text.slice(0, i), m: false }, { t: text.slice(i, i + q.length), m: true }, { t: text.slice(i + q.length), m: false }];
  }

  submitSearch(): void {
    const search = this.search.trim();
    this.router.navigate(['/shop'], { queryParams: search ? { search } : {} });
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

  @HostListener('document:keydown.escape')
  closeMenus(): void {
    this.userMenuOpen.set(false);
    this.menuOpen.set(false);
    this.searchOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.user-menu')) this.userMenuOpen.set(false);
  }
}
