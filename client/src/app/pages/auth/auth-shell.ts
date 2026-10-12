import { Component, input } from '@angular/core';
import { Reveal } from '../../shared/reveal';

/** Split-screen frame for login and register: a quiet brand panel on the left, the form on the right. */
@Component({
  selector: 'app-auth-shell',
  imports: [Reveal],
  template: `
    <section class="shell" snReveal="intro">
      <aside class="aside" aria-hidden="true">
        <a class="brand" href="/" data-in>Shop<em>Nest</em></a>
        <div class="aside-body">
          <h2 class="aside-title">
            @for (w of words(); track $index) { <span class="w"><span data-in="word">{{ w }}</span></span> }
          </h2>
          <p class="aside-lead" data-in>{{ lead() }}</p>
        </div>
        <div class="collage">
          <figure class="ph ph-1" data-in="clip"><img src="/images/products/pulse-anc-headphones.jpg" alt="" (error)="hide($event)"></figure>
          <figure class="ph ph-2" data-in="clip"><img src="/images/products/classic-steel-watch.jpg" alt="" (error)="hide($event)"></figure>
          <figure class="ph ph-3" data-in="clip"><img src="/images/products/stride-running-sneakers.jpg" alt="" (error)="hide($event)"></figure>
        </div>
        <ul class="points" data-in>
          <li><i class="bi bi-truck"></i>Free delivery over ₹999</li>
          <li><i class="bi bi-cash-coin"></i>Pay on delivery</li>
          <li><i class="bi bi-arrow-repeat"></i>Cancel until it ships</li>
        </ul>
      </aside>
      <div class="panel">
        <div class="auth-card"><ng-content /></div>
      </div>
    </section>
  `,
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
  readonly words = input<string[]>([]);
  readonly lead = input('');
  hide(e: Event): void { (e.target as HTMLElement).remove(); }
}
