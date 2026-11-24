import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import { expectNoHorizontalOverflow, expectTargetsOfAtLeast24px } from './support/layout.js';
import {
  activateContinue,
  chooseButton,
  PLAN_STEP,
  PRICE_QUOTE_REQUESTS,
  priceStatus,
  reachPlans,
  SEEDED_PLAN_COPY,
  SEEDED_PLANS,
} from './support/wizard.js';

/** Position of each plan card, in display order. */
async function cardBoxes(page: Page) {
  const boxes = [];
  for (const card of await page.getByRole('article').all()) {
    const box = await card.boundingBox();
    if (!box) {
      throw new Error('A plan card is not visible');
    }
    boxes.push(box);
  }
  return boxes;
}

for (const code of ['co', 'cl'] as const) {
  const copy = SEEDED_PLAN_COPY[code];
  const [first, second] = SEEDED_PLANS[code];

  test.describe(`plan step accessibility of ${code}`, () => {
    test(`AC-060 ${code} passes the scan with no choice, the choose message, a final price and a price error`, async ({
      page,
      expectNoAxeViolations,
    }) => {
      await reachPlans(page, code);
      await expect(page.getByRole('group', { name: PLAN_STEP })).toBeVisible();
      await expect(chooseButton(page, first.name)).toHaveAccessibleName(
        `${copy.choose}: ${first.name}`,
      );
      await expectNoAxeViolations();

      await activateContinue(page);
      await expect(page.getByRole('alert')).toHaveText(copy.choosePlan);
      await expectNoAxeViolations();

      await chooseButton(page, second.name).click();
      await expect(priceStatus(page, second.name)).toContainText(copy.finalPrice);
      await expect(chooseButton(page, second.name)).toHaveAccessibleName(
        `${copy.chosen}: ${second.name}`,
      );
      await expect(chooseButton(page, second.name)).toHaveAccessibleDescription(
        new RegExp(`${copy.recommended}.*${copy.basePrice}.*${copy.finalPrice}`),
      );
      await expectNoAxeViolations();

      await page.route(PRICE_QUOTE_REQUESTS, (route) => route.abort('connectionrefused'));
      await chooseButton(page, first.name).click();
      await expect(priceStatus(page, first.name)).toContainText(copy.priceError);
      await expectNoAxeViolations();
    });

    test(`AC-062 ${code} shows the cards side by side at 1280 px and stacked at 375 px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await reachPlans(page, code);
      const wide = await cardBoxes(page);
      expect(new Set(wide.map((box) => Math.round(box.y))).size).toBe(1);
      expect(wide.map((box) => box.x)).toEqual([...wide.map((box) => box.x)].sort((a, b) => a - b));

      await page.setViewportSize({ width: 375, height: 812 });
      const narrow = await cardBoxes(page);
      expect(new Set(narrow.map((box) => Math.round(box.x))).size).toBe(1);
      expect(narrow.map((box) => box.y)).toEqual(
        [...narrow.map((box) => box.y)].sort((a, b) => a - b),
      );
      await expectTargetsOfAtLeast24px(page);
    });

    for (const width of [320, 375]) {
      test(`AC-062 ${code} at ${width} px has no horizontal scroll with and without a choice and messages`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await reachPlans(page, code);
        await expectNoHorizontalOverflow(page);
        await expectTargetsOfAtLeast24px(page);

        await activateContinue(page);
        await expect(page.getByRole('alert')).toBeVisible();
        await expectNoHorizontalOverflow(page);

        await chooseButton(page, first.name).click();
        await expect(priceStatus(page, first.name)).toContainText(copy.finalPrice);
        await expectNoHorizontalOverflow(page);
        await expectTargetsOfAtLeast24px(page);

        await page.route(PRICE_QUOTE_REQUESTS, (route) => route.abort('connectionrefused'));
        await chooseButton(page, second.name).click();
        await expect(priceStatus(page, second.name)).toContainText(copy.priceError);
        await expectNoHorizontalOverflow(page);
        await expectTargetsOfAtLeast24px(page);
      });
    }
  });
}
