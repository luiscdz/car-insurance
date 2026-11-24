import { InjectionToken } from '@angular/core';
import type { PaymentRequest } from '@car-insurance/shared';

/** Outcome of a simulated payment as the summary uses it (AC-081, AC-083). */
export type PaymentOutcome =
  { readonly kind: 'approved'; readonly quoteNumber: string } | { readonly kind: 'rejected' };

/**
 * Pays the chosen plan through the simulated payment endpoint (AC-078). Rejects when the payment
 * cannot be completed or its answer is not valid (AC-081) and stops when the signal aborts
 * (AC-096).
 */
export interface Payment {
  pay(request: PaymentRequest, signal?: AbortSignal): Promise<PaymentOutcome>;
}

export const PAYMENT = new InjectionToken<Payment>('PAYMENT');
