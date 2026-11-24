import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PlanCopy, WizardContent, WizardStep } from '@car-insurance/shared';
import { CLOCK } from '../../../../core/clock';
import { PRICE_QUOTE } from '../../../../core/quote/price-quote';
import { pricingInputs } from '../../../../core/quote/pricing-inputs';
import { WizardStateStore } from '../../../../core/wizard-state/wizard-state';
import { Button } from '../../../../shared/ui/button';
import { StatusMessage } from '../../../../shared/ui/status-message';
import { STEP_CONTEXT, STEP_HEADING_ID } from '../../shell/step-context';
import { PlanCard, planCardIds } from './components/plan-card';
import { formatAmount, type PlanView, type PriceState, toPlanViews } from './models/plan-view';

/** Element id of the message asking to choose a plan (AC-051). */
const CHOOSE_MESSAGE_ID = 'choose-plan-message';

/** Copy used only while no content is available; the shell renders no step then. */
const NO_PLAN_COPY: PlanCopy = {
  chooseLabel: '',
  chosenLabel: '',
  recommendedLabel: '',
  basePriceLabel: '',
  finalPriceLabel: '',
  quotingLabel: '',
  coveragesHeading: '',
  benefitsHeading: '',
  noPlansMessage: '',
  choosePlanMessage: '',
  priceErrorMessage: '',
  retryLabel: '',
};

/** The final price request in flight: the chosen plan and the attempt that asked for it. */
interface QuoteParams {
  readonly planId: string;
  readonly attempt: number;
}

/**
 * The plan list step (REQ-008 to REQ-012): the country's published, active plans from Strapi. The
 * choice is stored at once and its final price is requested from the price-quote endpoint each
 * time a plan is chosen and each time the step is shown with a chosen plan; only the answer for
 * the latest choice counts. Continue advances once a final price is shown. The step never has
 * unconfirmed values, so it never asks before leaving (AC-057).
 */
