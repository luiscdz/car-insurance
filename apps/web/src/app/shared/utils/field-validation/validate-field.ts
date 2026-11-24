import type { FieldType, FieldValue, FormFieldContent } from '@car-insurance/shared';
import { satisfiesDateRules } from './age';
import { isEmptyValue } from './is-empty';
import { satisfiesNumberRules } from './number-rules';
import { satisfiesTextRules } from './text-rules';

type ValueRule = (trimmed: string, field: FormFieldContent, today: Date) => boolean;

/** Validations evaluated for a present value, by field type (AC-012). */
const RULES_BY_TYPE: Readonly<Record<FieldType, ValueRule>> = {
  text: (trimmed, field) => satisfiesTextRules(trimmed, field.validation),
  number: (trimmed, field, today) => satisfiesNumberRules(trimmed, field.validation, today),
  date: (trimmed, field, today) => satisfiesDateRules(trimmed, field.validation, today),
  select: (trimmed, field) => field.options.some((option) => option.value === trimmed),
  checkbox: () => true,
};

/**
 * Whether a value satisfies every validation configured for the field (AC-012 to AC-014). An
 * empty value is valid only when the field is not required, and then no other rule is evaluated.
 */
export function isFieldValueValid(
  field: FormFieldContent,
  value: FieldValue | undefined,
  today: Date,
): boolean {
  if (isEmptyValue(field.type, value)) {
    return !field.required;
  }
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return RULES_BY_TYPE[field.type](trimmed, field, today);
}
