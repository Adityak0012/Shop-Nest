import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="container-xxl py-4">
      <div class="row g-4">
        <aside class="col-lg-2">
          <p class="small-caps mb-2 d-none d-lg-block">Admin</p>
          <nav class="admin-nav" aria-label="Admin">
            <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><i class="bi bi-speedometer2"></i>Dashboard</a>
            <a routerLink="/admin/products" routerLinkActive="active"><i class="bi bi-box-seam"></i>Products</a>
            <a routerLink="/admin/orders" routerLinkActive="active"><i class="bi bi-receipt"></i>Orders</a>
            <a routerLink="/admin/coupons" routerLinkActive="active"><i class="bi bi-ticket-perforated"></i>Coupons</a>
            <a routerLink="/" class="d-none d-lg-flex mt-3"><i class="bi bi-shop"></i>View store</a>
          </nav>
        </aside>
        <section class="col-lg-10">
          <router-outlet />
        </section>
      </div>
    </div>
  `,
  styles: `
    .admin-nav { display: flex; gap: .25rem; overflow-x: auto; }
    @media (min-width: 992px) { .admin-nav { flex-direction: column; position: sticky; top: 5.5rem; } }
    .admin-nav a { display: flex; align-items: center; gap: .6rem; min-height: 2.75rem; padding: 0 .85rem; border-radius: .6rem;
      color: #3d4863; font-weight: 600; text-decoration: none; white-space: nowrap; }
    .admin-nav a:hover { background: #fff; }
    .admin-nav a.active { background: #fff; color: #0b1530; box-shadow: var(--sn-shadow-sm); border: 1px solid #e1e8f5; }
    .admin-nav .bi { font-size: 1.05rem; }
  `,
})
export class AdminLayout {}
