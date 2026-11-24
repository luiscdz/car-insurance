import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type {
  StoredConfirmation,
  SummaryCopy,
  WizardContent,
  WizardStep,
} from '@car-insurance/shared';
import { BrnDialogService } from '@spartan-ng/brain/dialog';
import { PAYMENT } from '../../../../core/payment/payment';
import { WizardStateStore } from '../../../../core/wizard-state/wizard-state';
import { Button } from '../../../../shared/ui/button';
import { Checkbox } from '../../../../shared/ui/checkbox';
import { formatPrice } from '../../../../shared/utils/format-price';
import type { LeaveDialogCopy } from '../../shell/components/leave-dialog';
import { STEP_CONTEXT, STEP_HEADING_ID } from '../../shell/step-context';
import { ConfirmationPanel, type ConfirmationView } from './components/confirmation-panel';
import { type SectionAction, SummarySection } from './components/summary-section';
import {
  TERMS_DIALOG_INITIAL_FOCUS,
  TermsDialog,
  type TermsDialogContext,
} from './components/terms-dialog';
import { toSummarySections } from './models/summary-view';
import { toParagraphs } from './models/terms-paragraphs';

/** Copy used only while no content is available; the shell renders no step then. */
const NO_SUMMARY_COPY: SummaryCopy = {
  planHeading: '',
  finalPriceLabel: '',
  editLabel: '',
  changePlanLabel: '',
  yesLabel: '',
  noLabel: '',
  acceptTermsLabel: '',
  viewTermsLabel: '',
  termsTitle: '',
  termsCloseLabel: '',
  acceptTermsMessage: '',
  payLabel: '',
  processingLabel: '',
  processingLeaveTitle: '',
  processingLeaveMessage: '',
  processingLeaveStayLabel: '',
  processingLeaveConfirmLabel: '',
  paymentErrorMessage: '',
  confirmationTitle: '',
  confirmationMessage: '',
  quoteNumberLabel: '',
  planLabel: '',
  amountPaidLabel: '',
  newQuoteLabel: '',
};

/** Element ids the summary associates with its controls (AC-076, AC-081). */
const IDS = {
  accept: 'accept-terms',
  acceptMessage: 'accept-terms-message',
  pay: 'pay',
  paymentError: 'payment-error',
  viewTerms: 'view-terms',
  planHeading: 'summary-plan',
} as const;

/** The chosen plan as the summary shows and pays it (AC-070). */
interface ChosenPlan {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
  readonly price: string;
}

/**
 * The summary and payment step (REQ-014 to REQ-019). It shows the confirmed data of every form
 * step, the chosen plan with its stored final price, the terms to accept and the pay action. One
 * activation sends one payment request; while it is processed every action is locked and leaving
 * asks first (AC-078, AC-096). An approved payment is stored as the confirmation and shown in place
 * of the summary (AC-083, AC-085). The terms acceptance and an unanswered payment are kept only in
 * memory (AC-076, AC-089).
 */
