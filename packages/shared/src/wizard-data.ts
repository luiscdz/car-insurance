import { z } from 'zod';
import { nonBlankTextSchema } from './content/primitives.js';
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
 * Wizard data of one country kept in the tab's session storage: form values keyed by step slug
 * and the chosen plan. The plan is optional, so data stored before it existed still parses.
 */
export const wizardDataSchema = z.object({
  steps: z.record(z.string(), storedStepSchema),
  plan: storedPlanSchema.optional(),
});

export type FieldValue = z.output<typeof fieldValueSchema>;
export type StoredStep = z.output<typeof storedStepSchema>;
export type StoredPlan = z.output<typeof storedPlanSchema>;
export type WizardData = z.output<typeof wizardDataSchema>;
