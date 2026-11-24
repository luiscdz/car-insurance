import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { SummaryCopy } from '@car-insurance/shared';
import { Button } from '../../../../../shared/ui/button';
import { STEP_HEADING_ID } from '../../../shell/step-context';

/** What the confirmation shows: no value entered in a form step (AC-083). */
export interface ConfirmationView {
  readonly quoteNumber: string;
  readonly planName: string;
  /** The amount paid, formatted with the country's locale and currency (AC-042). */
  readonly amount: string;
}

/**
 * The confirmation of an approved payment (AC-083): the message, the quote number, the plan and
 * the amount paid as terms and descriptions, and the new quote action (AC-087). Its title is the
 * page heading, set by the summary step.
 */
@Component({
  selector: 'app-confirmation-panel',
  imports: [Button],
  host: { class: 'block' },
  template: `
    <p class="-mt-2 mb-6 text-pretty">{{ copy().confirmationMessage }}</p>
    <section
      class="min-w-0 rounded-lg border border-border bg-background px-4 py-5 md:p-6"
      [attr.aria-labelledby]="headingId"
    >
      <dl class="m-0 grid grid-cols-1">
        <div
          class="grid min-w-0 grid-cols-1 gap-0.5 pb-2.5 sm:grid-cols-[minmax(10rem,1fr)_2fr] sm:gap-4"
        >
          <dt class="text-sm font-semibold text-primary">{{ copy().quoteNumberLabel }}</dt>
          <dd
            class="m-0 min-w-0 text-xl font-bold tracking-wide text-primary-strong tabular-nums [overflow-wrap:anywhere]"
            translate="no"
          >
            {{ confirmation().quoteNumber }}
          </dd>
        </div>
        <div
          class="grid min-w-0 grid-cols-1 gap-0.5 border-t border-surface-muted py-2.5 sm:grid-cols-[minmax(10rem,1fr)_2fr] sm:gap-4"
        >
          <dt class="text-sm font-semibold text-primary">{{ copy().planLabel }}</dt>
          <dd class="m-0 min-w-0 font-semibold text-primary-strong [overflow-wrap:anywhere]">
            {{ confirmation().planName }}
          </dd>
        </div>
        <div
          class="grid min-w-0 grid-cols-1 gap-0.5 border-t border-surface-muted pt-2.5 sm:grid-cols-[minmax(10rem,1fr)_2fr] sm:gap-4"
        >
          <dt class="text-sm font-semibold text-primary">{{ copy().amountPaidLabel }}</dt>
          <dd class="m-0 min-w-0 font-semibold text-primary-strong tabular-nums">
            {{ confirmation().amount }}
          </dd>
        </div>
      </dl>
    </section>
    <div class="mt-8 flex">
      <button
        type="button"
        appButton="cta"
        class="w-full min-[480px]:w-auto"
        (click)="newQuote.emit()"
      >
        {{ copy().newQuoteLabel }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationPanel {
  readonly copy = input.required<SummaryCopy>();
  readonly confirmation = input.required<ConfirmationView>();
  readonly newQuote = output();
  protected readonly headingId = STEP_HEADING_ID;
}
