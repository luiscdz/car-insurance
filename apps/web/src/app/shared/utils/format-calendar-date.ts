import { parseIsoDate } from './field-validation/age';

/**
 * Formats a stored calendar date (`YYYY-MM-DD`) with the browser's `Intl` date formatting for the
 * country's locale: day, month and four-digit year (AC-068). The date is formatted in UTC from its
 * own day, month and year, so the device's time zone never shifts it. No locale is named here;
 * `null` when the value is not a valid calendar date.
 */
export function formatCalendarDate(value: string, locale: string): string | null {
  const date = parseIsoDate(value);
  if (date === null) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
}
