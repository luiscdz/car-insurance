import { expect, test } from './fixtures.js';
import {
  chooseButton,
  type CountryCode,
  planCard,
  price,
  reachPlans,
  SEEDED_PLAN_COPY,
  SEEDED_PLANS,
} from './support/wizard.js';

const OTHER: Record<CountryCode, CountryCode> = { co: 'cl', cl: 'co' };

for (const code of ['co', 'cl'] as const) {
  test.describe(`plan list content of ${code}`, () => {
    const copy = SEEDED_PLAN_COPY[code];
    const plans = SEEDED_PLANS[code];

    test(`AC-036 AC-064 AC-065 shows only the published, active plans of ${code}, in configured order`, async ({
      page,
    }) => {
      await reachPlans(page, code);

      await expect(page.getByRole('article')).toHaveCount(plans.length);
      await expect(page.getByRole('article').getByRole('heading', { level: 2 })).toHaveText(
        plans.map((plan) => plan.name),
      );
      for (const other of SEEDED_PLANS[OTHER[code]]) {
        await expect(planCard(page, other.name)).toHaveCount(0);
      }
      await expect(page.getByRole('button', { pressed: true })).toHaveCount(0);
    });

    test(`AC-037 AC-042 AC-064 AC-065 each plan of ${code} shows its content and base price in the country format`, async ({
      page,
    }) => {
      await reachPlans(page, code);

      for (const plan of plans) {
        const card = planCard(page, plan.name);
        await expect(card.getByRole('heading', { level: 2 })).toHaveText(plan.name);
        await expect(card.locator('p').first()).not.toBeEmpty();
        await expect(card).toContainText(copy.basePrice);
        await expect(card).toContainText(await price(page, code, plan.basePrice));
        await expect(card.getByRole('heading', { name: copy.coverages })).toBeVisible();
        const coverages = card.getByRole('list').first().getByRole('listitem');
        expect(await coverages.count()).toBeGreaterThanOrEqual(2);
        expect(await coverages.locator('strong').count()).toBeGreaterThanOrEqual(1);
        await expect(card.getByRole('heading', { name: copy.benefits })).toHaveCount(
          plan.benefits > 0 ? 1 : 0,
        );
        if (plan.benefits > 0) {
          await expect(card.getByRole('list').nth(1).getByRole('listitem')).toHaveCount(
            plan.benefits,
          );
        }
        await expect(chooseButton(page, plan.name)).toHaveText(copy.choose);
      }
    });

    test(`AC-038 AC-042 only the recommended plan of ${code} shows the badge, and prices match Intl`, async ({
      page,
    }) => {
      await reachPlans(page, code);

      await expect(page.getByText(copy.recommended, { exact: true })).toHaveCount(1);
      for (const plan of plans) {
        const card = planCard(page, plan.name);
        await expect(card.getByText(copy.recommended, { exact: true })).toHaveCount(
          plan.recommended ? 1 : 0,
        );
        await expect(chooseButton(page, plan.name)).toHaveAccessibleDescription(
          new RegExp(`${plan.recommended ? `${copy.recommended}.*` : ''}${copy.basePrice}`),
        );
      }
      const [first] = plans;
      expect(await price(page, code, first.basePrice)).not.toMatch(/[,]\d{2}$|COP|CLP/);
    });
  });
}

test('AC-042 the seeded base prices read as the examples of each locale', async ({ page }) => {
  await reachPlans(page, 'co');
  await expect(planCard(page, 'Plan Básico')).toContainText(/\$\s?1\.200\.000/);
  await reachPlans(page, 'cl');
  await expect(planCard(page, 'Plan Esencial')).toContainText(/\$\s?350\.000/);
});
