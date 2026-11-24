import type { Core } from '@strapi/strapi';
import type { PaymentRequest, PriceQuoteRequest } from '@car-insurance/shared';
import { finalPrice } from './price-rule';
import { quoteNumber } from './quote-number';

/** Outcome of a simulated payment (AC-080). */
export type PaymentOutcome =
  { readonly status: 'approved'; readonly quoteNumber: string } | { readonly status: 'rejected' };

/**
 * The quote service behind the custom endpoints: stateless, it reads published content and stores
 * and logs nothing (P5, AC-046, AC-079).
 */
export interface QuoteService {
  /**
   * Final price of a published, active plan of the country, computed from its base price as
   * published in Strapi (AC-045); `null` when no such plan exists.
   */
  price(request: PriceQuoteRequest): Promise<number | null>;
  /**
   * Simulated payment (AC-080): approved with a new quote number when the plan is a published,
   * active plan of the country at the time of the request, rejected otherwise. Nothing else
   * decides the outcome.
   */
  pay(request: PaymentRequest): Promise<PaymentOutcome>;
}

/** Returns the current date and time of the server. */
export type ServerClock = () => Date;

const quoteService = (
  { strapi }: { strapi: Core.Strapi },
  now: ServerClock = () => new Date(),
): QuoteService => {
  /** The one eligibility rule shared by both endpoints: published, active and of the country. */
  const findOfferedPlan = (country: string, plan: string) =>
    strapi.documents('api::plan.plan').findFirst({
      status: 'published',
      filters: { documentId: plan, active: true, country: { code: country } },
      fields: ['basePrice'],
    });

  return {
    async price({ country, plan, policyholderAge, vehicleAge }) {
      const found = await findOfferedPlan(country, plan);
      if (!found || typeof found.basePrice !== 'number') {
        return null;
      }
      return finalPrice(found.basePrice, policyholderAge, vehicleAge);
    },

    async pay({ country, plan }) {
      const found = await findOfferedPlan(country, plan);
      return found
        ? { status: 'approved', quoteNumber: quoteNumber(country, now()) }
        : { status: 'rejected' };
    },
  };
};

export default quoteService;
