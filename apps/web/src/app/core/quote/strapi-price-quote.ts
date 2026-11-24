import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  type PriceQuoteRequest,
  priceQuoteRequestSchema,
  priceQuoteResponseSchema,
} from '@car-insurance/shared';
import { firstValueFrom, fromEvent, takeUntil } from 'rxjs';
import { AppConfig } from '../config/app-config';
import type { PriceQuote } from './price-quote';

/** Path of the stateless price-quote endpoint (docs/architecture.md). */
const PRICE_QUOTE_PATH = '/api/quote/price';

/**
 * Asks Strapi's price-quote endpoint through the public role, without any token (AC-097). The body
 * is built from the strict shared schema, so it carries only the country, the plan and the derived
 * ages (AC-046); the answer is validated before use (AC-047).
 */
@Injectable()
export class StrapiPriceQuote implements PriceQuote {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfig);

  async finalPrice(request: PriceQuoteRequest, signal?: AbortSignal): Promise<number> {
    const body = priceQuoteRequestSchema.parse(request);
    const base = await this.config.cmsUrl();
    const answer = this.http.post<unknown>(`${base}${PRICE_QUOTE_PATH}`, body, {
      cache: 'no-store',
    });
    const raw = await firstValueFrom(
      signal ? answer.pipe(takeUntil(fromEvent(signal, 'abort'))) : answer,
    );
    return priceQuoteResponseSchema.parse(raw).data.finalPrice;
  }
}
