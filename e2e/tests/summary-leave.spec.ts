import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import {
  activatePay,
  type CountryCode,
  heading,
  holdPayment,
  type HeldPayments,
  PLAN_STEP,
  payButton,
  priceStatus,
  reachSummary,
  RECOMMENDED_PLAN,
  SEEDED_PLAN_COPY,
  SEEDED_SUMMARY_COPY,
  SUMMARY_STEP,
  termsCheckbox,
} from './support/wizard.js';

/**
 * AC-096 in Chromium, which shows the browser's own leave confirmation after a user activation
 * (plan R3): the pay click is that activation.
 */
async function payAndHold(page: Page, code: CountryCode): Promise<HeldPayments> {
  await reachSummary(page, code);
  const held = await holdPayment(page);
  await termsCheckbox(page, code).check();
  await activatePay(page, code);
  await held.waitFor(1);
  await expect(payButton(page, code)).toHaveAttribute('aria-busy', 'true');
  return held;
}

async function storedConfirmation(page: Page, code: CountryCode): Promise<unknown> {
  return page.evaluate(
    (key) =>
      (JSON.parse(sessionStorage.getItem(key) ?? '{}') as { confirmation?: unknown }).confirmation,
    `wizard:${code}`,
  );
}

for (const code of ['co', 'cl'] as const satisfies readonly CountryCode[]) {
  const copy = SEEDED_SUMMARY_COPY[code];

  test.describe(`leaving while a payment of ${code} is processed`, () => {
    test(`AC-096 ${code}: reloading asks the browser; stay keeps processing and the answer is applied`, async ({
      page,
    }) => {
      const held = await payAndHold(page, code);

      const asked = page.waitForEvent('dialog');
      const reload = page.reload({ timeout: 3_000 }).catch(() => undefined);
      const dialog = await asked;
      expect(dialog.type()).toBe('beforeunload');
      await dialog.dismiss();
      await reload;

      await expect(payButton(page, code)).toHaveText(copy.processing);
      await held.release();
      await expect(heading(page)).toHaveText(copy.confirmationTitle);
    });

    test(`AC-096 ${code}: reloading and leaving shows the summary again unpaid`, async ({
      page,
    }) => {
      await payAndHold(page, code);

      page.once('dialog', (dialog) => void dialog.accept());
      await page.reload();

      await expect(heading(page)).toHaveText(SUMMARY_STEP);
      await expect(termsCheckbox(page, code)).not.toBeChecked();
      await expect(page.getByRole('button', { name: copy.pay })).toBeVisible();
      expect(await storedConfirmation(page, code)).toBeUndefined();
    });

    test(`AC-096 ${code}: the browser back button asks with the processing copy; stay applies the answer`, async ({
      page,
    }) => {
      const held = await payAndHold(page, code);
      const url = page.url();

      void page.goBack({ waitUntil: 'commit' }).catch(() => undefined);

      const dialog = page.getByRole('alertdialog', { name: copy.processingLeaveTitle });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: copy.processingLeaveStay })).toBeFocused();
      await dialog.getByRole('button', { name: copy.processingLeaveStay }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page).toHaveURL(url);
      await expect(payButton(page, code)).toHaveText(copy.processing);

      await held.release();
      await expect(heading(page)).toHaveText(copy.confirmationTitle);
      expect(await storedConfirmation(page, code)).toBeTruthy();
    });

    test(`AC-096 ${code}: the browser back button and leave ignore the answer; on return the summary is unpaid`, async ({
      page,
    }) => {
      const held = await payAndHold(page, code);

      void page.goBack({ waitUntil: 'commit' }).catch(() => undefined);
      const dialog = page.getByRole('alertdialog', { name: copy.processingLeaveTitle });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: copy.processingLeaveConfirm }).click();

      await expect(heading(page)).toHaveText(PLAN_STEP);
      await held.stop();
      await expect(priceStatus(page, RECOMMENDED_PLAN[code])).toContainText(
        SEEDED_PLAN_COPY[code].finalPrice,
      );
      await page.goForward();
      await expect(heading(page)).toHaveText(SUMMARY_STEP);
      await expect(termsCheckbox(page, code)).not.toBeChecked();
      await expect(page.getByRole('button', { name: copy.pay })).toBeVisible();
      expect(await storedConfirmation(page, code)).toBeUndefined();
    });
  });
}
