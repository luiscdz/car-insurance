import { expect, test } from './fixtures.js';
import {
  activateContinue,
  chooseButton,
  continueButton,
  heading,
  planCard,
  PLAN_STEP,
  price,
  PRICE_QUOTE_REQUESTS,
  priceStatus,
  reachPlans,
  SEEDED_PLAN_COPY,
  SUMMARY_STEP,
} from './support/wizard.js';

/** Step 1 data with a known adjustment and the final price it gives (AC-043, AC-045). */
const KNOWN_PRICES = {
  co: {
    ages: { policyholder: 22, vehicle: 8 },
    plan: 'Plan Básico',
    other: 'Plan Global',
    final: 1500000,
  },
  cl: {
    ages: { policyholder: 70, vehicle: 15 },
    plan: 'Plan Esencial',
    other: 'Plan Premium',
    final: 455000,
  },
} as const;

for (const code of ['co', 'cl'] as const) {
  const known = KNOWN_PRICES[code];
  const copy = SEEDED_PLAN_COPY[code];

  test.describe(`plan selection in ${code}`, () => {
    test(`AC-045 AC-064 AC-065 the chosen plan of ${code} shows its final price from the marked step 1 data`, async ({
      page,
    }) => {
      await reachPlans(page, code, known.ages);

      await chooseButton(page, known.plan).click();

      await expect(priceStatus(page, known.plan)).toHaveText(
        `${copy.finalPrice} ${await price(page, code, known.final)}`,
      );
      await expect(planCard(page, known.plan)).toContainText(copy.basePrice);
      await expect(priceStatus(page, known.other)).toBeEmpty();
    });

    test(`AC-048 in ${code} one plan is chosen at a time; the previous one loses its mark and price`, async ({
      page,
    }) => {
      await reachPlans(page, code, known.ages);

      await chooseButton(page, known.plan).click();
      await expect(chooseButton(page, known.plan)).toHaveAttribute('aria-pressed', 'true');
      await expect(chooseButton(page, known.plan)).toContainText(copy.chosen);
      await expect(priceStatus(page, known.plan)).toContainText(copy.finalPrice);
      const stored = await page.evaluate((key) => sessionStorage.getItem(key), `wizard:${code}`);
      expect(JSON.parse(stored ?? '{}').plan.id).toBeTruthy();

      await chooseButton(page, known.other).click();

      await expect(page.getByRole('button', { pressed: true })).toHaveCount(1);
      await expect(chooseButton(page, known.other)).toHaveAttribute('aria-pressed', 'true');
      await expect(chooseButton(page, known.plan)).toHaveAttribute('aria-pressed', 'false');
      await expect(chooseButton(page, known.plan)).toContainText(copy.choose);
      await expect(priceStatus(page, known.plan)).toBeEmpty();
      await expect(priceStatus(page, known.other)).toContainText(copy.finalPrice);
    });

    test(`AC-050 in ${code} continue moves to the summary step with its address, heading and progress`, async ({
      page,
    }) => {
      await reachPlans(page, code, known.ages);
      await chooseButton(page, known.plan).click();
      await expect(priceStatus(page, known.plan)).toContainText(copy.finalPrice);

      await continueButton(page).click();

      await expect(page).toHaveURL(new RegExp(`/${code}/resumen-y-pago$`));
      await expect(heading(page)).toHaveText(SUMMARY_STEP);
      await expect(heading(page)).toBeFocused();
      await expect(page.locator('[aria-current="step"]')).toContainText(SUMMARY_STEP);
      const stored = await page.evaluate((key) => sessionStorage.getItem(key), `wizard:${code}`);
      expect(JSON.parse(stored ?? '{}').plan.finalPrice).toBe(known.final);
    });
  });
}

test('AC-047 Colombia: a failed final price shows the error with retry, stays, and retry recovers', async ({
  page,
}) => {
  const copy = SEEDED_PLAN_COPY.co;
  await reachPlans(page, 'co', KNOWN_PRICES.co.ages);
  await page.route(PRICE_QUOTE_REQUESTS, (route) => route.abort('connectionrefused'));

  await chooseButton(page, 'Plan Básico').click();

  await expect(priceStatus(page, 'Plan Básico')).toContainText(copy.priceError);
  await expect(chooseButton(page, 'Plan Básico')).toHaveAttribute('aria-pressed', 'true');
  await activateContinue(page);
  await expect(page).toHaveURL(/\/co\/elige-tu-plan$/);
  await expect(page.getByRole('button', { name: copy.retry })).toBeFocused();

  await page.unroute(PRICE_QUOTE_REQUESTS);
  await page.getByRole('button', { name: copy.retry }).click();

  await expect(priceStatus(page, 'Plan Básico')).toHaveText(
    `${copy.finalPrice} ${await price(page, 'co', KNOWN_PRICES.co.final)}`,
  );
});

test('AC-051 Chile: continue without a plan shows the message, focuses the first plan and stays', async ({
  page,
}) => {
  const copy = SEEDED_PLAN_COPY.cl;
  await reachPlans(page, 'cl');
  await expect(continueButton(page)).toHaveAttribute('aria-disabled', 'true');

  await activateContinue(page);

  await expect(page.getByRole('alert')).toHaveText(copy.choosePlan);
  await expect(page.getByRole('group', { name: PLAN_STEP })).toHaveAccessibleDescription(
    copy.choosePlan,
  );
  await expect(chooseButton(page, 'Plan Esencial')).toBeFocused();
  await expect(page).toHaveURL(/\/cl\/elige-tu-plan$/);

  await chooseButton(page, 'Plan Full').click();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
