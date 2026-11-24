import { formatCalendarDate } from './format-calendar-date';

/** What `Intl` itself produces for a calendar date in a locale (R9: no hard-coded separators). */
const intl = (locale: string, year: number, month: number, day: number) =>
  new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));

/** The test runner's Node.js environment; Node applies a change of `TZ` at once (R4). */
const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } })
  .process.env;

/** Runs `check` with the device time zone set to `zone`, then restores it. */
function inTimeZone(zone: string, check: () => void): void {
  const previous = env['TZ'];
  env['TZ'] = zone;
  try {
    check();
  } finally {
    if (previous === undefined) {
      delete env['TZ'];
    } else {
      env['TZ'] = previous;
    }
  }
}

describe('formatCalendarDate', () => {
  it('AC-068 shows 5 March 1990 with the Intl formatting of es-CO and es-CL', () => {
    expect(formatCalendarDate('1990-03-05', 'es-CO')).toBe(intl('es-CO', 1990, 3, 5));
    expect(formatCalendarDate('1990-03-05', 'es-CL')).toBe(intl('es-CL', 1990, 3, 5));
    expect(formatCalendarDate('1990-03-05', 'es-CO')).toMatch(/05.03.1990/);
    expect(formatCalendarDate('1990-03-05', 'es-CL')).toMatch(/05.03.1990/);
  });

  it.each(['America/Bogota', 'America/Los_Angeles', 'Pacific/Kiritimati', 'Asia/Tokyo', 'UTC'])(
    'AC-068 never shifts the calendar date with the device time zone %s',
    (zone) => {
      inTimeZone(zone, () => {
        expect(formatCalendarDate('1990-03-05', 'es-CO')).toBe(intl('es-CO', 1990, 3, 5));
        expect(formatCalendarDate('2000-01-01', 'es-CL')).toBe(intl('es-CL', 2000, 1, 1));
        expect(formatCalendarDate('1999-12-31', 'es-CL')).toBe(intl('es-CL', 1999, 12, 31));
      });
    },
  );

  it('AC-068 the device time zone does change local dates, which the formatting ignores', () => {
    let west = 0;
    let east = 0;
    inTimeZone('America/Los_Angeles', () => (west = new Date(2026, 0, 1).getTimezoneOffset()));
    inTimeZone('Asia/Tokyo', () => (east = new Date(2026, 0, 1).getTimezoneOffset()));

    expect(west).toBeGreaterThan(0);
    expect(east).toBeLessThan(0);
  });

  it.each(['1990-02-30', '05/03/1990', '', '1990-3-5'])(
    'AC-068 gives nothing for the invalid stored date %j',
    (value) => {
      expect(formatCalendarDate(value, 'es-CO')).toBeNull();
    },
  );
});
