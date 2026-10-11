import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  { path: '', title: 'ShopNest – Shop electronics, fashion and more', loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'shop', title: 'Shop all products · ShopNest', loadComponent: () => import('./pages/shop/shop').then((m) => m.Shop) },
  { path: 'product/:slug', loadComponent: () => import('./pages/product/product-detail').then((m) => m.ProductDetail) },
  { path: 'cart', title: 'Your bag · ShopNest', loadComponent: () => import('./pages/cart/cart').then((m) => m.Cart) },
  { path: 'checkout', title: 'Checkout · ShopNest', canActivate: [authGuard], loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout) },
  { path: 'wishlist', title: 'My wishlist · ShopNest', canActivate: [authGuard], loadComponent: () => import('./pages/wishlist/wishlist').then((m) => m.Wishlist) },
  { path: 'orders', title: 'My orders · ShopNest', canActivate: [authGuard], loadComponent: () => import('./pages/orders/orders').then((m) => m.Orders) },
  { path: 'orders/:id', title: 'Order details · ShopNest', canActivate: [authGuard], loadComponent: () => import('./pages/order-detail/order-detail').then((m) => m.OrderDetail) },
  { path: 'login', title: 'Log in · ShopNest', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/login').then((m) => m.Login) },
  { path: 'register', title: 'Create account · ShopNest', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/register').then((m) => m.Register) },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', title: 'Dashboard · ShopNest Admin', loadComponent: () => import('./admin/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'products', title: 'Products · ShopNest Admin', loadComponent: () => import('./admin/products/admin-products').then((m) => m.AdminProducts) },
      { path: 'products/new', title: 'New product · ShopNest Admin', loadComponent: () => import('./admin/product-form/product-form').then((m) => m.ProductForm) },
      { path: 'products/:slug/edit', title: 'Edit product · ShopNest Admin', loadComponent: () => import('./admin/product-form/product-form').then((m) => m.ProductForm) },
      { path: 'orders', title: 'Orders · ShopNest Admin', loadComponent: () => import('./admin/orders/admin-orders').then((m) => m.AdminOrders) },
      { path: 'coupons', title: 'Coupons · ShopNest Admin', loadComponent: () => import('./admin/coupons/admin-coupons').then((m) => m.AdminCoupons) },
    ],
  },
  { path: '**', title: 'Page not found · ShopNest', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound) },
];
