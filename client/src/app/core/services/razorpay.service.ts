import { Injectable } from '@angular/core';

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color: string };
  handler: (res: RazorpaySuccess) => void;
  modal?: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open(): void; on(event: string, cb: (e: unknown) => void): void };
  }
}

/** Loads Razorpay Checkout on demand and opens it. Resolves with the payment ids, rejects if closed or failed. */
@Injectable({ providedIn: 'root' })
export class RazorpayService {
  private loading?: Promise<void>;

  private load(): Promise<void> {
    if (window.Razorpay) return Promise.resolve();
    this.loading ??= new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => {
        this.loading = undefined;
        reject(new Error('Could not load Razorpay. Check your internet connection.'));
      };
      document.body.appendChild(s);
    });
    return this.loading;
  }

  async pay(opts: Omit<RazorpayOptions, 'handler' | 'modal'>): Promise<RazorpaySuccess> {
    await this.load();
    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay!({
        ...opts,
        handler: (res) => resolve(res),
        modal: { ondismiss: () => reject(new Error('Payment was cancelled')) },
      });
      rzp.on('payment.failed', () => reject(new Error('Payment failed. You can try again from your order page.')));
      rzp.open();
    });
  }
}
