import type { Core } from '@strapi/strapi';
import { paymentRequestSchema, priceQuoteRequestSchema } from '@car-insurance/shared';
import type { QuoteService } from '../services/quote';

/** The part of the Koa context the controller uses. */
export interface QuoteContext {
  readonly request: { readonly body?: unknown };
  status: number;
  body: unknown;
}

const BAD_REQUEST = 400;
const NOT_FOUND = 404;

/** Generic error answer: it never echoes what was received (AC-046, AC-079, AC-080). */
function error(ctx: QuoteContext, status: number, name: string, message: string): void {
  ctx.status = status;
  ctx.body = { data: null, error: { status, name, message } };
}

/**
 * Thin controller of the custom endpoints. The price quote (AC-045, AC-046) validates the body
 * with the shared request schema, asks the quote service and answers `{ data: { finalPrice } }`.
 * The simulated payment (AC-079, AC-080) answers `{ data: { status: 'approved', quoteNumber } }`
 * or `{ data: { status: 'rejected' } }`; a malformed body gets a generic 400 with no quote number
 * and no technical detail.
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

  async pay(ctx: QuoteContext): Promise<void> {
    const request = paymentRequestSchema.safeParse(ctx.request.body);
    if (!request.success) {
      error(ctx, BAD_REQUEST, 'ValidationError', 'Invalid payment request');
      return;
    }
    const service = strapi.service('api::quote.quote') as unknown as QuoteService;
    ctx.body = { data: await service.pay(request.data) };
  },
});

export default quoteController;
