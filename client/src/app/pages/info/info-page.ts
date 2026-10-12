import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface Section { h: string; p: string; }
interface Page { eyebrow: string; title: string; intro: string; sections: Section[]; }

const PAGES: Record<string, Page> = {
  about: {
    eyebrow: 'About', title: 'Good things, delivered.',
    intro: 'ShopNest is a full-stack e-commerce project built to show how a modern online store works end to end.',
    sections: [
      { h: 'What it is', p: 'A MEAN-stack store (MongoDB, Express, Angular, Node.js) with product search, reviews, wishlist, coupons, Razorpay test payments, Cash on Delivery and an admin dashboard.' },
      { h: 'Built by', p: 'Aditya Kale, a software developer from Pune. The code is open on GitHub, and every price, stock count and coupon is verified on the server, never trusted from the browser.' },
      { h: 'Demo store', p: 'Products are sample data with photos from Unsplash. No real orders are fulfilled and no real money is charged in test mode.' },
    ],
  },
  contact: {
    eyebrow: 'Contact', title: 'Say hello.',
    intro: 'Questions about an order, or about the project itself? Here is where to find us.',
    sections: [
      { h: 'Order help', p: 'Open My orders and choose the order to see its details. Orders can be cancelled any time before dispatch.' },
      { h: 'About the project', p: 'Find the source code on GitHub (Adityak0012/ShopNest) or reach out on LinkedIn (adityak0012).' },
      { h: 'Response time', p: 'This is a portfolio demo, so there is no live support desk. Messages on GitHub or LinkedIn are answered as soon as possible.' },
    ],
  },
  shipping: {
    eyebrow: 'Policies', title: 'Shipping & returns',
    intro: 'Simple rules, written down so there are no surprises at checkout.',
    sections: [
      { h: 'Delivery fee', p: 'Orders of ₹999 or more ship free. Smaller orders pay a flat ₹49.' },
      { h: 'Delivery time', p: 'Metro cities usually receive orders in 2 to 3 days, other locations in 4 to 6 days. Enter your pincode on a product page for an estimate.' },
      { h: 'Payment', p: 'Pay online with UPI or cards through Razorpay, or choose Cash on Delivery.' },
      { h: 'Cancellation', p: 'Cancel from My orders any time before the order is shipped. Stock is released straight away and any coupon you used becomes available again.' },
      { h: 'Returns', p: 'Unused items can be returned within 7 days of delivery. Refunds go back to the original payment method.' },
    ],
  },
  privacy: {
    eyebrow: 'Legal', title: 'Privacy policy',
    intro: 'What this demo store keeps about you, and why.',
    sections: [
      { h: 'What we store', p: 'Your name, email, delivery address, orders and wishlist. Passwords are stored as one-way bcrypt hashes and are never readable.' },
      { h: 'Payments', p: 'Card and UPI details are entered on Razorpay and never reach this server.' },
      { h: 'Google sign-in', p: 'If you sign in with Google we receive your name and verified email address, nothing else.' },
      { h: 'On your device', p: 'The browser keeps a sign-in token, your recently viewed products and your pincode. Log out any time to remove the token.' },
    ],
  },
  terms: {
    eyebrow: 'Legal', title: 'Terms of use',
    intro: 'ShopNest is a demonstration project. By using it you agree to the following.',
    sections: [
      { h: 'Demo only', p: 'Products, prices and orders are sample data. Nothing listed here is actually for sale.' },
      { h: 'Accounts', p: 'Keep your password private. You are responsible for activity on your account.' },
      { h: 'Fair use', p: "Do not attempt to disrupt the service or access other people's data." },
      { h: 'Changes', p: 'These terms and the store itself may change at any time as the project evolves.' },
    ],
  },
};

@Component({
  selector: 'app-info-page',
  imports: [RouterLink],
  template: `
    <div class="container py-5">
      <article class="info mx-auto fade-in">
        <p class="eyebrow mb-3">{{ page.eyebrow }}</p>
        <h1 class="display-5 mb-3">{{ page.title }}</h1>
        <p class="lead text-muted mb-5">{{ page.intro }}</p>
        @for (s of page.sections; track s.h) {
          <section class="info-sec">
            <h2 class="h5">{{ s.h }}</h2>
            <p class="text-muted mb-0">{{ s.p }}</p>
          </section>
        }
        <a routerLink="/shop" class="btn btn-primary mt-4">Continue shopping</a>
      </article>
    </div>
  `,
  styles: `
    .info { max-width: 44rem; }
    .info-sec { padding: 1.4rem 0; border-top: 1px solid var(--sn-line); }
    .info-sec h2 { margin-bottom: 0.5rem; }
  `,
})
export class InfoPage {
  readonly page = PAGES[inject(ActivatedRoute).snapshot.data['page']] ?? PAGES['about'];
}
