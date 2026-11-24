import type { FieldValue, FormFieldContent } from '@car-insurance/shared';

function normalized(field: FormFieldContent, value: FieldValue | undefined): string | boolean {
  if (field.type === 'checkbox') {
    return value === true;
  }
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Whether the current step has unconfirmed values: a field whose value differs from the value
 * stored for the step, or from empty when the step was never completed (AC-033). Text is
 * compared without leading or trailing spaces and a checkbox by its checked state.
 */
export function hasUnconfirmedValues(
  fields: readonly FormFieldContent[],
  current: Readonly<Record<string, FieldValue>>,
  stored: Readonly<Record<string, FieldValue>> | undefined,
): boolean {
  return fields.some(
    (field) => normalized(field, current[field.name]) !== normalized(field, stored?.[field.name]),
  );
}
