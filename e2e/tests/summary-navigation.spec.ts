import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import {
  activateContinue,
  activatePay,
  backLink,
  changePlanLink,
  chooseButton,
  continueButton,
  editLink,
  heading,
  PLAN_STEP,
  price,
  priceStatus,
  reachSummary,
  SEEDED_PLAN_COPY,
  SEEDED_STEPS,
  SEEDED_SUMMARY_COPY,
  SUMMARY_STEP,
  termsCheckbox,
} from './support/wizard.js';

const CO = SEEDED_SUMMARY_COPY.co;
const CL = SEEDED_SUMMARY_COPY.cl;

/** Pays the quote shown on the summary and waits for the confirmation. */
async function pay(page: Page, code: 'co' | 'cl'): Promise<string> {
  await termsCheckbox(page, code).check();
  await activatePay(page, code);
  const copy = SEEDED_SUMMARY_COPY[code];
  await expect(heading(page)).toHaveText(copy.confirmationTitle);
  const quote = page.locator('dt', { hasText: copy.quoteNumber }).locator('+ dd');
  return ((await quote.textContent()) ?? '').trim();
}

/** Counts the application's leave dialogs and the browser's own confirmations. */
function countDialogs(page: Page): () => number {
  let dialogs = 0;
  page.on('dialog', async (dialog) => {
    dialogs += 1;
    await dialog.accept();
  });
  return () => dialogs;
}

