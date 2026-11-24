/**
 * Formats a whole amount with the browser's `Intl` number formatting for the country's locale and
 * currency, both read from the country's content: the symbol and separators of that locale and no
 * decimal digits (AC-042). No country, currency or locale is named here.
 */
export function formatPrice(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
