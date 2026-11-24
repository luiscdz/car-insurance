import { expect, test } from './fixtures.js';
import {
  activatePay,
  changePlanLink,
  type CountryCode,
  editLink,
  heading,
  holdPayment,
  payButton,
  reachSummary,
  SEEDED_STEPS,
  SEEDED_SUMMARY_COPY,
  termsCheckbox,
  viewTermsButton,
} from './support/wizard.js';

/** The first data section of each country, whose edit action the tests check. */
const FIRST_SECTION = { co: SEEDED_STEPS.co[0], cl: SEEDED_STEPS.cl[0] } as const;

for (const code of ['co', 'cl'] as const satisfies readonly CountryCode[]) {
  const copy = SEEDED_SUMMARY_COPY[code];

  test.describe(`payment of ${code}`, () => {
    test(`AC-076 ${code}: pay without accepting sends nothing and asks to accept; accepting enables pay`, async ({
      page,
    }) => {
      let payments = 0;
      page.on('request', (request) => {
        if (request.url().endsWith('/api/quote/pay')) {
          payments += 1;
        }
      });
      await reachSummary(page, code);
      await expect(termsCheckbox(page, code)).not.toBeChecked();
      await expect(payButton(page, code)).toHaveAttribute('aria-disabled', 'true');

      await activatePay(page, code);

      const message = page.getByRole('alert');
      await expect(message).toHaveText(copy.acceptTermsMessage);
      await expect(termsCheckbox(page, code)).toBeFocused();
      await expect(termsCheckbox(page, code)).toHaveAccessibleDescription(copy.acceptTermsMessage);
      expect(payments).toBe(0);

      await termsCheckbox(page, code).check();
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(payButton(page, code)).toHaveAttribute('aria-disabled', 'false');
    });

    test(`AC-078 ${code}: a double click on pay with a delayed answer sends exactly one request and locks the step`, async ({
      page,
    }) => {
      await reachSummary(page, code);
      const held = await holdPayment(page);
      await termsCheckbox(page, code).check();

      await payButton(page, code).dblclick();
      await held.waitFor(1);
      await activatePay(page, code);
      await page.keyboard.press('Enter');

      await expect(payButton(page, code)).toHaveText(copy.processing);
      await expect(payButton(page, code)).toHaveAttribute('aria-busy', 'true');
      await expect(payButton(page, code)).toHaveAttribute('aria-disabled', 'true');
      await expect(page.getByRole('status').filter({ hasText: copy.processing })).toHaveCount(1);
      await expect(termsCheckbox(page, code)).toBeDisabled();
      await expect(viewTermsButton(page, code)).toHaveAttribute('aria-disabled', 'true');
      for (const link of [
        editLink(page, code, FIRST_SECTION[code]),
        changePlanLink(page, code),
        page.getByRole('link', { name: 'Volver' }),
      ]) {
        await expect(link).toHaveAttribute('aria-disabled', 'true');
        await expect(link).not.toHaveAttribute('href', /./);
      }
      expect(held.count()).toBe(1);

      await held.release();
      await expect(heading(page)).toHaveText(copy.confirmationTitle);
      expect(held.count()).toBe(1);
    });

    test(`AC-081 ${code}: a rejected payment shows the error, keeps everything and paying again succeeds`, async ({
      page,
    }) => {
      const { plan, finalPrice } = await reachSummary(page, code);
      const held = await holdPayment(page);
      await termsCheckbox(page, code).check();
      await activatePay(page, code);
      await held.waitFor(1);

      await held.reject();

      const error = page.getByRole('alert');
      await expect(error).toHaveText(copy.paymentError);
      await expect(payButton(page, code)).toHaveAttribute('aria-disabled', 'false');
      await expect(payButton(page, code)).toBeFocused();
      await expect(termsCheckbox(page, code)).toBeChecked();
      await expect(page.getByRole('region', { name: copy.planHeading })).toContainText(plan);
      await expect(page.getByRole('region', { name: copy.planHeading })).toContainText(finalPrice);

      await activatePay(page, code);
      await held.waitFor(2);
      await expect(page.getByRole('alert')).toHaveCount(0);
      await held.release();
      await expect(heading(page)).toHaveText(copy.confirmationTitle);
      expect(held.count()).toBe(2);
    });

    test(`AC-081 ${code}: a network failure shows the same error message`, async ({ page }) => {
      await reachSummary(page, code);
      const held = await holdPayment(page);
      await termsCheckbox(page, code).check();
      await activatePay(page, code);
      await held.waitFor(1);

      await held.abort();

      await expect(page.getByRole('alert')).toHaveText(copy.paymentError);
      await expect(page.getByRole('alert')).not.toContainText(/error|failed|refused/i);
    });

    test(`AC-083 AC-084 ${code}: the complete flow from the country selection to the confirmation`, async ({
      page,
    }) => {
      const { plan, finalPrice } = await reachSummary(page, code);
      await termsCheckbox(page, code).check();

      await activatePay(page, code);

      const title = heading(page);
      await expect(title).toHaveText(copy.confirmationTitle);
      await expect(title).toBeFocused();
      await expect(page).toHaveURL(new RegExp(`/${code}/resumen-y-pago$`));
      await expect(page.getByText(copy.confirmationMessage, { exact: true })).toBeVisible();
      const quote = page.locator('dt', { hasText: copy.quoteNumber }).locator('+ dd');
      await expect(quote).toBeVisible();
      expect(((await quote.textContent()) ?? '').trim()).toMatch(
        new RegExp(`^${code.toUpperCase()}-\\d{8}-[A-Z0-9]{6}$`),
      );
      const today = await page.evaluate(() =>
        new Date().toISOString().slice(0, 10).replaceAll('-', ''),
      );
      await expect(quote).toContainText(today);
      await expect(page.locator('dt', { hasText: copy.plan }).locator('+ dd')).toHaveText(plan);
      await expect(page.locator('dt', { hasText: copy.amountPaid }).locator('+ dd')).toHaveText(
        finalPrice,
      );
      const progress = page.getByRole('navigation');
      await expect(progress.locator('[aria-current="step"]')).toContainText('Resumen y pago');
      await expect(page.getByRole('button', { name: copy.newQuote })).toBeVisible();
      await expect(payButton(page, code)).toHaveCount(0);
      await expect(termsCheckbox(page, code)).toHaveCount(0);
      await expect(page.getByRole('link')).toHaveCount(0);
      const content = await page.locator('main').textContent();
      for (const value of ['1234567890', '7890', '12.345.678-5', '678-5', 'ABC123', 'BBBB12']) {
        expect(content).not.toContain(value);
      }
    });
  });
}
