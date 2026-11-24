import { z } from 'zod';
import { countryDetailSchema } from './country.js';
import { sortByOrder } from './order.js';
import { type StepType, wizardStepSchema } from './wizard-step.js';

/** Step types that must follow the form steps, in this order (ADR-001). */
const STEPS_AFTER_FORMS: readonly StepType[] = ['plans', 'summary'];

function followsSequence(types: readonly StepType[]): boolean {
  const formSteps = types.findIndex((type) => type !== 'form');
  if (formSteps < 1) {
    return false;
  }
  const rest = types.slice(formSteps);
  return (
    rest.length === STEPS_AFTER_FORMS.length &&
    rest.every((type, index) => type === STEPS_AFTER_FORMS[index])
  );
}

/**
 * The steps of one country's wizard, sorted by configured order. The sequence must be at least
 * one form step, then exactly one plan list, then exactly one summary and payment step (ADR-001),
 * and step slugs are unique within the country.
 */
export const wizardStepsSchema = z
  .array(wizardStepSchema)
  .transform((steps) => sortByOrder(steps))
  .superRefine((steps, ctx) => {
    if (!followsSequence(steps.map((step) => step.type))) {
      ctx.addIssue({ code: 'custom', message: 'Steps must be form+, plans, summary' });
    }
    const slugs = steps.map((step) => step.slug);
    if (new Set(slugs).size !== slugs.length) {
      ctx.addIssue({ code: 'custom', message: 'Step slugs must be unique within a country' });
    }
  });

/** Everything the wizard needs for one country, validated before use (P3). */
export const wizardContentSchema = z.object({
  country: countryDetailSchema,
  steps: wizardStepsSchema,
});

export type WizardContent = z.output<typeof wizardContentSchema>;
