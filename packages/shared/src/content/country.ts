import { z } from 'zod';
import { currencyCodeSchema, nonBlankTextSchema } from './primitives.js';

/** Country code used as the first route segment (ADR-001): two lower-case letters. */
export const countryCodeSchema = z.string().regex(/^[a-z]{2}$/);

/** A country as listed at the root address (AC-001). */
export const countrySummarySchema = z.object({
  code: countryCodeSchema,
  name: nonBlankTextSchema,
});

/**
 * The wizard's own copy for a country. Every label is required, so missing copy, including the
 * leave dialog's, makes the content invalid (AC-008, AC-017, AC-034).
 */
export const wizardCopySchema = z.object({
  continueLabel: nonBlankTextSchema,
  backLabel: nonBlankTextSchema,
  progressLabel: nonBlankTextSchema,
  leaveTitle: nonBlankTextSchema,
  leaveMessage: nonBlankTextSchema,
  leaveStayLabel: nonBlankTextSchema,
  leaveConfirmLabel: nonBlankTextSchema,
});

/**
 * The plan list copy of a country (AC-040). Every text is required, so missing or blank plan list
 * copy makes the content invalid (AC-017).
 */
export const planCopySchema = z.object({
  chooseLabel: nonBlankTextSchema,
  chosenLabel: nonBlankTextSchema,
  recommendedLabel: nonBlankTextSchema,
  basePriceLabel: nonBlankTextSchema,
  finalPriceLabel: nonBlankTextSchema,
  quotingLabel: nonBlankTextSchema,
  coveragesHeading: nonBlankTextSchema,
  benefitsHeading: nonBlankTextSchema,
  noPlansMessage: nonBlankTextSchema,
  choosePlanMessage: nonBlankTextSchema,
  priceErrorMessage: nonBlankTextSchema,
  retryLabel: nonBlankTextSchema,
});

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

/**
 * A country theme (docs/design.md). It is validated on its own: a missing or malformed theme
 * falls back to the default theme and never makes the content invalid (AC-003).
 */
export const themeSchema = z.object({
  primaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  logo: z
    .object({
      url: z.string().min(1),
      alternativeText: z.string().nullish(),
    })
    .nullish(),
});

function isLocale(value: string): boolean {
  try {
    return Intl.getCanonicalLocales(value).length === 1;
  } catch {
    return false;
  }
}

/** A country with the data its wizard needs; the theme is kept raw and validated separately. */
export const countryDetailSchema = countrySummarySchema.extend({
  currency: currencyCodeSchema,
  formatLocale: z.string().refine(isLocale, 'Unknown locale'),
  copy: wizardCopySchema,
  planCopy: planCopySchema,
  theme: z.unknown(),
});

export type CountrySummary = z.output<typeof countrySummarySchema>;
export type WizardCopy = z.output<typeof wizardCopySchema>;
export type PlanCopy = z.output<typeof planCopySchema>;
export type Theme = z.output<typeof themeSchema>;
export type CountryDetail = z.output<typeof countryDetailSchema>;
export type CountryDetailInput = z.input<typeof countryDetailSchema>;
