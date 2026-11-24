import type { FieldValidation } from '@car-insurance/shared';
import { yearRange } from './year-range';

const NUMBER_PATTERN = /^-?\d+(?:\.\d+)?$/;

/** Parses a decimal number written with digits and an optional point; anything else is `null`. */
export function parseNumber(trimmed: string): number | null {
  return NUMBER_PATTERN.test(trimmed) ? Number(trimmed) : null;
}

/**
 * Minimum, maximum, whole numbers only and a year range relative to the current year; every
 * limit is inclusive (AC-012, AC-013).
 */
export function satisfiesNumberRules(
  trimmed: string,
  validation: FieldValidation,
  today: Date,
): boolean {
  const value = parseNumber(trimmed);
  if (value === null) {
    return false;
  }
  const { min, max, integer, yearsBefore, yearsAfter } = validation;
  if (integer === true && !Number.isInteger(value)) {
    return false;
  }
  if ((min != null && value < min) || (max != null && value > max)) {
    return false;
  }
  if (yearsBefore != null && yearsAfter != null) {
    const range = yearRange(today, yearsBefore, yearsAfter);
    return value >= range.min && value <= range.max;
  }
  return true;
}
