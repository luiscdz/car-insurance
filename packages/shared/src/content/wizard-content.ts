import { z } from 'zod';
import { countryDetailSchema } from './country.js';
import { FIELD_KINDS, type FieldKind, PRICING_INPUTS } from './form-field.js';
import { sortByOrder } from './order.js';
import { plansSchema } from './plan.js';
import { termsSchema } from './terms.js';
import { type StepType, type WizardStep, wizardStepSchema } from './wizard-step.js';

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

function markCount(steps: readonly WizardStep[], mark: (typeof PRICING_INPUTS)[number]): number {
  return steps.flatMap((step) => step.fields).filter((field) => field.pricingInput === mark).length;
}

function kindCount(steps: readonly WizardStep[], kind: FieldKind): number {
  return steps.flatMap((step) => step.fields).filter((field) => field.kind === kind).length;
}

/**
 * Everything the wizard needs for one country, validated before use (P3): the country, its steps,
 * its published, active plans and its published terms (AC-077). Every plan is priced in the
 * country's currency (AC-041), each pricing mark is on at most one field of the country (AC-044)
 * and each field kind is on exactly one field of the country (AC-069).
 */
export const wizardContentSchema = z
  .object({
    country: countryDetailSchema,
    steps: wizardStepsSchema,
    plans: plansSchema,
    terms: termsSchema,
  })
  .superRefine((content, ctx) => {
    if (content.plans.some((plan) => plan.currency !== content.country.currency)) {
      ctx.addIssue({ code: 'custom', message: "Plans must use the country's currency" });
    }
    for (const mark of PRICING_INPUTS) {
      if (markCount(content.steps, mark) > 1) {
        ctx.addIssue({ code: 'custom', message: `The pricing mark ${mark} is on several fields` });
      }
    }
    for (const kind of FIELD_KINDS) {
      if (kindCount(content.steps, kind) !== 1) {
        ctx.addIssue({
          code: 'custom',
          message: `The field kind ${kind} must be on exactly one field`,
        });
      }
    }
  });

export type WizardContent = z.output<typeof wizardContentSchema>;
