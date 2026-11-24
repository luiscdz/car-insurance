import type { Core } from '@strapi/strapi';
import type { PriceQuoteRequest } from '@car-insurance/shared';
import { finalPrice } from './price-rule';

/** The price-quote service: stateless, it reads published content and stores nothing (P5). */
export interface QuoteService {
  /**
   * Final price of a published, active plan of the country, computed from its base price as
   * published in Strapi (AC-045); `null` when no such plan exists.
   */
  price(request: PriceQuoteRequest): Promise<number | null>;
}

const quoteService = ({ strapi }: { strapi: Core.Strapi }): QuoteService => ({
  async price({ country, plan, policyholderAge, vehicleAge }) {
    const found = await strapi.documents('api::plan.plan').findFirst({
      status: 'published',
      filters: { documentId: plan, active: true, country: { code: country } },
      fields: ['basePrice'],
    });
    if (!found || typeof found.basePrice !== 'number') {
      return null;
    }
    return finalPrice(found.basePrice, policyholderAge, vehicleAge);
  },
});

export default quoteService;
