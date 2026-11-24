import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../../../../shared/ui/button';
import type { SummaryRow } from '../models/summary-view';

/** The edit or change action of a section: a link to a step of the wizard (AC-071, AC-072). */
export interface SectionAction {
  readonly label: string;
  /** Accessible name; it includes the section title for edit actions (AC-071, AC-090). */
  readonly name: string;
  readonly link: readonly string[];
}

/**
 * A summary section (AC-067, AC-090): a heading that names the section, its label and value pairs
 * as terms and descriptions, an optional edit or change action and projected content. While a
 * payment is processed the action is locked: no link, disabled style, exposed as disabled
 * (AC-078).
 */
@Component({
  selector: 'app-summary-section',
  imports: [Button, RouterLink],
  host: { class: 'block min-w-0' },
  template: `
    <section
      class="min-w-0 rounded-lg border px-4 py-5 md:p-6"
      [class]="highlighted() ? 'border-primary bg-surface-info' : 'border-border bg-background'"
      [attr.aria-labelledby]="headingId()"
    >
      <div class="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2
          [id]="headingId()"
          class="m-0 min-w-0 text-xl leading-snug font-bold text-balance text-primary-strong [overflow-wrap:anywhere]"
        >
          {{ title() }}
        </h2>
        @if (action(); as action) {
          <a
            appButton="secondary"
            class="min-h-10! px-4.5! py-1.5! text-[15px] hover:text-primary-strong aria-disabled:cursor-not-allowed aria-disabled:border-border aria-disabled:text-disabled aria-disabled:hover:bg-background"
            [routerLink]="locked() ? null : action.link"
            [attr.role]="locked() ? 'link' : null"
            [attr.aria-disabled]="locked() ? 'true' : null"
            [attr.aria-label]="action.name === action.label ? null : action.name"
            >{{ action.label }}</a
          >
        }
      </div>
      @if (rows().length > 0) {
        <dl class="m-0 grid grid-cols-1">
          @for (row of rows(); track row.key) {
            <div
              class="grid min-w-0 grid-cols-1 gap-0.5 border-t border-surface-muted py-2.5 first:border-t-0 first:pt-0 sm:grid-cols-[minmax(10rem,1fr)_2fr] sm:gap-4"
            >
              <dt class="text-sm font-semibold text-primary">{{ row.label }}</dt>
              <dd
                class="m-0 min-w-0 font-semibold text-primary-strong tabular-nums [overflow-wrap:anywhere]"
                translate="no"
              >
                {{ row.value }}
              </dd>
            </div>
          }
        </dl>
      }
      <ng-content />
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummarySection {
  readonly headingId = input.required<string>();
  readonly title = input.required<string>();
  readonly rows = input<readonly SummaryRow[]>([]);
  readonly action = input<SectionAction | null>(null);
  readonly locked = input(false);
  readonly highlighted = input(false);
}
