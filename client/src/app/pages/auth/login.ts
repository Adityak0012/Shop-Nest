import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/models';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="container py-5">
      <div class="auth-card surface p-4 p-md-5 mx-auto fade-in">
        <div class="text-center mb-4">
          <span class="auth-icon"><i class="bi bi-person"></i></span>
          <h1 class="h3 mb-1">Welcome back</h1>
          <p class="text-muted mb-0">Log in to check out and track your orders.</p>
        </div>

        @if (expired) { <div class="alert alert-warning small py-2">Your session expired. Please log in again.</div> }
        @if (error()) { <div class="alert alert-danger small py-2" role="alert"><i class="bi bi-exclamation-circle me-1"></i>{{ error() }}</div> }

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="d-grid gap-3">
          <div>
            <label for="email" class="form-label">Email</label>
            <input id="email" type="email" class="form-control" formControlName="email" autocomplete="email"
                   [class.is-invalid]="form.controls.email.invalid && form.controls.email.touched">
            <div class="invalid-feedback">Enter a valid email address.</div>
          </div>
          <div>
            <label for="password" class="form-label">Password</label>
            <div class="input-group has-validation">
              <input id="password" [type]="show() ? 'text' : 'password'" class="form-control" formControlName="password" autocomplete="current-password"
                     [class.is-invalid]="form.controls.password.invalid && form.controls.password.touched">
              <button class="btn btn-outline-secondary" type="button" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Hide password' : 'Show password'">
                <i class="bi" [class]="show() ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
              <div class="invalid-feedback">Enter your password.</div>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading()">
            @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span>Logging in… } @else { Log in }
          </button>
        </form>

        <p class="text-center mt-4 mb-0">New to ShopNest? <a [routerLink]="['/register']" [queryParams]="{ returnUrl }" class="fw-semibold">Create an account</a></p>

        <div class="demo-box mt-4">
          <p class="small fw-semibold mb-2"><i class="bi bi-info-circle me-1"></i>Demo accounts (local test data)</p>
          <div class="d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" (click)="fill('demo@shopnest.dev', 'Demo@123')"><i class="bi bi-person me-1"></i>Customer</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" (click)="fill('admin@shopnest.dev', 'Admin@123')"><i class="bi bi-shield-lock me-1"></i>Admin</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './auth.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
  readonly expired = this.route.snapshot.queryParamMap.get('expired') === '1';
  readonly loading = signal(false);
  readonly error = signal('');
  readonly show = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  fill(email: string, password: string): void {
    this.form.setValue({ email, password });
  }

  submit(): void {
    this.error.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: ({ user }) => {
        this.toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
        const target = this.returnUrl.startsWith('/') ? this.returnUrl : '/';
        this.router.navigateByUrl(user.role === 'admin' && target === '/' ? '/admin' : target);
      },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
