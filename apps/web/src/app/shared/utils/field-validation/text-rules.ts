import type { FieldValidation } from '@car-insurance/shared';

const compiledPatterns = new Map<string, RegExp>();

function wholeValuePattern(pattern: string): RegExp {
  let compiled = compiledPatterns.get(pattern);
  if (!compiled) {
    compiled = new RegExp(`^(?:${pattern})$`);
    compiledPatterns.set(pattern, compiled);
  }
  return compiled;
}

/**
 * Minimum length, maximum length and a pattern the whole value must match, evaluated on the
 * trimmed value; limits are inclusive (AC-012).
 */
export function satisfiesTextRules(trimmed: string, validation: FieldValidation): boolean {
  const { minLength, maxLength, pattern } = validation;
  if (minLength != null && trimmed.length < minLength) {
    return false;
  }
  if (maxLength != null && trimmed.length > maxLength) {
    return false;
  }
  return pattern == null || wholeValuePattern(pattern).test(trimmed);
}
