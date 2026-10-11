import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Review, ReviewPage, errorMessage } from '../../../core/models';
import { ShopService } from '../../../core/services/shop.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Pagination } from '../../../shared/pagination/pagination';

/** Ratings summary, review list (sort, filter by stars, paging) and the write/edit form for verified buyers. */
@Component({
  selector: 'app-product-reviews',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, Pagination],
  templateUrl: './product-reviews.html',
  styleUrl: './product-reviews.scss',
})
export class ProductReviews {
  private shop = inject(ShopService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly productId = input.required<string>();
  readonly productSlug = input.required<string>();
  /** Tells the product page the new average and count after a review is saved or deleted. */
  readonly ratingChange = output<{ rating: number; numReviews: number }>();

  readonly data = signal<ReviewPage | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly sort = signal<'newest' | 'highest' | 'lowest'>('newest');
  readonly stars = signal<number | null>(null);
  readonly page = signal(1);

  readonly canReview = signal(false);
  readonly mine = signal<Review | null>(null);
  readonly formOpen = signal(false);
  readonly saving = signal(false);
  readonly hoverStar = signal(0);

  readonly form = this.fb.nonNullable.group({
    rating: [0, [Validators.min(1), Validators.max(5)]],
    title: ['', Validators.maxLength(80)],
    comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  readonly percent = computed(() => {
    const d = this.data();
    const total = d?.summary.count || 0;
    return (star: number) => (total ? Math.round(((d!.summary.breakdown as Record<string, number>)[star] / total) * 100) : 0);
  });

  constructor() {
    // Reload the list whenever the product, sort, star filter or page changes
    effect(() => {
      const id = this.productId();
      const opts = { sort: this.sort(), page: this.page(), stars: this.stars() };
      untracked(() => this.load(id, opts));
    });
    // Check if the signed-in user may review this product
    effect(() => {
      const id = this.productId();
      const loggedIn = this.auth.isLoggedIn();
      untracked(() => this.loadMine(id, loggedIn));
    });
  }

  private load(id: string, opts: { sort: string; page: number; stars: number | null }): void {
    this.loading.set(true);
    this.error.set('');
    this.shop.getReviews(id, opts).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }

  private loadMine(id: string, loggedIn: boolean): void {
    this.canReview.set(false);
    this.mine.set(null);
    this.formOpen.set(false);
    if (!loggedIn) return;
    this.shop.myReview(id).subscribe({
      next: ({ canReview, review }) => {
        this.canReview.set(canReview);
        this.mine.set(review);
      },
      error: () => {},
    });
  }

  setSort(v: string): void { this.sort.set(v as 'newest' | 'highest' | 'lowest'); this.page.set(1); }
  filterStars(s: number | null): void { this.stars.set(this.stars() === s ? null : s); this.page.set(1); }

  openForm(): void {
    const r = this.mine();
    this.form.reset({ rating: r?.rating ?? 0, title: r?.title ?? '', comment: r?.comment ?? '' });
    this.formOpen.set(true);
  }

  setRating(n: number): void {
    this.form.controls.rating.setValue(n);
    this.form.controls.rating.markAsTouched();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.form.value.rating === 0) return;
    this.saving.set(true);
    const { rating, title, comment } = this.form.getRawValue();
    this.shop.saveReview(this.productId(), { rating, title: title.trim() || undefined, comment: comment.trim() }).subscribe({
      next: ({ review, rating: avg, numReviews }) => {
        this.toast.success(this.mine() ? 'Your review was updated' : 'Thanks! Your review is live');
        this.mine.set(review);
        this.formOpen.set(false);
        this.saving.set(false);
        this.ratingChange.emit({ rating: avg, numReviews });
        this.sort.set('newest'); this.stars.set(null); this.page.set(1);
        this.load(this.productId(), { sort: 'newest', page: 1, stars: null });
      },
      error: (e) => { this.toast.error(errorMessage(e)); this.saving.set(false); },
    });
  }

  remove(): void {
    const r = this.mine();
    if (!r) return;
    this.saving.set(true);
    this.shop.deleteReview(this.productId(), r._id).subscribe({
      next: ({ rating, numReviews }) => {
        this.toast.success('Your review was deleted');
        this.mine.set(null);
        this.formOpen.set(false);
        this.saving.set(false);
        this.ratingChange.emit({ rating, numReviews });
        this.load(this.productId(), { sort: this.sort(), page: 1, stars: this.stars() });
      },
      error: (e) => { this.toast.error(errorMessage(e)); this.saving.set(false); },
    });
  }

  starClass(rating: number, s: number): string {
    return rating >= s ? 'bi-star-fill' : rating >= s - 0.5 ? 'bi-star-half' : 'bi-star';
  }
}
