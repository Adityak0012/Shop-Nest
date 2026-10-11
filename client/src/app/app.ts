import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar/navbar';
import { Footer } from './layout/footer/footer';
import { ToastContainer } from './shared/toast/toast-container';
import { AuthService } from './core/services/auth.service';
import { ShopService } from './core/services/shop.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, ToastContainer],
  template: `
    <app-navbar />
    <main id="main" class="flex-grow-1">
      <router-outlet />
    </main>
    <app-footer />
    <app-toast-container />
  `,
  host: { class: 'd-flex flex-column min-vh-100' },
})
export class App {
  constructor() {
    inject(ShopService).loadPaymentConfig();
    inject(AuthService).refresh();
  }
}
