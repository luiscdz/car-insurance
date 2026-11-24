import { satisfiesTextRules } from './text-rules';

describe('text rules', () => {
  it('AC-012 applies inclusive minimum and maximum lengths', () => {
    const limits = { minLength: 6, maxLength: 10 };

    expect(satisfiesTextRules('123456', limits)).toBe(true);
    expect(satisfiesTextRules('1234567890', limits)).toBe(true);
    expect(satisfiesTextRules('12345', limits)).toBe(false);
    expect(satisfiesTextRules('12345678901', limits)).toBe(false);
  });

  it('AC-012 requires the whole value to match the pattern of Colombia and Chile', () => {
    expect(satisfiesTextRules('ABC123', { pattern: '[A-Za-z]{3}[0-9]{3}' })).toBe(true);
    expect(satisfiesTextRules('xABC123', { pattern: '[A-Za-z]{3}[0-9]{3}' })).toBe(false);
    const rut = { pattern: '^([0-9]{1,2}(\\.[0-9]{3}){2}|[0-9]{7,8})-[0-9Kk]$' };
    expect(satisfiesTextRules('12.345.678-k', rut)).toBe(true);
    expect(satisfiesTextRules('12.345.678-x', rut)).toBe(false);
  });

  it('AC-012 without validations any text is valid', () => {
    expect(satisfiesTextRules('cualquier texto', {})).toBe(true);
  });
});
