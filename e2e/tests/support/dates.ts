import type { Page } from '@playwright/test';

/** Boundaries computed from the browser's local date, as the application does (AC-013, AC-014). */
export interface Boundaries {
  /** Current year Y. */
  readonly year: number;
  /** A birth date whose 18th birthday is today (yesterday on 29 February). */
  readonly eighteenToday: string;
  /** The day after it: the 18th birthday is still to come. */
  readonly eighteenTomorrow: string;
  /** A comfortably adult birth date. */
  readonly adult: string;
}

export async function boundaries(page: Page): Promise<Boundaries> {
  return page.evaluate(() => {
    const iso = (date: Date) =>
      [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-');
    const today = new Date();
    const birthday = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    if (birthday.getDate() !== today.getDate()) {
      // 29 February does not exist 18 years earlier: use the last day of that February.
      birthday.setDate(0);
    }
    const nextDay = new Date(birthday);
    nextDay.setDate(birthday.getDate() + 1);
    return {
      year: today.getFullYear(),
      eighteenToday: iso(birthday),
      eighteenTomorrow: iso(nextDay),
      adult: iso(new Date(today.getFullYear() - 30, 0, 15)),
    };
  });
}
