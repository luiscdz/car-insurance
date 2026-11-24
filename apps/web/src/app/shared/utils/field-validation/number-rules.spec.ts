import { parseNumber, satisfiesNumberRules } from './number-rules';
import { yearRange } from './year-range';

const today = new Date(2026, 10, 23);
const vehicleYear = { integer: true, yearsBefore: 20, yearsAfter: 1 };

describe('number rules', () => {
  it('AC-013 accepts years from Y-20 to Y+1 and rejects Y-21, Y+2 and decimals', () => {
    expect(yearRange(today, 20, 1)).toEqual({ min: 2006, max: 2027 });
    expect(satisfiesNumberRules('2006', vehicleYear, today)).toBe(true);
    expect(satisfiesNumberRules('2027', vehicleYear, today)).toBe(true);
    expect(satisfiesNumberRules('2005', vehicleYear, today)).toBe(false);
    expect(satisfiesNumberRules('2028', vehicleYear, today)).toBe(false);
    expect(satisfiesNumberRules('2020.5', vehicleYear, today)).toBe(false);
  });

  it('AC-013 follows the device year', () => {
    const nextYear = new Date(2027, 0, 1);

    expect(satisfiesNumberRules('2006', vehicleYear, nextYear)).toBe(false);
    expect(satisfiesNumberRules('2028', vehicleYear, nextYear)).toBe(true);
  });

  it('AC-012 applies inclusive minimum and maximum values', () => {
    const limits = { min: 1, max: 10 };

    expect(satisfiesNumberRules('1', limits, today)).toBe(true);
    expect(satisfiesNumberRules('10', limits, today)).toBe(true);
    expect(satisfiesNumberRules('0', limits, today)).toBe(false);
    expect(satisfiesNumberRules('10.5', limits, today)).toBe(false);
    expect(satisfiesNumberRules('2.5', limits, today)).toBe(true);
  });

  it('AC-012 rejects values that are not numbers', () => {
    expect(parseNumber('2O20')).toBeNull();
    expect(parseNumber('20,5')).toBeNull();
    expect(parseNumber('-3')).toBe(-3);
    expect(satisfiesNumberRules('abc', {}, today)).toBe(false);
  });
});
