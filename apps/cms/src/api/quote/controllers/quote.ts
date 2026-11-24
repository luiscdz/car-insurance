import type { Core } from '@strapi/strapi';
import { priceQuoteRequestSchema } from '@car-insurance/shared';
import type { QuoteService } from '../services/quote';

/** The part of the Koa context the controller uses. */
export interface QuoteContext {
  readonly request: { readonly body?: unknown };
  status: number;
  body: unknown;
}

const BAD_REQUEST = 400;
const NOT_FOUND = 404;

/** Generic error answer: it never echoes what was received (AC-046). */
function error(ctx: QuoteContext, status: number, name: string, message: string): void {
  ctx.status = status;
  ctx.body = { data: null, error: { status, name, message } };
}

/**
 * Thin controller of the price-quote endpoint (AC-045, AC-046): validates the body with the shared
 * request schema, asks the quote service and answers `{ data: { finalPrice } }`.
 */
const quoteController = ({ strapi }: { strapi: Core.Strapi }) => ({
  async price(ctx: QuoteContext): Promise<void> {
    const request = priceQuoteRequestSchema.safeParse(ctx.request.body);
    if (!request.success) {
      error(ctx, BAD_REQUEST, 'ValidationError', 'Invalid price quote request');
      return;
    }
    const service = strapi.service('api::quote.quote') as unknown as QuoteService;
    const price = await service.price(request.data);
    if (price === null) {
      error(ctx, NOT_FOUND, 'NotFoundError', 'Plan not available');
      return;
    }
    ctx.body = { data: { finalPrice: price } };
  },
});

export default quoteController;
