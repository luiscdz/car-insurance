import type { CountryDetail, Plan, PlanCoverage } from '@car-insurance/shared';
import { formatPrice } from '../../../../../shared/utils/format-price';

/** A plan ready to display, with its prices formatted for the country (AC-037, AC-042). */
export interface PlanView {
  /** Prefix of the element ids of the plan's card, unique on the page. */
  readonly key: string;
  /** Strapi document id of the plan, stored as the chosen plan and sent for its price. */
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly basePrice: string;
  /** Whether this plan is the one distinguished as recommended (AC-038). */
  readonly recommended: boolean;
  readonly coverages: readonly PlanCoverage[];
  readonly benefits: readonly string[];
}

/** What the chosen plan shows in place of its final price (AC-045, AC-047). */
export type PriceState =
  | { readonly kind: 'waiting' }
  | { readonly kind: 'ready'; readonly amount: string }
  | { readonly kind: 'error' };

/** The country's currency and locale, from its content (AC-042). */
export type PriceFormat = Pick<CountryDetail, 'currency' | 'formatLocale'>;

export function formatAmount(amount: number, format: PriceFormat): string {
  return formatPrice(amount, format.currency, format.formatLocale);
}

/**
 * Plans in display order with formatted base prices. Only the first plan marked as recommended is
 * distinguished; being recommended changes neither the order nor the choice (AC-038).
 */
export function toPlanViews(plans: readonly Plan[], format: PriceFormat): PlanView[] {
  const recommended = plans.find((plan) => plan.recommended)?.documentId;
  return plans.map((plan, index) => ({
    key: `plan-${index}`,
    id: plan.documentId,
    name: plan.name,
    description: plan.description,
    basePrice: formatAmount(plan.basePrice, format),
    recommended: plan.documentId === recommended,
    coverages: plan.coverages,
    benefits: plan.benefits.map((benefit) => benefit.text),
  }));
}
