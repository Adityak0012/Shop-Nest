import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product, errorMessage } from '../../core/models';
import { ShopService } from '../../core/services/shop.service';
import { ToastService } from '../../core/services/toast.service';
import { InrPipe, discountPercent } from '../../shared/inr.pipe';

const CATEGORIES = ['Mobiles', 'Laptops', 'Audio', 'Wearables', 'Gaming', 'Home & Kitchen', 'Fashion', 'Books', 'Sports'];
const ICON_CHOICES = [
  'bi-phone', 'bi-laptop', 'bi-headphones', 'bi-earbuds', 'bi-smartwatch', 'bi-watch', 'bi-controller', 'bi-display', 'bi-keyboard',
  'bi-mouse', 'bi-speaker', 'bi-mic', 'bi-camera', 'bi-tv', 'bi-cpu', 'bi-router', 'bi-printer', 'bi-battery-charging',
  'bi-cup-hot', 'bi-lamp', 'bi-fan', 'bi-robot', 'bi-house-heart', 'bi-backpack', 'bi-handbag', 'bi-sunglasses', 'bi-umbrella',
  'bi-book', 'bi-journal-code', 'bi-bicycle', 'bi-dribbble', 'bi-trophy', 'bi-gift', 'bi-box-seam',
];
const COLOR_CHOICES = ['#111113', '#4F46E5', '#2563EB', '#0891B2', '#059669', '#CA8A04', '#EA580C', '#DC2626', '#DB2777', '#7C3AED', '#334155', '#a86a00'];

/** MRP must be at least the selling price */
function mrpAtLeastPrice(group: AbstractControl): ValidationErrors | null {
  const price = Number(group.get('price')?.value);
  const mrp = Number(group.get('mrp')?.value);
  return mrp && price && mrp < price ? { mrpLow: true } : null;
}

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, InrPipe],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm {
  private fb = inject(FormBuilder);
  private shop = inject(ShopService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly categories = CATEGORIES;
  readonly iconChoices = ICON_CHOICES;
  readonly colorChoices = COLOR_CHOICES;
  readonly slug = this.route.snapshot.paramMap.get('slug');
  readonly isEdit = !!this.slug;
  readonly productId = signal<string | null>(null);
  readonly loading = signal(this.isEdit);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);
  readonly imageBroken = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
      brand: ['', Validators.required],
      category: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      price: [0, [Validators.required, Validators.min(1)]],
      mrp: [0, [Validators.required, Validators.min(1)]],
      stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      icon: ['bi-box-seam', [Validators.required, Validators.pattern(/^bi-[a-z0-9-]+$/)]],
      color: ['#111113', [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)]],
      image: ['', [Validators.maxLength(300), Validators.pattern(/^(\/|https:\/\/).*/)]],
      featured: [false],
      gallery: ['', Validators.maxLength(2000)],
      highlights: this.fb.nonNullable.array<string>([]),
    },
    { validators: mrpAtLeastPrice }
  );

  get highlights(): FormArray {
    return this.form.controls.highlights;
  }

  constructor() {
    if (this.slug) {
      this.shop.getProduct(this.slug).subscribe({
        next: ({ product }) => this.fill(product),
        error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
      });
    } else {
      this.addHighlight();
    }
  }

  private fill(p: Product): void {
    this.productId.set(p._id);
    const { highlights, ...rest } = p;
    this.form.patchValue({ ...rest, image: rest.image ?? '', gallery: (rest.images ?? []).join('\n') });
    this.highlights.clear();
    (highlights.length ? highlights : ['']).forEach((h) => this.addHighlight(h));
    this.loading.set(false);
  }

  addHighlight(value = ''): void {
    if (this.highlights.length < 6) this.highlights.push(this.fb.nonNullable.control(value, Validators.maxLength(80)));
  }

  removeHighlight(i: number): void {
    this.highlights.removeAt(i);
  }

  invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  discount(): number {
    const { price, mrp } = this.form.getRawValue();
    return discountPercent(Number(price), Number(mrp));
  }

  save(): void {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      setTimeout(() => document.querySelector<HTMLElement>('.is-invalid')?.focus());
      return;
    }
    const raw = this.form.getRawValue();
    const { gallery, ...rest } = raw;
    const images = gallery.split(/\r?\n/).map((u) => u.trim()).filter((u) => /^(\/|https:\/\/)/.test(u)).slice(0, 6);
    const body = { ...rest, images, highlights: raw.highlights.map((h) => h.trim()).filter(Boolean) };
    this.saving.set(true);
    const req = this.productId() ? this.shop.updateProduct(this.productId()!, body) : this.shop.createProduct(body);
    req.subscribe({
      next: (p) => {
        this.toast.success(this.isEdit ? `Saved ${p.name}` : `Added ${p.name} to the store`);
        this.router.navigateByUrl('/admin/products');
      },
      error: (e) => { this.error.set(errorMessage(e)); this.saving.set(false); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    });
  }
}
