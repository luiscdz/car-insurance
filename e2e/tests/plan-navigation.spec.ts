import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import { birthDateForAge, vehicleYearForAge } from './support/dates.js';
import {
  activateContinue,
  backLink,
  chooseButton,
  continueButton,
  fillColombia,
  heading,
  openWizard,
  PLAN_STEP,
  price,
  PRICE_QUOTE_REQUESTS,
  priceStatus,
  reachPlans,
  SEEDED_PLAN_COPY,
  SEEDED_STEPS,
  SUMMARY_STEP,
} from './support/wizard.js';

/** Counts the price-quote requests the browser sends (AC-053). */
function countQuotes(page: Page): () => number {
  let count = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/api/quote/price') && request.method() === 'POST') {
      count += 1;
    }
  });
  return () => count;
}

async function expectChosen(page: Page, name: string): Promise<void> {
  await expect(heading(page)).toHaveText(PLAN_STEP);
  await expect(chooseButton(page, name)).toHaveAttribute('aria-pressed', 'true');
}

test.describe('plan step navigation', () => {
  test('AC-053 Chile keeps the choice going back, forward and reloading, and asks the price on every display', async ({
    page,
  }) => {
    const copy = SEEDED_PLAN_COPY.cl;
    const quotes = countQuotes(page);
    await reachPlans(page, 'cl');
    await chooseButton(page, 'Plan Full').click();
    await expect(priceStatus(page, 'Plan Full')).toContainText(copy.finalPrice);
    expect(quotes()).toBe(1);

    await backLink(page).click();
    await expect(heading(page)).toHaveText(SEEDED_STEPS.cl[1]);
    await activateContinue(page);
    await expectChosen(page, 'Plan Full');
    await expect(priceStatus(page, 'Plan Full')).toContainText(copy.finalPrice);
    expect(quotes()).toBe(2);

    await page.goBack();
    await expect(heading(page)).toHaveText(SEEDED_STEPS.cl[1]);
    await page.goForward();
    await expectChosen(page, 'Plan Full');
    await expect(priceStatus(page, 'Plan Full')).toContainText(copy.finalPrice);
    expect(quotes()).toBe(3);

    await page.reload();
    await expectChosen(page, 'Plan Full');
    await expect(priceStatus(page, 'Plan Full')).toContainText(copy.finalPrice);
    expect(quotes()).toBe(4);

    await continueButton(page).click();
    await expect(heading(page)).toHaveText(SUMMARY_STEP);
    await page.reload();
    await expect(heading(page)).toHaveText(SUMMARY_STEP);
    await expect(page).toHaveURL(/\/cl\/resumen-y-pago$/);
    await backLink(page).click();
    await expectChosen(page, 'Plan Full');
  });

  test('AC-053 the choice is kept per country and is gone in a new tab', async ({
    page,
    context,
  }) => {
    await reachPlans(page, 'cl');
    await chooseButton(page, 'Plan Premium').click();
    await expect(chooseButton(page, 'Plan Premium')).toHaveAttribute('aria-pressed', 'true');

    await reachPlans(page, 'co');
    await expect(page.getByRole('button', { pressed: true })).toHaveCount(0);

    const newTab = await context.newPage();
    await newTab.goto('/cl/elige-tu-plan');
    await expect(heading(newTab)).toHaveText(SEEDED_STEPS.cl[0]);
  });

  test('AC-054 Colombia: changed step 1 data keeps the plan and requires a new final price', async ({
    page,
  }) => {
    const copy = SEEDED_PLAN_COPY.co;
    await reachPlans(page, 'co', { policyholder: 30, vehicle: 3 });
    await chooseButton(page, 'Plan Básico').click();
    await expect(priceStatus(page, 'Plan Básico')).toHaveText(
      `${copy.finalPrice} ${await price(page, 'co', 1200000)}`,
    );
    await continueButton(page).click();
    await expect(heading(page)).toHaveText(SUMMARY_STEP);

    await page.route(PRICE_QUOTE_REQUESTS, (route) => route.abort('connectionrefused'));
    await page.goto('/co/tus-datos-y-tu-vehiculo');
    await page.getByLabel('Fecha de nacimiento').fill(await birthDateForAge(page, 22));
    await activateContinue(page);
    await expectChosen(page, 'Plan Básico');
    await expect(priceStatus(page, 'Plan Básico')).toContainText(copy.priceError);

    await page.goto('/co/resumen-y-pago');
    await expect(page).toHaveURL(/\/co\/elige-tu-plan$/);
    await expectChosen(page, 'Plan Básico');

    await page.unroute(PRICE_QUOTE_REQUESTS);
    await page.getByRole('button', { name: copy.retry }).click();
    await expect(priceStatus(page, 'Plan Básico')).toHaveText(
      `${copy.finalPrice} ${await price(page, 'co', 1380000)}`,
    );
  });

  test('AC-056 Colombia: direct entry to the plan and summary addresses leads to the first incomplete step', async ({
    page,
  }) => {
    await page.goto('/co/elige-tu-plan');
    await expect(page).toHaveURL(/\/co\/tus-datos-y-tu-vehiculo$/);
    await expect(page.getByRole('alert')).toHaveCount(0);

    await reachPlans(page, 'co');
    await page.goto('/co/resumen-y-pago');

    await expect(page).toHaveURL(/\/co\/elige-tu-plan$/);
    await expect(heading(page)).toHaveText(PLAN_STEP);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('AC-057 Colombia: reloading and leaving the plan step with a chosen plan never asks', async ({
    page,
  }) => {
    let dialogs = 0;
    page.on('dialog', async (dialog) => {
      dialogs += 1;
      await dialog.dismiss();
    });
    await page.goto('/');
    await page.getByRole('link', { name: 'Colombia' }).click();
    await reachPlansFromForm(page);
    await chooseButton(page, 'Plan Clásico').click();
    await expect(chooseButton(page, 'Plan Clásico')).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expectChosen(page, 'Plan Clásico');
    await backLink(page).click();
    await expect(heading(page)).toHaveText(SEEDED_STEPS.co[0]);
    await page.goBack();
    await expectChosen(page, 'Plan Clásico');
    await page.goBack();
    await expect(heading(page)).toHaveText(SEEDED_STEPS.co[0]);
    await page.goBack();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    expect(dialogs).toBe(0);
    await openWizard(page, 'co');
    await page.goto('/co/elige-tu-plan');
    await expectChosen(page, 'Plan Clásico');
  });
});

/** Fills Colombia's form step from where it is shown and continues to the plan step. */
async function reachPlansFromForm(page: Page): Promise<void> {
  await expect(heading(page)).toHaveText(SEEDED_STEPS.co[0]);
  await fillColombia(page, await birthDateForAge(page, 40), await vehicleYearForAge(page, 3));
  await activateContinue(page);
  await expect(heading(page)).toHaveText(PLAN_STEP);
}
