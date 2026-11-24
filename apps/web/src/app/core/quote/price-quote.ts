import { InjectionToken } from '@angular/core';
import type { PriceQuoteRequest } from '@car-insurance/shared';

/**
 * Obtains the final price of a plan from the price-quote endpoint (AC-045). Rejects when the price
 * cannot be obtained (AC-047) and stops when the signal aborts (AC-049).
 */
export interface PriceQuote {
  finalPrice(request: PriceQuoteRequest, signal?: AbortSignal): Promise<number>;
}

export const PRICE_QUOTE = new InjectionToken<PriceQuote>('PRICE_QUOTE');
