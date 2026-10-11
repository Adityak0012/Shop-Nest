import { Component, computed, input, output } from '@angular/core';

/** Numbered pagination with ellipses: 1 … 4 5 6 … 12 */
@Component({
  selector: 'app-pagination',
  template: `
    @if (pages() > 1) {
      <nav aria-label="Pagination" class="d-flex justify-content-center mt-4">
        <ul class="pagination mb-0 flex-wrap">
          <li class="page-item" [class.disabled]="page() <= 1">
            <button class="page-link" type="button" (click)="go(page() - 1)" aria-label="Previous page"><i class="bi bi-chevron-left"></i></button>
          </li>
          @for (n of numbers(); track $index) {
            @if (n === 0) {
              <li class="page-item disabled"><span class="page-link">…</span></li>
            } @else {
              <li class="page-item" [class.active]="n === page()">
                <button class="page-link" type="button" (click)="go(n)" [attr.aria-current]="n === page() ? 'page' : null">{{ n }}</button>
              </li>
            }
          }
          <li class="page-item" [class.disabled]="page() >= pages()">
            <button class="page-link" type="button" (click)="go(page() + 1)" aria-label="Next page"><i class="bi bi-chevron-right"></i></button>
          </li>
        </ul>
      </nav>
    }
  `,
  styles: `.page-link { min-width: 2.5rem; min-height: 2.5rem; text-align: center; }`,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pages = input.required<number>();
  readonly pageChange = output<number>();

  readonly numbers = computed(() => {
    const total = this.pages();
    const cur = this.page();
    const set = new Set([1, total, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= total));
    const sorted = [...set].sort((a, b) => a - b);
    const out: number[] = [];
    sorted.forEach((n, i) => {
      if (i > 0 && n - sorted[i - 1] > 1) out.push(0); // 0 = ellipsis
      out.push(n);
    });
    return out;
  });

  go(n: number): void {
    if (n >= 1 && n <= this.pages() && n !== this.page()) this.pageChange.emit(n);
  }
}
