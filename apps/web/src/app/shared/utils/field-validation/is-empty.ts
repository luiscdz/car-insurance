import type { FieldType, FieldValue } from '@car-insurance/shared';

/**
 * A value counts as empty when it is absent, text made only of spaces, an unchecked checkbox or a
 * select with no option chosen (AC-012).
 */
export function isEmptyValue(type: FieldType, value: FieldValue | undefined): boolean {
  if (type === 'checkbox') {
    return value !== true;
  }
  return typeof value !== 'string' || value.trim() === '';
}
