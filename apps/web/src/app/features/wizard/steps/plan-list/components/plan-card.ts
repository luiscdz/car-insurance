import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { PlanCopy } from '@car-insurance/shared';
import { Button } from '../../../../../shared/ui/button';
import type { PlanView, PriceState } from '../models/plan-view';

/** Element ids inside a plan card, derived from the plan's key. */
export function planCardIds(key: string) {
  return {
    name: `${key}-name`,
    badge: `${key}-badge`,
    basePrice: `${key}-base-price`,
    price: `${key}-price`,
    choose: `${key}-choose`,
    retry: `${key}-retry`,
  } as const;
}

/**
 * One plan of the plan list (AC-037, AC-038, AC-048, AC-060): badge, name, description, base price,
 * the final price area of the chosen plan, the choice action and the coverages and benefits. The
 * choice action names the plan and is described by the badge and the prices; the chosen plan is
 * marked with text and an icon, not by color alone. Presentational: inputs and outputs only.
 */
@Component({
  selector: 'app-plan-card',
  imports: [Button, NgTemplateOutlet],
  host: { class: 'block h-full' },
  template: `
    <article
      class="flex h-full min-w-0 flex-col rounded-md border-2 px-5 py-6"
      [class]="cardClasses()"
      [attr.aria-labelledby]="ids().name"
    >
      <div class="flex flex-col gap-1.5">
        @if (plan().recommended) {
          <span
            [id]="ids().badge"
            class="inline-flex items-center gap-1.5 self-start rounded-full bg-primary-strong py-0.5 pr-3 pl-2 text-sm font-bold text-primary-foreground"
          >
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="size-4">
              <path
                d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"
                fill="currentColor"
              />
            </svg>
            {{ copy().recommendedLabel }}
          </span>
        }
        <h2
          [id]="ids().name"
          class="m-0 text-[22px] leading-tight font-bold text-balance text-primary-strong"
        >
          {{ plan().name }}
        </h2>
        <p class="m-0 text-pretty">{{ plan().description }}</p>
      </div>

      <p [id]="ids().basePrice" class="mt-4 mb-0 flex flex-col">
        <span class="text-sm font-semibold">{{ copy().basePriceLabel }}</span>&ngsp;<span
          class="text-[28px] leading-tight font-bold text-primary-strong tabular-nums"
          >{{ plan().basePrice }}</span
        >
      </p>

      <div
        [id]="ids().price"
        role="status"
        tabindex="-1"
        class="focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
        [class]="priceClasses()"
      >
        @switch (shownPrice()?.kind) {
          @case ('waiting') {
            <span class="flex items-center gap-2.5 font-semibold text-primary-strong">
              <span
                aria-hidden="true"
                class="block size-5 flex-none rounded-full border-3 border-surface-info border-t-primary-strong motion-safe:animate-spin"
              ></span>
              {{ copy().quotingLabel }}
            </span>
          }
          @case ('ready') {
            <span class="text-sm font-semibold">{{ copy().finalPriceLabel }}</span>&ngsp;<span
              class="text-[26px] leading-tight font-bold text-primary-strong tabular-nums"
              >{{ readyAmount() }}</span
            >
          }
          @case ('error') {
            <span class="mb-2 flex items-start gap-1.5 font-semibold text-danger">
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                class="mt-0.5 size-5 flex-none"
              >
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
                <path d="M12 7v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <circle cx="12" cy="17" r="1.3" fill="currentColor" />
              </svg>
              {{ copy().priceErrorMessage }}
            </span>
            <button
              type="button"
              appButton="secondary"
              class="self-start"
              [id]="ids().retry"
              (click)="retry.emit()"
            >
              {{ copy().retryLabel }}
            </button>
          }
        }
      </div>

      <button
        type="button"
        appButton="secondary"
        class="mt-4 w-full gap-2 aria-pressed:cursor-default aria-pressed:border-primary-strong aria-pressed:bg-primary-strong aria-pressed:text-primary-foreground"
        [id]="ids().choose"
        [attr.aria-pressed]="chosen()"
        [attr.aria-label]="choiceName()"
        [attr.aria-describedby]="describedBy()"
        (click)="choose.emit()"
      >
        @if (chosen()) {
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" class="size-5 flex-none">
            <path
              d="M5 12.5l4.2 4.2L19 7"
              fill="none"
              stroke="currentColor"
              stroke-width="2.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        }
        {{ choiceLabel() }}
      </button>

      <h3 class="mt-5 mb-2 text-sm font-bold text-primary-strong">
        {{ copy().coveragesHeading }}
      </h3>
      <ul class="m-0 grid list-none gap-2 p-0">
        @for (coverage of plan().coverages; track $index) {
          <li class="flex items-start gap-2 text-[15px] leading-snug">
            <ng-container *ngTemplateOutlet="check" />
            <span>
              {{ coverage.name }}
              @if (coverage.highlight; as highlight) {
                <strong class="block font-bold text-primary-strong">{{ highlight }}</strong>
              }
            </span>
          </li>
        }
      </ul>

      @if (plan().benefits.length > 0) {
        <h3 class="mt-5 mb-2 text-sm font-bold text-primary-strong">
          {{ copy().benefitsHeading }}
        </h3>
        <ul class="m-0 grid list-none gap-2 p-0">
          @for (benefit of plan().benefits; track $index) {
            <li class="flex items-start gap-2 text-[15px] leading-snug">
              <ng-container *ngTemplateOutlet="check" />
              <span>{{ benefit }}</span>
            </li>
          }
        </ul>
      }
    </article>

    <ng-template #check>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        class="mt-0.5 size-4.5 flex-none text-primary"
      >
        <path
          d="M5 12.5l4.2 4.2L19 7"
          fill="none"
          stroke="currentColor"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCard {
  readonly plan = input.required<PlanView>();
  readonly copy = input.required<PlanCopy>();
  /** Whether this plan is the chosen one (AC-048). */
  readonly chosen = input.required<boolean>();
  /** The final price area of the chosen plan; `null` while none is shown. */
  readonly price = input<PriceState | null>(null);

  readonly choose = output();
  readonly retry = output();

  protected readonly ids = computed(() => planCardIds(this.plan().key));

  /** Only the chosen plan shows a final price, a wait or an error (AC-045, AC-048). */
  protected readonly shownPrice = computed(() => (this.chosen() ? this.price() : null));

  protected readonly readyAmount = computed(() => {
    const price = this.shownPrice();
    return price?.kind === 'ready' ? price.amount : '';
  });

  /** Visible text of the choice action: choose, or chosen for the chosen plan (AC-048). */
  protected readonly choiceLabel = computed(() =>
    this.chosen() ? this.copy().chosenLabel : this.copy().chooseLabel,
  );

  /** Accessible name: the visible text followed by the plan's name (AC-060). */
  protected readonly choiceName = computed(() => `${this.choiceLabel()}: ${this.plan().name}`);

  protected readonly describedBy = computed(() => {
    const ids = this.ids();
    const badge = this.plan().recommended ? [ids.badge] : [];
    return [...badge, ids.basePrice, ids.price].join(' ');
  });

  /** Recommended styling of the design reference; the chosen plan adds a strong outline. */
  protected readonly cardClasses = computed(() => {
    const background = this.plan().recommended ? 'bg-surface-info' : 'bg-background';
    if (this.chosen()) {
      return `${background} border-primary-strong ring-2 ring-primary-strong`;
    }
    return `${background} ${this.plan().recommended ? 'border-primary' : 'border-border'}`;
  });

  protected readonly priceClasses = computed(() => {
    const price = this.shownPrice();
    if (price === null) {
      return '';
    }
    const box = 'mt-4 flex min-h-18 flex-col justify-center rounded-md px-3.5 py-3';
    return price.kind === 'error'
      ? `${box} border-2 border-danger bg-background`
      : `${box} bg-surface-cta`;
  });
}
