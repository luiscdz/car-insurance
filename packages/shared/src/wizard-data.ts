import { z } from 'zod';
import { nonBlankTextSchema } from './content/primitives.js';
import { quoteNumberSchema } from './payment.js';
import { finalPriceSchema } from './quote.js';

/** A value entered in a field: text for every type except checkbox, which is a boolean. */
export const fieldValueSchema = z.union([z.string(), z.boolean()]);

/** The values confirmed for one step and whether the step was completed with valid data. */
export const storedStepSchema = z.object({
  values: z.record(z.string(), fieldValueSchema),
  complete: z.boolean(),
});

/**
 * The chosen plan, by its Strapi document id, and the final price obtained for it with the current
 * form data, or `null` while there is none (AC-048, AC-054).
 */
export const storedPlanSchema = z.object({
  id: nonBlankTextSchema,
  finalPrice: finalPriceSchema.nullable(),
});

/**
 * The confirmation of an approved payment (AC-085): the paid plan, its name, the amount paid and
 * the simulated quote number. It holds no value entered in a form step (AC-083).
 */
export const storedConfirmationSchema = z.object({
  planId: nonBlankTextSchema,
  planName: nonBlankTextSchema,
  amount: finalPriceSchema,
  quoteNumber: quoteNumberSchema,
});

/**
 * Wizard data of one country kept in the tab's session storage: form values keyed by step slug,
 * the chosen plan and the confirmation of its payment. The plan and the confirmation are optional,
 * so data stored before they existed still parses.
 */
export const wizardDataSchema = z.object({
  steps: z.record(z.string(), storedStepSchema),
  plan: storedPlanSchema.optional(),
  confirmation: storedConfirmationSchema.optional(),
});

export type FieldValue = z.output<typeof fieldValueSchema>;
export type StoredStep = z.output<typeof storedStepSchema>;
export type StoredPlan = z.output<typeof storedPlanSchema>;
export type StoredConfirmation = z.output<typeof storedConfirmationSchema>;
export type WizardData = z.output<typeof wizardDataSchema>;
