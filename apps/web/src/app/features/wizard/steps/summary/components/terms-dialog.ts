import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrnDialogTitle, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { Button } from '../../../../../shared/ui/button';

export interface TermsDialogContext {
  readonly title: string;
  readonly closeLabel: string;
  /** The country's terms split into paragraphs, shown as plain text (AC-074). */
  readonly paragraphs: readonly string[];
  readonly close: () => void;
}

/** Selector of the title, which receives focus when the dialog opens (AC-075). */
export const TERMS_DIALOG_INITIAL_FOCUS = '[data-terms-title]';

/**
 * The terms and conditions dialog (AC-074, AC-075): modal, named by its title, with the country's
 * terms as plain-text paragraphs. Interpolation never interprets markup and line breaks inside a
 * paragraph are kept. The text scrolls inside the dialog while the title and the close action stay
 * visible.
 */
@Component({
  selector: 'app-terms-dialog',
  imports: [BrnDialogTitle, Button],
  host: {
    class:
      'flex max-h-[min(80vh,720px)] w-[min(640px,calc(100vw-32px))] flex-col rounded-lg bg-background text-foreground shadow-2xl',
  },
  template: `
    <div
      class="flex flex-none items-start justify-between gap-3 border-b border-surface-muted px-4 pt-4 pb-3 min-[480px]:px-5 min-[480px]:pt-5"
    >
      <h2
        brnDialogTitle
        data-terms-title
        tabindex="-1"
        class="m-0 min-w-0 text-[22px] leading-snug font-bold text-balance text-primary-strong [overflow-wrap:anywhere] focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
      >
        {{ context.title }}
      </h2>
      <button
        type="button"
        appButton="secondary"
        class="min-h-10! flex-none px-4! py-1.5!"
        (click)="context.close()"
      >
        {{ context.closeLabel }}
      </button>
    </div>
    <div
      role="region"
      tabindex="0"
      class="min-h-0 overflow-y-auto overscroll-contain px-4 pt-3 pb-5 focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-primary-strong min-[480px]:px-5"
      [attr.aria-label]="context.title"
      data-terms-body
    >
      @for (paragraph of context.paragraphs; track $index) {
        <p class="mb-3 whitespace-pre-line text-pretty [overflow-wrap:anywhere]">
          {{ paragraph }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsDialog {
  protected readonly context = injectBrnDialogContext<TermsDialogContext>();
}
