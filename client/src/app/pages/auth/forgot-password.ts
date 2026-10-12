import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { errorMessage } from '../../core/models';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="container py-5">
      <div class="auth-card surface p-4 p-md-5 mx-auto fade-in">
        <div class="text-center mb-4">
          <span class="auth-icon"><i class="bi bi-key"></i></span>
          <h1 class="h3 mb-1">Forgot your password?</h1>
          <p class="text-muted mb-0">Enter your email and we'll send you a reset link.</p>
        </div>
        @if (error()) { <div class="alert alert-danger small py-2" role="alert">{{ error() }}</div> }
        @if (sent()) {
          <div class="alert alert-success small py-2" role="status"><i class="bi bi-check-circle me-1"></i>{{ message() }}</div>
          @if (devLink()) {
            <div class="demo-note small">
              <strong>Demo mode:</strong> no email service is connected, so here is your link:
              <a [href]="devLink()" class="d-block text-break mt-1">{{ devLink() }}</a>
            </div>
          }
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="d-grid gap-3">
            <div>
              <label for="fp-email" class="form-label">Email</label>
              <input id="fp-email" type="email" class="form-control" formControlName="email" autocomplete="email"
                     [class.is-invalid]="form.controls.email.invalid && form.controls.email.touched">
              <div class="invalid-feedback">Enter a valid email address.</div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading()">
              @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span>Sending… } @else { Send reset link }
            </button>
          </form>
        }
        <p class="text-center mt-4 mb-0"><a routerLink="/login" class="fw-semibold">Back to log in</a></p>
      </div>
    </div>
  `,
  styleUrl: './auth.scss',
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly sent = signal(false);
  readonly message = signal('');
  readonly devLink = signal('');
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });

  submit(): void {
    this.error.set('');
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.auth.forgotPassword(this.form.getRawValue().email).subscribe({
      next: (r) => { this.message.set(r.message); this.devLink.set(r.devResetLink ?? ''); this.sent.set(true); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
