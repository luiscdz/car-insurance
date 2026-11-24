import { z } from 'zod';
import { countryCodeSchema } from './content/country.js';
import { nonBlankTextSchema } from './content/primitives.js';

/** An age in whole years, as derived on the person's device (AC-044). */
const wholeYearsSchema = z.number().int();

/**
 * Body of a price-quote request (AC-045, AC-046): only the country code, the plan's identifier and
 * the two derived ages when available. Any other key is rejected, so no entered value can travel
 * with it.
 */
export const priceQuoteRequestSchema = z.strictObject({
  country: countryCodeSchema,
  plan: nonBlankTextSchema,
  policyholderAge: wholeYearsSchema.optional(),
  vehicleAge: wholeYearsSchema.optional(),
});

/** A final price: a whole amount of the country's currency greater than zero (AC-047). */
export const finalPriceSchema = z.number().int().positive();

/** Answer of the price-quote endpoint (AC-045). */
export const priceQuoteResponseSchema = z.object({
  data: z.object({ finalPrice: finalPriceSchema }),
});

export type PriceQuoteRequest = z.output<typeof priceQuoteRequestSchema>;
export type PriceQuoteResponse = z.output<typeof priceQuoteResponseSchema>;
