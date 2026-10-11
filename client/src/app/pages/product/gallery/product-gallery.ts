import { Component, ElementRef, HostListener, computed, effect, input, signal, viewChild } from '@angular/core';

/**
 * Product photos: main image, thumbnails, arrows, and a full-screen viewer.
 * Falls back to the product's icon tile when there is no photo.
 */
@Component({
  selector: 'app-product-gallery',
  templateUrl: './product-gallery.html',
  styleUrl: './product-gallery.scss',
})
export class ProductGallery {
  readonly name = input.required<string>();
  readonly icon = input.required<string>();
  readonly color = input.required<string>();
  readonly image = input<string | undefined>();
  readonly images = input<string[] | undefined>([]);
  readonly badge = input<string>('');

  readonly photos = computed(() => {
    const all = [this.image(), ...(this.images() ?? [])].filter((u): u is string => !!u);
    return [...new Set(all)].filter((u) => !this.broken().has(u));
  });
  readonly index = signal(0);
  readonly current = computed(() => this.photos()[Math.min(this.index(), this.photos().length - 1)]);
  readonly viewerOpen = signal(false);
  private readonly broken = signal<Set<string>>(new Set());
  private touchX = 0;
  private readonly viewerEl = viewChild<ElementRef<HTMLElement>>('viewer');

  constructor() {
    // Move the full-screen viewer to <body> so no parent layout can clip or offset it
    effect(() => {
      const el = this.viewerEl()?.nativeElement;
      if (el && el.parentElement !== document.body) document.body.appendChild(el);
    });

    // New product -> back to the first photo
    effect(() => {
      this.image();
      this.index.set(0);
    });
  }

  select(i: number): void {
    const n = this.photos().length;
    if (n) this.index.set((i + n) % n);
  }

  markBroken(url: string): void {
    this.broken.update((s) => new Set(s).add(url));
  }

  open(): void {
    if (this.photos().length) {
      this.viewerOpen.set(true);
      document.body.style.overflow = 'hidden';
    }
  }

  close(): void {
    this.viewerOpen.set(false);
    document.body.style.overflow = '';
  }

  touchStart(e: TouchEvent): void {
    this.touchX = e.changedTouches[0].clientX;
  }

  touchEnd(e: TouchEvent): void {
    const dx = e.changedTouches[0].clientX - this.touchX;
    if (Math.abs(dx) > 40) this.select(this.index() + (dx < 0 ? 1 : -1));
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.viewerOpen()) return;
    if (e.key === 'Escape') this.close();
    if (e.key === 'ArrowRight') this.select(this.index() + 1);
    if (e.key === 'ArrowLeft') this.select(this.index() - 1);
  }
}
