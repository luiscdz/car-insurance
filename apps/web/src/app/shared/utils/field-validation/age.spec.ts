import { ageInYears, calendarDateOf, parseIsoDate, satisfiesDateRules } from './age';

const today = new Date(2026, 10, 23);

describe('age rules', () => {
  it('AC-014 accepts a person whose 18th birthday is today and rejects the day after', () => {
    expect(satisfiesDateRules('2008-11-23', { minAge: 18 }, today)).toBe(true);
    expect(satisfiesDateRules('2008-11-24', { minAge: 18 }, today)).toBe(false);
    expect(satisfiesDateRules('1990-01-01', { minAge: 18 }, today)).toBe(true);
  });

  it('AC-014 rejects a birth date after the current date', () => {
    expect(satisfiesDateRules('2026-11-24', { minAge: 18 }, today)).toBe(false);
    expect(satisfiesDateRules('2027-01-01', { minAge: 0 }, today)).toBe(false);
  });

  it('AC-014 a 29 February birth date reaches each age on 1 March in non-leap years', () => {
    const birth = { year: 2008, month: 2, day: 29 };

    expect(ageInYears(birth, { year: 2026, month: 2, day: 28 })).toBe(17);
    expect(ageInYears(birth, { year: 2026, month: 3, day: 1 })).toBe(18);
    expect(ageInYears(birth, { year: 2028, month: 2, day: 29 })).toBe(20);
    expect(ageInYears(birth, { year: 2028, month: 2, day: 28 })).toBe(19);
  });

  it('AC-012 rejects values that are not calendar dates', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
    expect(parseIsoDate('23/11/2026')).toBeNull();
    expect(parseIsoDate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
    expect(satisfiesDateRules('no es fecha', {}, today)).toBe(false);
  });

  it('AC-012 a date without minimum age only needs to be a valid date', () => {
    expect(satisfiesDateRules('2030-01-01', {}, today)).toBe(true);
    expect(calendarDateOf(today)).toEqual({ year: 2026, month: 11, day: 23 });
  });
});
