import { render, screen } from '@testing-library/angular';
import { chileContent, colombiaContent } from '../../../../../../testing/content-fixtures';
import { formatPrice } from '../../../../../shared/utils/format-price';
import { ConfirmationPanel } from './confirmation-panel';

describe('ConfirmationPanel', () => {
  it.each([
    [
      'Colombia',
      colombiaContent,
      'CO-20261123-7KQ2MX',
      'Plan Clásico',
      formatPrice(2312500, 'COP', 'es-CO'),
    ],
    ['Chile', chileContent, 'CL-20261123-A9F03Z', 'Plan Full', formatPrice(624000, 'CLP', 'es-CL')],
  ])(
    'AC-083 AC-090 %s: the message and the quote number, plan and amount paid as terms with the copy of the country',
    async (_, content, quoteNumber, planName, amount) => {
      const copy = content().country.summaryCopy;
      const newQuote = vi.fn();
      const { container } = await render(ConfirmationPanel, {
        inputs: { copy, confirmation: { quoteNumber, planName, amount } },
        on: { newQuote },
      });

      expect(screen.getByText(copy.confirmationMessage)).toBeTruthy();
      const pairs = [...container.querySelectorAll('dl > div')].map((row) => [
        row.querySelector('dt')?.textContent?.trim(),
        row.querySelector('dd')?.textContent?.trim(),
      ]);
      expect(pairs).toEqual([
        [copy.quoteNumberLabel, quoteNumber],
        [copy.planLabel, planName],
        [copy.amountPaidLabel, amount],
      ]);
      expect(screen.getByText(quoteNumber).getAttribute('translate')).toBe('no');

      screen.getByRole('button', { name: copy.newQuoteLabel }).click();
      expect(newQuote).toHaveBeenCalledTimes(1);
    },
  );
});
