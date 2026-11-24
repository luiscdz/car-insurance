import { Directive, computed, input } from '@angular/core';

export type ButtonVariant = 'cta' | 'secondary' | 'link';

const BASE =
  'inline-flex min-h-12 cursor-pointer items-center justify-center text-center font-bold ' +
  'no-underline transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-primary-strong';

const PILL = 'rounded-full border-2 px-7 py-2.5';

const VARIANTS: Readonly<Record<ButtonVariant, string>> = {
  cta:
    `${PILL} border-transparent bg-cta text-cta-foreground hover:border-cta-foreground ` +
    'aria-disabled:cursor-not-allowed aria-disabled:border-border aria-disabled:bg-surface-muted ' +
    'aria-disabled:text-disabled',
  secondary: `${PILL} border-primary bg-background text-primary hover:bg-surface-info`,
  link:
    'px-1 py-2.5 text-primary underline underline-offset-4 hover:text-primary-strong ' +
    'hover:decoration-2',
};

/** Spartan UI style button for `button` and `a` elements, with the design reference's variants. */
@Directive({
  selector: '[appButton]',
  host: { '[class]': 'classes()' },
})
export class Button {
  readonly variant = input<ButtonVariant>('cta', { alias: 'appButton' });

  protected readonly classes = computed(() => `${BASE} ${VARIANTS[this.variant()]}`);
}