test.describe('summary navigation', () => {
  test('AC-071 Chile: edit "Tu vehículo", change the year, continue through the plan step and see the new final price', async ({
    page,
  }) => {
    const { finalPrice } = await reachSummary(page, 'cl', { policyholder: 40, vehicle: 3 });

    await editLink(page, 'cl', 'Tu vehículo').click();

    await expect(heading(page)).toHaveText('Tu vehículo');
    await expect(heading(page)).toBeFocused();
    await expect(page).toHaveURL(/\/cl\/tu-vehiculo$/);
    await expect(page.getByRole('navigation').locator('[aria-current="step"]')).toContainText(
      'Tu vehículo',
    );
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);
    const year = await page.evaluate(() => String(new Date().getFullYear() - 12));
    await page.getByLabel('Año del vehículo').fill(year);
    await activateContinue(page);
    await expect(heading(page)).toHaveText(PLAN_STEP);
    await expect(chooseButton(page, 'Plan Full')).toHaveAttribute('aria-pressed', 'true');
    await expect(priceStatus(page, 'Plan Full')).toContainText(SEEDED_PLAN_COPY.cl.finalPrice);
    await continueButton(page).click();

    await expect(heading(page)).toHaveText(SUMMARY_STEP);
    const planSection = page.getByRole('region', { name: CL.planHeading });
    await expect(planSection).not.toContainText(finalPrice);
    await expect(planSection).toContainText(await price(page, 'cl', 624000));
  });

  test('AC-069 AC-071 Colombia: edit shows the full document number; continuing unchanged returns to the summary', async ({
    page,
  }) => {
    const { finalPrice } = await reachSummary(page, 'co');

    await editLink(page, 'co', SEEDED_STEPS.co[0]).click();

    await expect(heading(page)).toHaveText(SEEDED_STEPS.co[0]);
    await expect(heading(page)).toBeFocused();
    await expect(page.getByLabel('Número de documento')).toHaveValue('1234567890');
    await activateContinue(page);
    await expect(heading(page)).toHaveText(PLAN_STEP);
    await expect(priceStatus(page, 'Plan Clásico')).toContainText(SEEDED_PLAN_COPY.co.finalPrice);
    await continueButton(page).click();
    await expect(heading(page)).toHaveText(SUMMARY_STEP);
    await expect(page.getByRole('region', { name: CO.planHeading })).toContainText(finalPrice);
  });

  test('AC-072 Colombia: change plan, choose another plan and continue to its summary', async ({
    page,
  }) => {
    await reachSummary(page, 'co');

    await changePlanLink(page, 'co').click();

    await expect(heading(page)).toHaveText(PLAN_STEP);
    await expect(heading(page)).toBeFocused();
    await expect(chooseButton(page, 'Plan Clásico')).toHaveAttribute('aria-pressed', 'true');
    await chooseButton(page, 'Plan Global').click();
    await expect(priceStatus(page, 'Plan Global')).toContainText(SEEDED_PLAN_COPY.co.finalPrice);
    await continueButton(page).click();
    await expect(heading(page)).toHaveText(SUMMARY_STEP);
    const planSection = page.getByRole('region', { name: CO.planHeading });
    await expect(planSection).toContainText('Plan Global');
    await expect(planSection).toContainText(await price(page, 'co', 2600000));
  });

  test('AC-072 Chile: the browser back button from the summary shows the plan step with the choice', async ({
    page,
  }) => {
    await reachSummary(page, 'cl');

    await page.goBack();

    await expect(heading(page)).toHaveText(PLAN_STEP);
    await expect(heading(page)).toBeFocused();
    await expect(chooseButton(page, 'Plan Full')).toHaveAttribute('aria-pressed', 'true');
  });

  test('AC-085 Colombia: the confirmation is shown again after a reload and after back and forward; never in Chile or a new tab', async ({
    page,
    context,
  }) => {
    await reachSummary(page, 'co');
    const quote = await pay(page, 'co');

    await page.reload();
    await expect(heading(page)).toHaveText(CO.confirmationTitle);
    await expect(page.getByText(quote)).toBeVisible();
    await expect(page.getByRole('button', { name: CO.pay })).toHaveCount(0);

    await page.goBack();
    await expect(heading(page)).toHaveText(PLAN_STEP);
    await expect(priceStatus(page, 'Plan Clásico')).toContainText(SEEDED_PLAN_COPY.co.finalPrice);
    await page.goForward();
    await expect(heading(page)).toHaveText(CO.confirmationTitle);
    await expect(page.getByText(quote)).toBeVisible();

    await page.goto('/cl/resumen-y-pago');
    await expect(heading(page)).toHaveText(SEEDED_STEPS.cl[0]);
    await page.goto('/co/resumen-y-pago');
    await expect(heading(page)).toHaveText(CO.confirmationTitle);

    const other = await context.newPage();
    await other.goto('/co/resumen-y-pago');
    await expect(heading(other)).toHaveText(SEEDED_STEPS.co[0]);
  });

  test('AC-086 Chile: after the confirmation, another plan leads to the summary of a new quote', async ({
    page,
  }) => {
    await reachSummary(page, 'cl');
    await pay(page, 'cl');

    await page.goBack();
    await expect(heading(page)).toHaveText(PLAN_STEP);
    await chooseButton(page, 'Plan Premium').click();
    await expect(priceStatus(page, 'Plan Premium')).toContainText(SEEDED_PLAN_COPY.cl.finalPrice);
    await continueButton(page).click();

    await expect(heading(page)).toHaveText(SUMMARY_STEP);
    await expect(page.getByRole('region', { name: CL.planHeading })).toContainText('Plan Premium');
    await expect(termsCheckbox(page, 'cl')).not.toBeChecked();
    await expect(page.getByRole('button', { name: CL.pay })).toBeVisible();
  });

  test('AC-087 Colombia: new quote shows an empty first step without asking; the summary address then leads there', async ({
    page,
  }) => {
    const dialogs = countDialogs(page);
    await reachSummary(page, 'co');
    await pay(page, 'co');

    await page.getByRole('button', { name: CO.newQuote }).click();

    await expect(heading(page)).toHaveText(SEEDED_STEPS.co[0]);
    await expect(heading(page)).toBeFocused();
    await expect(page).toHaveURL(/\/co\/tus-datos-y-tu-vehiculo$/);
    await expect(page.getByRole('navigation', { name: 'Paso 1 de 3' })).toBeVisible();
    await expect(page.getByLabel('Número de documento')).toHaveValue('');
    await expect(page.getByLabel('Placa')).toHaveValue('');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    expect(dialogs()).toBe(0);

    await page.goto('/co/resumen-y-pago');
    await expect(heading(page)).toHaveText(SEEDED_STEPS.co[0]);
    await expect(page).toHaveURL(/\/co\/tus-datos-y-tu-vehiculo$/);
  });

  test('AC-088 Chile: the summary address with complete data shows the summary; in a new tab it leads to the first step', async ({
    page,
    context,
  }) => {
    await reachSummary(page, 'cl');
    await page.goto('/cl');
    await expect(heading(page)).toHaveText(SEEDED_STEPS.cl[0]);

    await page.goto('/cl/resumen-y-pago');

    await expect(heading(page)).toHaveText(SUMMARY_STEP);
    await expect(termsCheckbox(page, 'cl')).not.toBeChecked();
    await expect(page.getByRole('alert')).toHaveCount(0);
    const other = await context.newPage();
    await other.goto('/cl/resumen-y-pago');
    await expect(heading(other)).toHaveText(SEEDED_STEPS.cl[0]);
  });

  test('AC-089 Colombia: reloading or leaving the summary with the terms accepted never asks', async ({
    page,
  }) => {
    const dialogs = countDialogs(page);
    await reachSummary(page, 'co');
    await termsCheckbox(page, 'co').check();

    await page.reload();
    await expect(heading(page)).toHaveText(SUMMARY_STEP);
    await expect(termsCheckbox(page, 'co')).not.toBeChecked();

    await backLink(page).click();
    await expect(heading(page)).toHaveText(PLAN_STEP);
    await expect(priceStatus(page, 'Plan Clásico')).toContainText(SEEDED_PLAN_COPY.co.finalPrice);
    await page.goBack();
    await expect(heading(page)).toHaveText(SUMMARY_STEP);
    await page.goto('/cl');
    await expect(heading(page)).toHaveText(SEEDED_STEPS.cl[0]);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    expect(dialogs()).toBe(0);
  });
});
