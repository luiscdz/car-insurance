import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import {
  atWidths,
  expectNoHorizontalOverflow,
  expectTargetsOfAtLeast24px,
} from './support/layout.js';
import {
  activatePay,
  type CountryCode,
  heading,
  holdPayment,
  reachSummary,
  SEEDED_SUMMARY_COPY,
  termsCheckbox,
  viewTermsButton,
} from './support/wizard.js';

/** No horizontal overflow at 320 and 375 px, and every target of at least 24 × 24 px (AC-092). */
async function expectResponsive(page: Page): Promise<void> {
  await atWidths(page, [320, 375], async () => {
    await expectNoHorizontalOverflow(page);
    await expectTargetsOfAtLeast24px(page);
  });
}

for (const code of ['co', 'cl'] as const satisfies readonly CountryCode[]) {
  const copy = SEEDED_SUMMARY_COPY[code];

  test.describe(`summary accessibility of ${code}`, () => {
    test(`AC-090 AC-092 ${code} passes the scan and fits narrow screens in every summary state`, async ({
      page,
      expectNoAxeViolations,
    }) => {
      await reachSummary(page, code);
      const held = await holdPayment(page);

      // As first shown.
      await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
      await expectNoAxeViolations();
      await expectResponsive(page);

      // With the message asking to accept the terms.
      await activatePay(page, code);
      await expect(page.getByRole('alert')).toHaveText(copy.acceptTermsMessage);
      await expectNoAxeViolations();
      await expectResponsive(page);

      // With the terms dialog open: the text scrolls inside, title and close stay visible.
      await termsCheckbox(page, code).check();
      await viewTermsButton(page, code).click();
      const terms = page.getByRole('dialog', { name: copy.termsTitle });
      await expect(terms).toBeVisible();
      await expectNoAxeViolations();
      await atWidths(page, [320, 375], async () => {
        await expectNoHorizontalOverflow(page);
        await page.setViewportSize({ width: page.viewportSize()?.width ?? 320, height: 480 });
        const body = terms.locator('[data-terms-body]');
        const scrolls = await body.evaluate(
          (element) => element.scrollHeight > element.clientHeight,
        );
        expect(scrolls).toBe(true);
        await body.evaluate((element) => element.scrollTo(0, element.scrollHeight));
        await expect(terms.getByRole('heading', { name: copy.termsTitle })).toBeInViewport();
        await expect(terms.getByRole('button', { name: copy.termsClose })).toBeInViewport();
      });
      await terms.getByRole('button', { name: copy.termsClose }).click();
      await expect(terms).toHaveCount(0);

      // While the payment is processed.
      await activatePay(page, code);
      await held.waitFor(1);
      await expect(page.getByRole('button', { name: copy.processing })).toHaveAttribute(
        'aria-busy',
        'true',
      );
      await expectNoAxeViolations();
      await expectResponsive(page);

      // With the leave dialog of AC-096 open.
      void page.goBack({ waitUntil: 'commit' }).catch(() => undefined);
      const leave = page.getByRole('alertdialog', { name: copy.processingLeaveTitle });
      await expect(leave).toBeVisible();
      await expectNoAxeViolations();
      await expectResponsive(page);
      await leave.getByRole('button', { name: copy.processingLeaveStay }).click();
      await expect(leave).toHaveCount(0);

      // With the payment error.
      await held.reject();
      await expect(page.getByRole('alert')).toHaveText(copy.paymentError);
      await expectNoAxeViolations();
      await expectResponsive(page);

      // The confirmation.
      await held.stop();
      await activatePay(page, code);
      await expect(heading(page)).toHaveText(copy.confirmationTitle);
      await expect(page.getByRole('status')).toContainText(copy.confirmationTitle);
      await expectNoAxeViolations();
      await expectResponsive(page);
    });
  });
}

test('AC-075 Chile: the terms dialog is modal, named by its title, focused on it; Escape and close return focus', async ({
  page,
}) => {
  const copy = SEEDED_SUMMARY_COPY.cl;
  await reachSummary(page, 'cl');
  const view = viewTermsButton(page, 'cl');

  await view.click();
  const dialog = page.getByRole('dialog', { name: copy.termsTitle });
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog.getByRole('heading', { name: copy.termsTitle })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(view).toBeFocused();

  await view.click();
  await expect(dialog.getByRole('heading', { name: copy.termsTitle })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const inside = await dialog.evaluate((element) => element.contains(document.activeElement));
  expect(inside).toBe(true);
  await dialog.getByRole('button', { name: copy.termsClose }).click();
  await expect(dialog).toHaveCount(0);
  await expect(view).toBeFocused();
  await expect(termsCheckbox(page, 'cl')).not.toBeChecked();
});
