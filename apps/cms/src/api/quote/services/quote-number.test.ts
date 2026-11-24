import { QUOTE_NUMBER_PATTERN } from '@car-insurance/shared';
import { describe, expect, it } from 'vitest';
import { quoteNumber } from './quote-number';

/** A random source that returns the given indexes in turn. */
function sequence(...indexes: number[]) {
  const asked: number[] = [];
  let next = 0;
  const pick = (max: number) => {
    asked.push(max);
    return indexes[next++ % indexes.length] ?? 0;
  };
  return { pick, asked };
}

describe('quote number', () => {
  it('AC-084 is the upper-case country code, the UTC date and six random letters or digits', () => {
    const { pick, asked } = sequence(33, 10, 16, 28, 12, 23);

    const number = quoteNumber('co', new Date(Date.UTC(2026, 10, 23, 15, 30)), pick);

    expect(number).toBe('CO-20261123-7KQ2MX');
    expect(QUOTE_NUMBER_PATTERN.test(number)).toBe(true);
    expect(asked).toEqual([36, 36, 36, 36, 36, 36]);
  });

  it('AC-084 takes the prefix from the request country code for Chile too', () => {
    const { pick } = sequence(0, 35, 5, 26, 29, 25);

    expect(quoteNumber('cl', new Date(Date.UTC(2026, 10, 23)), pick)).toBe('CL-20261123-A9F03Z');
  });

  it('AC-084 uses the UTC date just before and just after midnight', () => {
    const { pick } = sequence(0);

    expect(quoteNumber('co', new Date(Date.UTC(2026, 11, 31, 23, 59, 59)), pick)).toBe(
      'CO-20261231-AAAAAA',
    );
    expect(quoteNumber('co', new Date(Date.UTC(2027, 0, 1, 0, 0, 0)), pick)).toBe(
      'CO-20270101-AAAAAA',
    );
  });

  it('AC-084 draws with the default clock and random source in the agreed format', () => {
    const numbers = Array.from({ length: 50 }, () => quoteNumber('cl'));

    expect(numbers.every((number) => QUOTE_NUMBER_PATTERN.test(number))).toBe(true);
    expect(numbers.every((number) => number.startsWith('CL-'))).toBe(true);
  });
});
