import { z } from 'zod';

/** A value entered in a field: text for every type except checkbox, which is a boolean. */
export const fieldValueSchema = z.union([z.string(), z.boolean()]);

/** The values confirmed for one step and whether the step was completed with valid data. */
export const storedStepSchema = z.object({
  values: z.record(z.string(), fieldValueSchema),
  complete: z.boolean(),
});

/** Wizard data of one country kept in the tab's session storage, keyed by step slug. */
export const wizardDataSchema = z.object({
  steps: z.record(z.string(), storedStepSchema),
});

export type FieldValue = z.output<typeof fieldValueSchema>;
export type StoredStep = z.output<typeof storedStepSchema>;
export type WizardData = z.output<typeof wizardDataSchema>;
