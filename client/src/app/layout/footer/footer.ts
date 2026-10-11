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
            <a routerLink="/" class="f-wordmark">Shop<em>Nest</em></a>
            <p class="mt-3 mb-4 f-muted" style="max-width: 26rem">
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
        <div class="f-bottom">
          <span>© {{ year }} ShopNest · Built by Aditya Kale</span>
          <span>Demo store. Product photos from Unsplash.</span>
        </div>
      </div>
    </footer>
  `,
  styles: `
    .sn-footer { background: radial-gradient(1200px 400px at 85% -10%, #17307a 0%, transparent 60%), #0b1530; border-radius: 2rem 2rem 0 0; color: #e1e8f5; padding-top: 4.5rem; margin-top: 5rem; }
    .f-wordmark { font-family: 'Plus Jakarta Sans Variable', system-ui, sans-serif; font-size: 2rem; color: #fff; text-decoration: none; letter-spacing: -0.03em; }
    .f-wordmark { font-weight: 800; } .f-wordmark em { color: #6f9bff; font-weight: 800; }
    .f-muted { color: #9aa6c0; font-size: .92rem; line-height: 1.6; }
    .f-head { font-size: .72rem; letter-spacing: .16em; text-transform: uppercase; color: #9aa6c0; font-weight: 700; margin-bottom: 1rem; }
    .f-list { list-style: none; padding: 0; margin: 0; display: grid; gap: .7rem; font-size: .92rem; }
    .f-list a { color: #e1e8f5; text-decoration: none; }
    .f-list a:hover { color: #fff; text-decoration: underline; }
    .f-perks li { display: flex; gap: .6rem; align-items: center; color: #cfd8ea; }
    .f-perks .bi { color: #8fb4ff; }
    .f-social { width: 2.6rem; height: 2.6rem; border-radius: 999px; display: grid; place-items: center; color: #fff; border: 1px solid #1d2a4d; }
    .f-social:hover { background: #fff; color: #0b1530; }
    .f-bottom { border-top: 1px solid #16213f; padding: 1.4rem 0; display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; font-size: .8rem; color: #8190b0; }
  `,
})
export class Footer {
  readonly year = new Date().getFullYear();
}
