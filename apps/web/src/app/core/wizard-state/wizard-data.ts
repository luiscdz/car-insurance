import type { FieldValue, FormFieldContent, WizardData, WizardStep } from '@car-insurance/shared';
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

/**
 * Reconciles stored data with the current configuration (AC-025): values of fields and steps that
 * are no longer published are discarded, and a step stays complete only while its stored values
 * still satisfy the current configuration.
 */
export function reconcile(
  stored: WizardData,
  steps: readonly WizardStep[],
  today: Date,
): WizardData {
  const reconciled: WizardData = { steps: {} };
  for (const step of steps) {
    const storedStep = stored.steps[step.slug];
    if (step.type !== 'form' || storedStep === undefined) {
      continue;
    }
    const values = currentValues(step.fields, storedStep.values);
    reconciled.steps[step.slug] = {
      values,
      complete: storedStep.complete && areStepValuesValid(step.fields, values, today),
    };
  }
  return reconciled;
}

/** A form step is complete once confirmed with valid data; other step types never are here. */
export function isStepComplete(data: WizardData, step: WizardStep): boolean {
  return step.type === 'form' && data.steps[step.slug]?.complete === true;
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
