import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="container py-5">
      <div class="surface empty-state mx-auto" style="max-width: 32rem">
        <div class="empty-icon"><i class="bi bi-signpost-split"></i></div>
        <h1 class="h3">Page not found</h1>
        <p class="text-muted">The page you're looking for doesn't exist or was moved.</p>
        <div class="d-flex justify-content-center gap-2">
          <a routerLink="/" class="btn btn-primary">Go home</a>
          <a routerLink="/shop" class="btn btn-outline-secondary">Browse products</a>
        </div>
      </div>
    </div>
  `,
})
export class NotFound {}
