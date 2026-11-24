import {
  collectionResponseSchema,
  type CountrySummary,
  countrySummarySchema,
  type WizardContent,
  wizardContentSchema,
} from '@car-insurance/shared';
import { z } from 'zod';

export type WizardContentResult =
  | { readonly kind: 'ready'; readonly content: WizardContent }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'invalid' };

export type CountryListResult =
  | { readonly kind: 'ready'; readonly countries: readonly CountrySummary[] }
  | { readonly kind: 'invalid' };

const anyCollectionSchema = collectionResponseSchema(z.unknown());

function hasCode(entry: unknown, code: string): boolean {
  return typeof entry === 'object' && entry !== null && 'code' in entry && entry.code === code;
}

/**
 * Builds one country's wizard from the raw Strapi responses. The country must match the address
 * code exactly (AC-002) and the whole content, plans included, must pass the shared schemas
 * (AC-017, AC-041, AC-059); steps, fields and plans come back sorted by configured order (AC-004,
 * AC-036).
 */
export function toWizardContent(
  code: string,
  countryResponse: unknown,
  stepsResponse: unknown,
  plansResponse: unknown,
): WizardContentResult {
  const countries = anyCollectionSchema.safeParse(countryResponse);
  const steps = anyCollectionSchema.safeParse(stepsResponse);
  const plans = anyCollectionSchema.safeParse(plansResponse);
  if (!countries.success || !steps.success || !plans.success) {
    return { kind: 'invalid' };
  }
  const country = countries.data.data.find((entry) => hasCode(entry, code));
  if (country === undefined) {
    return { kind: 'not-found' };
  }
  const content = wizardContentSchema.safeParse({
    country,
    steps: steps.data.data,
    plans: plans.data.data,
  });
  return content.success ? { kind: 'ready', content: content.data } : { kind: 'invalid' };
}

/** Validates the list of published countries shown at the root address (AC-001, AC-017). */
export function toCountryList(response: unknown): CountryListResult {
  const parsed = collectionResponseSchema(countrySummarySchema).safeParse(response);
  return parsed.success ? { kind: 'ready', countries: parsed.data.data } : { kind: 'invalid' };
}
