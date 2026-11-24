import { z } from 'zod';
import { countryCodeSchema } from './content/country.js';
import { nonBlankTextSchema } from './content/primitives.js';

/**
 * Body of a simulated payment request (AC-079): only the country code and the chosen plan's
 * identifier. Any other key is rejected, so no entered value can travel with it.
 */
export const paymentRequestSchema = z.strictObject({
  country: countryCodeSchema,
  plan: nonBlankTextSchema,
});

/**
 * A simulated quote number (AC-084): the country code in upper case, the UTC date as YYYYMMDD and
 * six upper-case letters or digits, joined by hyphens.
 */
export const QUOTE_NUMBER_PATTERN = /^[A-Z]{2}-[0-9]{8}-[A-Z0-9]{6}$/;

export const quoteNumberSchema = z.string().regex(QUOTE_NUMBER_PATTERN);

/** Answer of the payment endpoint (AC-080): approved with a quote number, or rejected. */
export const paymentResponseSchema = z.object({
  data: z.discriminatedUnion('status', [
    z.object({ status: z.literal('approved'), quoteNumber: quoteNumberSchema }),
    z.object({ status: z.literal('rejected') }),
  ]),
});

export type PaymentRequest = z.output<typeof paymentRequestSchema>;
export type PaymentResponse = z.output<typeof paymentResponseSchema>;
