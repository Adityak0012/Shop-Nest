import { Directive, ElementRef, OnDestroy, inject, input, afterNextRender } from '@angular/core';
import { animate, inView, stagger } from 'motion';

/**
 * Scroll / intro animations built on the `motion` library (the engine behind Framer Motion).
 *   snReveal            fade + rise the element once it enters the viewport
 *   snReveal="stagger"  same, but its direct children rise one after another
 *   snReveal="intro"    plays immediately on load: `[data-in]` children rise in sequence,
 *                       `[data-in="word"]` children slide up out of a mask
 * Respects prefers-reduced-motion (content simply stays visible).
 */
@Directive({ selector: '[snReveal]' })
export class Reveal implements OnDestroy {
  readonly snReveal = input<'' | 'stagger' | 'intro'>('');
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private stop?: () => void;
  private reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    if (this.reduced) return;
    afterNextRender(() => {
      const mode = this.snReveal();
      if (mode === 'intro') return this.intro();
      const staggered = mode === 'stagger';
      this.el.classList.add('sn-pre');
      if (staggered) this.el.classList.add('sn-stagger');
      this.stop = inView(this.el, () => {
        const targets: Element | Element[] = staggered ? Array.from(this.el.children) : this.el;
        const done = () => this.el.classList.remove('sn-pre', 'sn-stagger');
        if (staggered) {
          (targets as Element[]).forEach((c) => ((c as HTMLElement).style.opacity = '0'));
          done();
          animate(targets as Element[], { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] },
            { duration: 0.6, delay: stagger(0.07, { startDelay: 0.05 }), ease: [0.2, 0.8, 0.2, 1] }).finished.then(() =>
            (targets as HTMLElement[]).forEach((c) => { c.style.opacity = ''; c.style.transform = ''; }));
        } else {
          animate(this.el, { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0px)'] }, { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] })
            .finished.then(() => { done(); this.el.style.opacity = ''; this.el.style.transform = ''; });
        }
        this.stop?.();
      }, { amount: 0.12 });
    });
  }

  private intro(): void {
    const words = Array.from(this.el.querySelectorAll<HTMLElement>('[data-in="word"]'));
    const clips = Array.from(this.el.querySelectorAll<HTMLElement>('[data-in="clip"]'));
    const rest = Array.from(this.el.querySelectorAll<HTMLElement>('[data-in]:not([data-in="word"]):not([data-in="clip"])'));
    clips.forEach((c) => (c.style.clipPath = 'inset(100% 0 0 0)'));
    if (clips.length) {
      animate(clips, { clipPath: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'] }, { duration: 1.3, delay: stagger(0.14, { startDelay: 0.15 }), ease: [0.76, 0, 0.24, 1] })
        .finished.then(() => clips.forEach((c) => (c.style.clipPath = '')));
    }
    words.forEach((w) => (w.style.transform = 'translateY(115%)'));
    rest.forEach((r) => (r.style.opacity = '0'));
    animate(words, { transform: ['translateY(115%)', 'translateY(0%)'] }, { duration: 0.9, delay: stagger(0.09), ease: [0.16, 1, 0.3, 1] });
    animate(rest, { opacity: [0, 1], transform: ['translateY(36px) scale(0.96)', 'translateY(0px) scale(1)'] },
      { type: 'spring', stiffness: 160, damping: 22, delay: stagger(0.09, { startDelay: 0.5 }) }).finished.then(() =>
      rest.forEach((r) => { r.style.opacity = ''; r.style.transform = ''; }));
  }

  ngOnDestroy(): void { this.stop?.(); }
}
