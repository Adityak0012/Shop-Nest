import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/models';
import { AuthShell } from './auth-shell';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  template: `
    <app-auth-shell [words]="['Made', 'well.', 'Chosen', 'carefully.']" lead="Create an account to save your bag, wishlist and delivery details.">
        <div class="auth-head" data-in>
          <h1>Create your account</h1>
          <p>It takes less than a minute.</p>
        </div>

        @if (error()) { <div class="alert alert-danger small py-2" role="alert"><i class="bi bi-exclamation-circle me-1"></i>{{ error() }}</div> }

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="d-grid gap-3 auth-form" data-in>
          <div>
            <label for="name" class="form-label">Full name</label>
            <input id="name" class="form-control" formControlName="name" autocomplete="name"
                   [class.is-invalid]="form.controls.name.invalid && form.controls.name.touched">
            <div class="invalid-feedback">Enter your name (at least 2 characters).</div>
          </div>
          <div>
            <label for="email" class="form-label">Email</label>
            <input id="email" type="email" class="form-control" formControlName="email" autocomplete="email"
                   [class.is-invalid]="form.controls.email.invalid && form.controls.email.touched">
            <div class="invalid-feedback">Enter a valid email address.</div>
          </div>
          <div>
            <label for="password" class="form-label">Password</label>
            <input id="password" type="password" class="form-control" formControlName="password" autocomplete="new-password"
                   aria-describedby="pw-help" [class.is-invalid]="form.controls.password.invalid && form.controls.password.touched">
            <div id="pw-help" class="form-text">At least 6 characters.</div>
            <div class="invalid-feedback">Password must be at least 6 characters.</div>
          </div>
          <button type="submit" class="btn btn-primary btn-lg auth-btn" [disabled]="loading()">
            @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span>Creating account… } @else { Create account <i class="bi bi-arrow-right"></i> }
          </button>
        </form>
        <p class="auth-foot" data-in>Already have an account? <a [routerLink]="['/login']" [queryParams]="{ returnUrl }" class="fw-semibold">Log in</a></p>
    </app-auth-shell>
  `,
  styleUrl: './auth.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  readonly returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl') || '/';
  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    this.error.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { name, email, password } = this.form.getRawValue();
    this.auth.register(name, email, password).subscribe({
      next: () => {
        this.toast.success('Account created. Welcome to ShopNest!');
        this.router.navigateByUrl(this.returnUrl.startsWith('/') ? this.returnUrl : '/');
      },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
