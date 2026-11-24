import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  type PaymentRequest,
  paymentRequestSchema,
  paymentResponseSchema,
} from '@car-insurance/shared';
import { firstValueFrom, fromEvent, takeUntil } from 'rxjs';
import { AppConfig } from '../config/app-config';
import type { Payment, PaymentOutcome } from './payment';

/** Path of the stateless simulated payment endpoint (docs/architecture.md). */
const PAYMENT_PATH = '/api/quote/pay';

/**
 * Asks Strapi's simulated payment endpoint through the public role, without any token (AC-082).
 * The body is built from the strict shared schema, so it carries only the country and the plan
 * (AC-079). The answer is validated before use: an approval without a well-formed quote number,
 * an HTTP error or a network failure rejects (AC-081).
 */
@Injectable()
export class StrapiPayment implements Payment {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfig);

  async pay(request: PaymentRequest, signal?: AbortSignal): Promise<PaymentOutcome> {
    const body = paymentRequestSchema.parse(request);
    const base = await this.config.cmsUrl();
    const answer = this.http.post<unknown>(`${base}${PAYMENT_PATH}`, body, { cache: 'no-store' });
    const raw = await firstValueFrom(
      signal ? answer.pipe(takeUntil(fromEvent(signal, 'abort'))) : answer,
    );
    const { data } = paymentResponseSchema.parse(raw);
    return data.status === 'approved'
      ? { kind: 'approved', quoteNumber: data.quoteNumber }
      : { kind: 'rejected' };
  }
}
