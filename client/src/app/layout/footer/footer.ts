import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
        <footer class="sn-footer">
      <div class="container">
        <div class="row gx-4 gy-5 pb-5">
          <div class="col-lg-5">
            <p class="f-lead mb-3">Good things, delivered to your door.</p>
            <p class="mb-4 f-muted" style="max-width: 26rem">
              Considered tech and everyday essentials, delivered across India. A full-stack MEAN project built with Angular, Node.js, Express and MongoDB.
            </p>
            <div class="d-flex gap-2">
              <a class="f-social" href="https://github.com/Adityak0012/ShopNest" target="_blank" rel="noopener" aria-label="Source code on GitHub"><i class="bi bi-github"></i></a>
              <a class="f-social" href="https://www.linkedin.com/in/AdityaK0012" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="bi bi-linkedin"></i></a>
            </div>
          </div>
          <div class="col-6 col-lg-2">
            <p class="f-head">Shop</p>
            <ul class="f-list">
              <li><a routerLink="/shop" [queryParams]="{ category: 'Audio' }">Audio</a></li>
              <li><a routerLink="/shop" [queryParams]="{ category: 'Laptops' }">Laptops</a></li>
              <li><a routerLink="/shop" [queryParams]="{ category: 'Wearables' }">Wearables</a></li>
              <li><a routerLink="/shop" [queryParams]="{ category: 'Fashion' }">Fashion</a></li>
              <li><a routerLink="/shop">All products</a></li>
            </ul>
          </div>
          <div class="col-6 col-lg-2">
            <p class="f-head">Account</p>
            <ul class="f-list">
              <li><a routerLink="/orders">My orders</a></li>
              <li><a routerLink="/cart">Bag</a></li>
              <li><a routerLink="/login">Log in</a></li>
              <li><a routerLink="/register">Create account</a></li>
            </ul>
          </div>
          <div class="col-lg-3">
            <p class="f-head">Why ShopNest</p>
            <ul class="f-list f-perks">
              <li><i class="bi bi-truck"></i>Free delivery over ₹999</li>
              <li><i class="bi bi-cash-coin"></i>Cash on Delivery</li>
              <li><i class="bi bi-shield-check"></i>Secure Razorpay payments</li>
              <li><i class="bi bi-arrow-repeat"></i>Cancel before dispatch</li>
            </ul>
          </div>
        </div>
        <a routerLink="/" class="f-giant" aria-label="ShopNest home">Shop<em>Nest</em></a>
        <div class="f-bottom">
          <span>© {{ year }} ShopNest · Built by Aditya Kale</span>
          <span class="f-legal"><a routerLink="/about">About</a><a routerLink="/contact">Contact</a><a routerLink="/shipping-returns">Shipping &amp; returns</a><a routerLink="/privacy">Privacy</a><a routerLink="/terms">Terms</a></span>
        </div>
      </div>
    </footer>
  `,
  styles: `
    :host { display: block; margin-top: 5rem; }
    .to-top { display: none; }
    .sn-footer { background: #0e0e10; color: #a9a9b1; padding: clamp(3rem, 5vw, 4.5rem) 0 0; overflow: hidden; position: relative; }
    .f-giant { font-family: 'Syne Variable', sans-serif; font-weight: 800; font-size: clamp(3rem, 10.2vw, 9.6rem); letter-spacing: -0.05em; line-height: 0.8; color: #fff; text-decoration: none; display: block; margin: 2.5rem 0 0; padding-bottom: 0.18em; white-space: nowrap; }
    .f-giant em { color: #cdbdff; font-style: normal; }
    .f-muted { color: #8c8c94; font-size: .95rem; line-height: 1.7; }
    .f-lead { font-family: 'Syne Variable', sans-serif; font-weight: 700; font-size: clamp(1.6rem, 3vw, 2.4rem); letter-spacing: -0.04em; line-height: 1.05; color: #fff; max-width: 26rem; }
    .f-head { font-size: .95rem; color: #fff; font-weight: 700; margin-bottom: 1rem; }
    .f-list { list-style: none; padding: 0; margin: 0; display: grid; gap: .75rem; font-size: .95rem; }
    .f-list a { color: #e7e7e4; text-decoration: none; transition: color .2s, padding-left .25s; }
    .f-list a:hover { color: #cdbdff; padding-left: .3rem; }
    .f-perks li { display: flex; gap: .6rem; align-items: center; color: #e7e7e4; }
    .f-perks .bi { color: #cdbdff; }
    .f-social { width: 2.8rem; height: 2.8rem; border-radius: 50%; display: grid; place-items: center; color: #fff; border: 1px solid #3a3a40; text-decoration: none; transition: background .2s, transform .2s; }
    .f-social:hover { background: #cdbdff; color: #111113; border-color: #cdbdff; transform: translateY(-3px); }
    .f-legal { display: flex; flex-wrap: wrap; gap: .4rem 1.2rem; }
    .f-legal a { color: #a9a9b1; text-decoration: none; }
    .f-legal a:hover { color: #cdbdff; }
    .f-bottom { border-top: 1px solid #2a2a2f; padding: 1.4rem 0; display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; font-size: .8rem; color: #8c8c94; position: relative; z-index: 1; background: #0e0e10; }
  `,
})
export class Footer {
  readonly year = new Date().getFullYear();
  top(): void { window.scrollTo({ top: 0, behavior: 'smooth' }); }
}