@Component({
  selector: 'app-summary',
  imports: [Button, Checkbox, ConfirmationPanel, RouterLink, SummarySection],
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  template: `
    @if (confirmationView(); as confirmation) {
      <app-confirmation-panel
        [copy]="copy()"
        [confirmation]="confirmation"
        (newQuote)="startNewQuote()"
      />
    } @else {
      <div class="grid min-w-0 gap-4">
        @for (section of sections(); track section.slug) {
          <app-summary-section
            [headingId]="'summary-' + section.slug"
            [title]="section.title"
            [rows]="section.rows"
            [action]="section.action"
            [locked]="processing()"
          />
        }
        @if (plan(); as plan) {
          <app-summary-section
            [headingId]="ids.planHeading"
            [title]="copy().planHeading"
            [action]="changePlanAction()"
            [locked]="processing()"
            [highlighted]="true"
          >
            <p class="mt-0 mb-3 text-[22px] font-bold text-primary-strong [overflow-wrap:anywhere]">
              {{ plan.name }}
            </p>
            <p class="m-0 flex flex-col">
              <span class="text-sm font-semibold text-foreground">{{
                copy().finalPriceLabel
              }}</span>
              <span class="text-3xl font-bold text-primary-strong tabular-nums">{{
                plan.price
              }}</span>
            </p>
          </app-summary-section>
        }
        <div class="grid gap-4 rounded-lg bg-surface-cta px-4 py-5 md:p-6">
          <div>
            <label
              class="flex min-h-6 cursor-pointer items-start gap-2.5 has-disabled:cursor-not-allowed"
              [for]="ids.accept"
            >
              <input
                type="checkbox"
                appCheckbox
                class="disabled:cursor-not-allowed"
                [id]="ids.accept"
                [checked]="accepted()"
                [disabled]="processing()"
                [attr.aria-invalid]="showAcceptMessage() ? 'true' : 'false'"
                [attr.aria-describedby]="showAcceptMessage() ? ids.acceptMessage : null"
                (change)="toggleAccepted($event)"
              />
              <span
                class="text-base font-semibold text-foreground"
                [class.text-disabled]="processing()"
                >{{ copy().acceptTermsLabel }}</span
              >
            </label>
            @if (showAcceptMessage()) {
              <p
                [id]="ids.acceptMessage"
                role="alert"
                class="mt-2 mb-0 flex items-start gap-1.5 font-semibold text-danger"
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 24 24"
                  class="mt-0.5 size-5 flex-none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  />
                  <path d="M12 7v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  <circle cx="12" cy="17" r="1.3" fill="currentColor" />
                </svg>
                {{ copy().acceptTermsMessage }}
              </p>
            }
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              appButton="cta"
              class="w-full gap-2.5 aria-busy:cursor-progress min-[480px]:w-auto min-[480px]:min-w-50"
              [id]="ids.pay"
              [attr.aria-disabled]="!accepted() || processing()"
              [attr.aria-busy]="processing() ? 'true' : null"
              [attr.aria-describedby]="paymentFailed() ? ids.paymentError : null"
              (click)="pay()"
            >
              @if (processing()) {
                <span
                  aria-hidden="true"
                  class="block size-5 flex-none rounded-full border-3 border-surface-info border-t-primary-strong motion-safe:animate-spin"
                ></span>
                {{ copy().processingLabel }}
              } @else {
                {{ copy().payLabel }}
              }
            </button>
          </div>
          @if (paymentFailed()) {
            <p
              [id]="ids.paymentError"
              role="alert"
              class="m-0 flex items-start gap-1.5 font-semibold text-danger"
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
              {{ copy().paymentErrorMessage }}
            </p>
          }
          <button
            type="button"
            appButton="link"
            class="min-h-10! justify-self-start py-2! text-primary-strong! aria-disabled:cursor-not-allowed aria-disabled:text-disabled! aria-disabled:decoration-border"
            [id]="ids.viewTerms"
            [attr.aria-disabled]="processing() ? 'true' : null"
            (click)="openTerms()"
          >
            {{ copy().viewTermsLabel }}
          </button>
        </div>
      </div>
      <div class="mt-8 flex">
        @if (context.previousStepLink(); as link) {
          <a
            appButton="link"
            class="aria-disabled:cursor-not-allowed aria-disabled:text-disabled aria-disabled:decoration-border"
            [routerLink]="processing() ? null : link"
            [attr.role]="processing() ? 'link' : null"
            [attr.aria-disabled]="processing() ? 'true' : null"
            >{{ context.copy().backLabel }}</a
          >
        }
      </div>
    }
    <p role="status" class="sr-only">{{ announcement() }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Summary {
  readonly step = input.required<WizardStep>();

  protected readonly context = inject(STEP_CONTEXT);
  private readonly store = inject(WizardStateStore);
  private readonly payment = inject(PAYMENT);
  private readonly dialogs = inject(BrnDialogService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  protected readonly ids = IDS;

  private readonly content = computed<WizardContent | null>(() => this.context.content());
  private readonly code = computed(() => this.content()?.country.code ?? '');
  private readonly data = computed(() => this.store.data(this.code()));

  protected readonly copy = computed<SummaryCopy>(
    () => this.content()?.country.summaryCopy ?? NO_SUMMARY_COPY,
  );

  /** One section per form step, each with its edit action to that step (AC-067, AC-071). */
  protected readonly sections = computed(() => {
    const content = this.content();
    if (!content) {
      return [];
    }
    const copy = this.copy();
    return toSummarySections(content, this.data(), copy).map((section) => ({
      ...section,
      action: {
        label: copy.editLabel,
        name: `${copy.editLabel} ${section.title}`,
        link: ['/', content.country.code, section.slug],
      } satisfies SectionAction,
    }));
  });

  /** The chosen plan and the final price stored with it on the plan step (AC-070). */
  protected readonly plan = computed<ChosenPlan | null>(() => {
    const content = this.content();
    const stored = this.data().plan;
    const plan = content?.plans.find((candidate) => candidate.documentId === stored?.id);
    if (!content || !plan || stored?.finalPrice == null) {
      return null;
    }
    const { currency, formatLocale } = content.country;
    return {
      id: plan.documentId,
      name: plan.name,
      amount: stored.finalPrice,
      price: formatPrice(stored.finalPrice, currency, formatLocale),
    };
  });

  private readonly confirmation = computed<StoredConfirmation | null>(
    () => this.data().confirmation ?? null,
  );

  protected readonly confirmationView = computed<ConfirmationView | null>(() => {
    const confirmation = this.confirmation();
    const content = this.content();
    if (!confirmation || !content) {
      return null;
    }
    const { currency, formatLocale } = content.country;
    return {
      quoteNumber: confirmation.quoteNumber,
      planName: confirmation.planName,
      amount: formatPrice(confirmation.amount, currency, formatLocale),
    };
  });

  private readonly planStepSlug = computed(
    () => this.content()?.steps.find((step) => step.type === 'plans')?.slug ?? null,
  );

  protected readonly changePlanAction = computed<SectionAction | null>(() => {
    const slug = this.planStepSlug();
    const label = this.copy().changePlanLabel;
    return slug ? { label, name: label, link: ['/', this.code(), slug] } : null;
  });

  /** Accepted in memory only: unchecked every time the step is shown (AC-076, AC-089). */
  protected readonly accepted = signal(false);
  private readonly askedToAccept = signal(false);
  protected readonly showAcceptMessage = computed(() => this.askedToAccept() && !this.accepted());
  protected readonly processing = signal(false);
  protected readonly paymentFailed = signal(false);
  private readonly confirmationAnnounced = signal(false);

  /** One polite status region: processing, then the confirmation (AC-078, AC-083, AC-090). */
  protected readonly announcement = computed(() => {
    const copy = this.copy();
    if (this.processing()) {
      return copy.processingLabel;
    }
    return this.confirmationAnnounced()
      ? `${copy.confirmationTitle}. ${copy.confirmationMessage}`
      : '';
  });

  /** Single flight: set before the request leaves, so no second activation sends another. */
  private inFlight = false;
  /** Aborts the pending payment when the step is left: its answer is then ignored (AC-096). */
  private readonly abort = new AbortController();

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.context.trackUnconfirmed(() => false, destroyRef);
    this.context.trackProcessing(
      () => (this.processing() ? this.processingCopy() : null),
      destroyRef,
    );
    destroyRef.onDestroy(() => {
      this.abort.abort();
      this.context.setHeading(null);
    });

    // The confirmation's title is the page heading (AC-083).
    effect(() => {
      const title = this.confirmation() ? this.copy().confirmationTitle : null;
      untracked(() => this.context.setHeading(title));
    });
  }

  protected toggleAccepted(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.accepted.set(checked);
    if (checked) {
      this.askedToAccept.set(false);
    }
  }

  /**
   * Pays the chosen plan (AC-078 to AC-081). Without the terms accepted nothing is sent and the
   * person is asked to accept them (AC-076). Only the country and the plan leave the browser.
   */
  protected async pay(): Promise<void> {
    if (this.inFlight) {
      return;
    }
    if (!this.accepted()) {
      this.askedToAccept.set(true);
      this.focusAfterRender(IDS.accept);
      return;
    }
    const plan = this.plan();
    const code = this.code();
    if (!plan) {
      return;
    }
    this.inFlight = true;
    this.paymentFailed.set(false);
    this.processing.set(true);
    const signal = this.abort.signal;
    try {
      const outcome = await this.payment.pay({ country: code, plan: plan.id }, signal);
      if (signal.aborted) {
        return;
      }
      if (outcome.kind === 'approved') {
        this.store.storeConfirmation(code, {
          planId: plan.id,
          planName: plan.name,
          amount: plan.amount,
          quoteNumber: outcome.quoteNumber,
        });
        this.showConfirmation();
      } else {
        this.paymentFailed.set(true);
      }
    } catch {
      if (!signal.aborted) {
        this.paymentFailed.set(true);
      }
    } finally {
      if (!signal.aborted) {
        this.inFlight = false;
        this.processing.set(false);
      }
    }
  }

  /** Opens the country's terms; acceptance is not required to open them (AC-074, AC-075). */
  protected openTerms(): void {
    const content = this.content();
    if (!content || this.processing()) {
      return;
    }
    const copy = this.copy();
    this.dialogs.open<Omit<TermsDialogContext, 'close'>, undefined>(
      TermsDialog,
      undefined,
      {
        title: copy.termsTitle,
        closeLabel: copy.termsCloseLabel,
        paragraphs: toParagraphs(content.terms.text),
      },
      {
        role: 'dialog',
        autoFocus: TERMS_DIALOG_INITIAL_FOCUS,
        restoreFocus: true,
        backdropClass: 'bg-foreground/55',
      },
    );
  }

  /** Discards the country's data and opens its first step, without asking (AC-087). */
  protected startNewQuote(): void {
    const content = this.content();
    const first = content?.steps[0];
    if (!content || !first) {
      return;
    }
    this.store.startNewQuote(content.country.code);
    void this.router.navigate(['/', content.country.code, first.slug]);
  }

  /** The browser's own confirmation only while a payment is processed (AC-089, AC-096). */
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.processing()) {
      event.preventDefault();
    }
  }

  private processingCopy(): LeaveDialogCopy {
    const copy = this.copy();
    return {
      title: copy.processingLeaveTitle,
      message: copy.processingLeaveMessage,
      stayLabel: copy.processingLeaveStayLabel,
      leaveLabel: copy.processingLeaveConfirmLabel,
    };
  }

  /**
   * Announces the confirmation and moves focus to its title, unless a dialog is open: then focus
   * stays in the dialog until the person answers it (AC-083, AC-096).
   */
  private showConfirmation(): void {
    this.confirmationAnnounced.set(true);
    afterNextRender(
      () => {
        if (!this.document.querySelector('[aria-modal="true"]')) {
          this.document.getElementById(STEP_HEADING_ID)?.focus();
        }
      },
      { injector: this.injector },
    );
  }

  private focusAfterRender(id: string): void {
    afterNextRender(() => this.document.getElementById(id)?.focus(), { injector: this.injector });
  }
}
