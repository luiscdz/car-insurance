import { z } from 'zod';
import { formFieldSchema } from './form-field.js';
import { sortByOrder } from './order.js';
import { createdAtSchema, keySchema, nonBlankTextSchema, orderSchema } from './primitives.js';

/** Step types implemented in code (ADR-001): form step, plan list, summary and payment. */
export const STEP_TYPES = ['form', 'plans', 'summary'] as const;

export const stepTypeSchema = z.enum(STEP_TYPES);

/** A wizard step of a country with its fields sorted by configured order. */
export const wizardStepSchema = z
  .object({
    slug: keySchema,
    title: nonBlankTextSchema,
    type: stepTypeSchema,
    order: orderSchema,
    fields: z.array(formFieldSchema).nullish(),
    createdAt: createdAtSchema,
  })
  .superRefine((step, ctx) => {
    const names = (step.fields ?? []).map((field) => field.name);
    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: 'custom', message: 'Field names must be unique within a step' });
    }
  })
  .transform((step) => ({ ...step, fields: sortByOrder(step.fields ?? []) }));

export type StepType = z.output<typeof stepTypeSchema>;
export type WizardStep = z.output<typeof wizardStepSchema>;
export type WizardStepInput = z.input<typeof wizardStepSchema>;
