import { formatPrice } from './format-price';

/** The browser's own formatting, which the application must match (AC-042). */
const intl = (amount: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

describe('formatPrice', () => {
  it.each([
    [1200000, 'COP', 'es-CO'],
    [1850000, 'COP', 'es-CO'],
    [350000, 'CLP', 'es-CL'],
    [455000, 'CLP', 'es-CL'],
  ])('AC-042 formats %i %s as Intl does for %s', (amount, currency, locale) => {
    expect(formatPrice(amount, currency, locale)).toBe(intl(amount, currency, locale));
  });

  it('AC-042 shows the symbol and thousands separator of each locale without decimals', () => {
    const colombia = formatPrice(1200000, 'COP', 'es-CO');
    const chile = formatPrice(350000, 'CLP', 'es-CL');

    expect(colombia).toMatch(/^\$\s?1\.200\.000$/);
    expect(chile).toMatch(/^\$\s?350\.000$/);
    expect(colombia).not.toMatch(/[,]\d|COP/);
    expect(chile).not.toMatch(/[,]\d|CLP/);
  });

  it('AC-042 never shows decimal digits, even for a currency that has them', () => {
    expect(formatPrice(1234.56, 'USD', 'en-US')).toBe('$1,235');
  });
});
