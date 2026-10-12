import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/models';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="container py-5">
      <div class="auth-card surface p-4 p-md-5 mx-auto fade-in">
        <div class="text-center mb-4">
          <span class="auth-icon"><i class="bi bi-shield-lock"></i></span>
          <h1 class="h3 mb-1">Choose a new password</h1>
          <p class="text-muted mb-0">Use at least 6 characters.</p>
        </div>
        @if (error()) { <div class="alert alert-danger small py-2" role="alert">{{ error() }} <a routerLink="/forgot-password" class="d-block fw-semibold">Request a new link</a></div> }
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="d-grid gap-3">
          <div>
            <label for="rp-pass" class="form-label">New password</label>
            <input id="rp-pass" type="password" class="form-control" formControlName="password" autocomplete="new-password"
                   [class.is-invalid]="form.controls.password.invalid && form.controls.password.touched">
            <div class="invalid-feedback">Password must be at least 6 characters.</div>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading()">
            @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span>Saving… } @else { Update password }
          </button>
        </form>
      </div>
    </div>
  `,
  styleUrl: './auth.scss',
})
export class ResetPassword {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly form = this.fb.nonNullable.group({ password: ['', [Validators.required, Validators.minLength(6)]] });

  submit(): void {
    this.error.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.auth.resetPassword(this.route.snapshot.paramMap.get('token') ?? '', this.form.getRawValue().password).subscribe({
      next: () => { this.toast.success('Password updated. You are logged in.'); this.router.navigateByUrl('/'); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