@Component({
  selector: 'app-plan-list',
  imports: [Button, PlanCard, RouterLink, StatusMessage],
  template: `
    @if (plans().length === 0) {
      <app-status-message [message]="copy().noPlansMessage" />
      <div class="mt-8 flex">
        @if (context.previousStepLink(); as link) {
          <a appButton="link" [routerLink]="link">{{ context.copy().backLabel }}</a>
        }
      </div>
    } @else {
      <div
        role="group"
        [attr.aria-labelledby]="headingId"
        [attr.aria-describedby]="showChooseMessage() ? chooseMessageId : null"
      >
        <ul class="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4 p-0">
          @for (plan of plans(); track plan.id) {
            <li class="min-w-0">
              <app-plan-card
                [plan]="plan"
                [copy]="copy()"
                [chosen]="plan.id === chosenId()"
                [price]="plan.id === chosenId() ? price() : null"
                (choose)="choose(plan)"
                (retry)="retry()"
              />
            </li>
          }
        </ul>
      </div>
      @if (showChooseMessage()) {
        <p
          [id]="chooseMessageId"
          role="alert"
          class="mt-4 mb-0 flex items-start gap-1.5 font-semibold text-danger"
        >
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
          {{ copy().choosePlanMessage }}
        </p>
      }
      <div class="mt-8 flex flex-wrap-reverse items-center justify-between gap-3">
        @if (context.previousStepLink(); as link) {
          <a appButton="link" [routerLink]="link">{{ context.copy().backLabel }}</a>
        }
        <button
          type="button"
          appButton="cta"
          class="ml-auto w-full min-[480px]:w-auto"
          [attr.aria-disabled]="!canAdvance()"
          (click)="continue()"
        >
          {{ context.copy().continueLabel }}
        </button>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanList {
  readonly step = input.required<WizardStep>();

  protected readonly context = inject(STEP_CONTEXT);
  private readonly store = inject(WizardStateStore);
  private readonly priceQuote = inject(PRICE_QUOTE);
  private readonly clock = inject(CLOCK);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  protected readonly headingId = STEP_HEADING_ID;
  protected readonly chooseMessageId = CHOOSE_MESSAGE_ID;
  private advancing = false;

  private readonly content = computed<WizardContent | null>(() => this.context.content());
  private readonly code = computed(() => this.content()?.country.code ?? '');

  protected readonly copy = computed(() => this.content()?.country.planCopy ?? NO_PLAN_COPY);

  protected readonly plans = computed<readonly PlanView[]>(() => {
    const content = this.content();
    return content ? toPlanViews(content.plans, content.country) : [];
  });

  /** Document id of the chosen plan, stored in the country's wizard data (AC-048). */
  protected readonly chosenId = computed(() => this.store.data(this.code()).plan?.id ?? null);

  private readonly chosenPlan = computed(() =>
    this.plans().find((plan) => plan.id === this.chosenId()),
  );

  protected readonly showChooseMessage = signal(false);
  private readonly attempt = signal(0);

  /**
   * The chosen plan's final price. A new choice or a retry starts a new request and abandons the
   * previous one, so only the latest choice's answer is used (AC-049).
   */
  private readonly quote = resource({
    params: (): QuoteParams | undefined => {
      const planId = this.chosenId();
      return planId === null ? undefined : { planId, attempt: this.attempt() };
    },
    loader: ({ params, abortSignal }) => this.requestFinalPrice(params.planId, abortSignal),
  });

  protected readonly price = computed<PriceState>(() => {
    switch (this.quote.status()) {
      case 'error':
        return { kind: 'error' };
      case 'resolved': {
        const content = this.content();
        const amount = this.quote.value();
        return content && amount !== undefined
          ? { kind: 'ready', amount: formatAmount(amount, content.country) }
          : { kind: 'waiting' };
      }
      default:
        return { kind: 'waiting' };
    }
  });

  /** Continue looks enabled only with a chosen plan whose final price is shown (AC-051). */
  protected readonly canAdvance = computed(
    () => this.chosenPlan() !== undefined && this.price().kind === 'ready',
  );

  constructor() {
    this.context.trackUnconfirmed(() => false, inject(DestroyRef));
  }

  /** Chooses a plan; choosing the plan already chosen changes nothing (AC-048, AC-049). */
  protected choose(plan: PlanView): void {
    if (plan.id === this.chosenId()) {
      return;
    }
    this.showChooseMessage.set(false);
    this.store.choosePlan(this.code(), plan.id);
  }

  /** Requests the final price again and keeps focus on the price area (AC-047). */
  protected retry(): void {
    this.attempt.update((attempt) => attempt + 1);
    const chosen = this.chosenPlan();
    if (chosen) {
      this.focusAfterRender(planCardIds(chosen.key).price);
    }
  }

  /**
   * Advances exactly once when a plan is chosen and its final price is shown (AC-050, AC-052).
   * Otherwise it stays and moves focus to what the person must act on (AC-051).
   */
  protected continue(): void {
    if (this.advancing) {
      return;
    }
    const chosen = this.chosenPlan();
    if (!chosen) {
      this.showChooseMessage.set(true);
      const first = this.plans()[0];
      if (first) {
        this.focusAfterRender(planCardIds(first.key).choose);
      }
      return;
    }
    const ids = planCardIds(chosen.key);
    switch (this.price().kind) {
      case 'error':
        this.focusAfterRender(ids.retry);
        return;
      case 'waiting':
        this.focusAfterRender(ids.price);
        return;
      default:
        this.advancing = true;
        this.context.advance(this.step().slug);
    }
  }

  /**
   * Asks for the final price with the inputs derived from the current form data (AC-044, AC-045).
   * The stored final price is discarded while it is obtained, and the answer is stored only while
   * its plan is still chosen (AC-049, AC-053, AC-056).
   */
  private async requestFinalPrice(planId: string, signal: AbortSignal): Promise<number> {
    const content = this.content();
    if (!content) {
      throw new Error('The plan step needs the country content');
    }
    const code = content.country.code;
    this.store.discardFinalPrice(code);
    const inputs = pricingInputs(content.steps, this.store.data(code), this.clock());
    const price = await this.priceQuote.finalPrice(
      { country: code, plan: planId, ...inputs },
      signal,
    );
    if (!signal.aborted) {
      this.store.storeFinalPrice(code, planId, price);
    }
    return price;
  }

  private focusAfterRender(id: string): void {
    afterNextRender(() => this.document.getElementById(id)?.focus(), { injector: this.injector });
  }
}
