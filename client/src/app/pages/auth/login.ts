import { Component, ElementRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/models';
import { AuthShell } from './auth-shell';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  template: `
    <app-auth-shell [words]="['Good', 'to', 'see', 'you', 'again.']" lead="Log in to check out faster, track your orders and keep your wishlist.">
        <div class="auth-head" data-in>
          <h1>Welcome back</h1>
          <p>Log in to check out and track your orders.</p>
        </div>

        @if (expired) { <div class="alert alert-warning small py-2">Your session expired. Please log in again.</div> }
        @if (error()) { <div class="alert alert-danger small py-2" role="alert"><i class="bi bi-exclamation-circle me-1"></i>{{ error() }}</div> }

        <div class="google-wrap" data-in>
          <div #gbtn class="g-slot" [class.d-none]="!googleReady()"></div>
          @if (!googleReady()) {
            <button type="button" class="btn btn-light btn-lg w-100 g-fallback" (click)="googleHelp.set(!googleHelp())">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
              <span class="ms-2">Sign in with Google</span>
            </button>
            @if (googleHelp()) {
              <p class="small text-muted mt-2 mb-0">Google sign-in isn't switched on yet. Add <code>GOOGLE_CLIENT_ID</code> to <code>server/.env</code> and restart the server.</p>
            }
          }
          <div class="or-divider"><span>or log in with email</span></div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="d-grid gap-3 auth-form" data-in>
          <div>
            <label for="email" class="form-label">Email</label>
            <input id="email" type="email" class="form-control" formControlName="email" autocomplete="email"
                   [class.is-invalid]="form.controls.email.invalid && form.controls.email.touched">
            <div class="invalid-feedback">Enter a valid email address.</div>
          </div>
          <div>
            <div class="d-flex justify-content-between align-items-baseline">
              <label for="password" class="form-label">Password</label>
              <a routerLink="/forgot-password" class="small fw-semibold">Forgot password?</a>
            </div>
            <div class="input-group has-validation">
              <input id="password" [type]="show() ? 'text' : 'password'" class="form-control" formControlName="password" autocomplete="current-password"
                     [class.is-invalid]="form.controls.password.invalid && form.controls.password.touched">
              <button class="btn btn-outline-secondary" type="button" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Hide password' : 'Show password'">
                <i class="bi" [class]="show() ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
              <div class="invalid-feedback">Enter your password.</div>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-lg auth-btn" [disabled]="loading()">
            @if (loading()) { <span class="spinner-border spinner-border-sm me-2"></span>Logging in… } @else { Log in <i class="bi bi-arrow-right"></i> }
          </button>
        </form>

        <p class="auth-foot" data-in>New to ShopNest? <a [routerLink]="['/register']" [queryParams]="{ returnUrl }" class="fw-semibold">Create an account</a></p>
    </app-auth-shell>
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

  readonly googleReady = signal(false);
  readonly googleHelp = signal(false);
  private slot = viewChild<ElementRef<HTMLElement>>('gbtn');

  constructor() {
    afterNextRender(() => {
      this.auth.googleConfig().subscribe({
        next: ({ googleClientId }) => { if (googleClientId) this.loadGoogle(googleClientId); },
        error: () => {},
      });
    });
  }

  /** Loads Google's sign-in script and draws the official button. */
  private loadGoogle(clientId: string): void {
    const init = () => {
      const g = (window as any).google?.accounts?.id;
      const el = this.slot()?.nativeElement;
      if (!g || !el) return;
      g.initialize({ client_id: clientId, callback: (r: { credential: string }) => this.onGoogle(r.credential) });
      g.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: Math.min(el.parentElement?.clientWidth || 340, 400) });
      this.googleReady.set(true);
    };
    if ((window as any).google?.accounts?.id) return init();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = init;
    document.head.appendChild(s);
  }

  private onGoogle(credential: string): void {
    this.error.set('');
    this.loading.set(true);
    this.auth.googleLogin(credential).subscribe({
      next: ({ user }) => {
        this.toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
        const target = this.returnUrl.startsWith('/') ? this.returnUrl : '/';
        this.router.navigateByUrl(user.role === 'admin' && target === '/' ? '/admin' : target);
      },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
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
