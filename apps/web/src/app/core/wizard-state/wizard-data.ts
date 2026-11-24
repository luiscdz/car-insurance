import type {
  FieldValue,
  FormFieldContent,
  StoredPlan,
  WizardContent,
  WizardData,
  WizardStep,
} from '@car-insurance/shared';
import { isFieldValueValid } from '../../shared/utils/field-validation/validate-field';

/** Wizard data with no stored step. */
export const EMPTY_WIZARD_DATA: WizardData = { steps: {} };

type Values = Readonly<Record<string, FieldValue>>;

function hasExpectedType(field: FormFieldContent, value: FieldValue): boolean {
  return field.type === 'checkbox' ? typeof value === 'boolean' : typeof value === 'string';
}

function currentValues(
  fields: readonly FormFieldContent[],
  stored: Values,
): Record<string, FieldValue> {
  const values: Record<string, FieldValue> = {};
  for (const field of fields) {
    const value = stored[field.name];
    if (value !== undefined && hasExpectedType(field, value)) {
      values[field.name] = value;
    }
  }
  return values;
}

/** Whether every field of a form step is valid with the given values. */
export function areStepValuesValid(
  fields: readonly FormFieldContent[],
  values: Values,
  today: Date,
): boolean {
  return (
    fields.length > 0 &&
    fields.every((field) => isFieldValueValid(field, values[field.name], today))
  );
}

/** Whether two sets of stored values hold the same fields with the same values. */
export function sameValues(a: Values, b: Values): boolean {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

/** Data with a plan, or without any when `plan` is undefined. */
function withPlan(data: WizardData, plan: StoredPlan | undefined): WizardData {
  return plan === undefined ? { steps: data.steps } : { steps: data.steps, plan };
}

/** Data whose chosen plan is `id`, with no final price yet (AC-048). */
export function withChosenPlan(data: WizardData, id: string): WizardData {
  return withPlan(data, { id, finalPrice: null });
}

/** Data with the final price of the chosen plan, when `id` is still the chosen plan (AC-049). */
export function withFinalPrice(data: WizardData, id: string, finalPrice: number): WizardData {
  return data.plan?.id === id ? withPlan(data, { id, finalPrice }) : data;
}

/** Data that keeps the chosen plan but no longer its final price (AC-054). */
export function withoutFinalPrice(data: WizardData): WizardData {
  return data.plan ? withPlan(data, { id: data.plan.id, finalPrice: null }) : data;
}

/**
 * Reconciles stored data with the current configuration (AC-025): values of fields and steps that
 * are no longer published are discarded, and a step stays complete only while its stored values
 * still satisfy the current configuration. A chosen plan is kept only while it is still offered
 * (AC-055), and its final price only while the form values it was obtained with are unchanged.
 */
export function reconcile(stored: WizardData, content: WizardContent, today: Date): WizardData {
  const steps: WizardData['steps'] = {};
  let valuesChanged = false;
  for (const step of content.steps) {
    const storedStep = stored.steps[step.slug];
    if (step.type !== 'form' || storedStep === undefined) {
      continue;
    }
    const values = currentValues(step.fields, storedStep.values);
    valuesChanged ||= !sameValues(values, storedStep.values);
    steps[step.slug] = {
      values,
      complete: storedStep.complete && areStepValuesValid(step.fields, values, today),
    };
  }
  valuesChanged ||= Object.keys(stored.steps).some((slug) => steps[slug] === undefined);
  const offered = content.plans.some((plan) => plan.documentId === stored.plan?.id);
  const reconciled = withPlan({ steps }, offered ? stored.plan : undefined);
  return valuesChanged ? withoutFinalPrice(reconciled) : reconciled;
}

/**
 * Whether a step is complete: a form step once confirmed with valid data (AC-019); the plan step
 * while a plan is chosen and its final price for the current data is stored (AC-056). The summary
 * step is never complete here.
 */
export function isStepComplete(data: WizardData, step: WizardStep): boolean {
  switch (step.type) {
    case 'form':
      return data.steps[step.slug]?.complete === true;
    case 'plans':
      return data.plan !== undefined && data.plan.finalPrice !== null;
    default:
      return false;
  }
}

/** Index of the first step that is not complete (AC-024). */
export function firstIncompleteIndex(steps: readonly WizardStep[], data: WizardData): number {
  const index = steps.findIndex((step) => !isStepComplete(data, step));
  return index === -1 ? steps.length - 1 : index;
}

export interface StepResolution {
  /** Index of the step to show. */
  readonly index: number;
  /** Whether the address must be replaced with the address of that step. */
  readonly redirect: boolean;
}

/**
 * Chooses the step for an address. Without a step the first step opens; an unknown step, or a
 * step after one that is not complete, leads to the first step that is not complete (AC-024).
 */
export function resolveStep(
  steps: readonly WizardStep[],
  data: WizardData,
  slug: string | null,
): StepResolution {
  if (slug === null) {
    return { index: 0, redirect: true };
  }
  const requested = steps.findIndex((step) => step.slug === slug);
  const firstIncomplete = firstIncompleteIndex(steps, data);
  if (requested === -1 || requested > firstIncomplete) {
    return { index: firstIncomplete, redirect: true };
  }
  return { index: requested, redirect: false };
}
