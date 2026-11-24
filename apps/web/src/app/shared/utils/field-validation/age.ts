import type { FieldValidation } from '@car-insurance/shared';

export interface CalendarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Parses a `YYYY-MM-DD` value from a date input; impossible dates give `null`. */
export function parseIsoDate(value: string): CalendarDate | null {
  const match = ISO_DATE.exec(value);
  if (!match) {
    return null;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return { year, month, day };
}

/** The local calendar date of the device (AC-014). */
export function calendarDateOf(date: Date): CalendarDate {
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

/**
 * Age in whole years on `today`. A birth date of 29 February reaches each age on 1 March in
 * years that are not leap years (AC-014). Negative when the birth date is after `today`.
 */
export function ageInYears(birth: CalendarDate, today: CalendarDate): number {
  let { month, day } = birth;
  if (month === 2 && day === 29 && !isLeapYear(today.year)) {
    month = 3;
    day = 1;
  }
  const birthdayReached = today.month > month || (today.month === month && today.day >= day);
  return today.year - birth.year - (birthdayReached ? 0 : 1);
}

/** A valid calendar date and, when configured, a minimum age in whole years on `today`. */
export function satisfiesDateRules(
  trimmed: string,
  validation: FieldValidation,
  today: Date,
): boolean {
  const date = parseIsoDate(trimmed);
  if (date === null) {
    return false;
  }
  const { minAge } = validation;
  return minAge == null || ageInYears(date, calendarDateOf(today)) >= minAge;
}
