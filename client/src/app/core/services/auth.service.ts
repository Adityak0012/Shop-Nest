import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Address, AuthResponse, User } from '../models';

const TOKEN_KEY = 'shopnest.token';
const USER_KEY = 'shopnest.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _user = signal<User | null>(readJson<User>(USER_KEY));
  private readonly _token = signal<string | null>(safeGet(TOKEN_KEY));

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token() && !!this._user());
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  token(): string | null {
    return this._token();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(tap((r) => this.setSession(r)));
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { name, email, password }).pipe(tap((r) => this.setSession(r)));
  }

  /** Refreshes the user from the server (role or address may have changed). */
  refresh(): void {
    if (!this._token()) return;
    this.http.get<{ user: User }>('/api/auth/me').subscribe({ next: ({ user }) => this.setUser(user), error: () => {} });
  }

  setAddress(address: Address): void {
    const u = this._user();
    if (u) this.setUser({ ...u, address });
  }

  logout(redirect = true): void {
    this._token.set(null);
    this._user.set(null);
    safeRemove(TOKEN_KEY);
    safeRemove(USER_KEY);
    if (redirect) this.router.navigateByUrl('/');
  }

  private setSession({ token, user }: AuthResponse): void {
    this._token.set(token);
    safeSet(TOKEN_KEY, token);
    this.setUser(user);
  }

  private setUser(user: User): void {
    this._user.set(user);
    safeSet(USER_KEY, JSON.stringify(user));
  }
}

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}
function safeRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
}
export function readJson<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
export { safeSet };
