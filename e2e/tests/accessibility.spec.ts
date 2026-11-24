import { expect, test } from './fixtures.js';
import type { Page } from '@playwright/test';
import { boundaries } from './support/dates.js';
import {
  activateContinue,
  fillChilePersonal,
  heading,
  openWizard,
  SEEDED_COPY,
  SEEDED_STEPS,
} from './support/wizard.js';

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function expectTargetsOfAtLeast24px(page: Page): Promise<void> {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('a, button, input, select')]
      .filter((element) => element.offsetParent !== null)
      .map((element) => ({
        element: element.outerHTML.slice(0, 80),
        box: element.getBoundingClientRect(),
      }))
      .filter(({ box }) => box.width < 24 || box.height < 24)
      .map(({ element }) => element),
  );
  expect(small).toEqual([]);
}

/** The form steps of each country: Colombia has one, Chile two. */
const FORM_STEPS = {
  co: [SEEDED_STEPS.co[0]],
  cl: [SEEDED_STEPS.cl[0], SEEDED_STEPS.cl[1]],
} as const;

for (const code of ['co', 'cl'] as const) {
  test.describe(`accessibility of ${code}`, () => {
    test(`AC-027 every form step passes the scan with and without errors displayed`, async ({
      page,
      expectNoAxeViolations,
    }) => {
      await openWizard(page, code);
      const { adult } = await boundaries(page);
      for (const [index, title] of FORM_STEPS[code].entries()) {
        await expect(heading(page)).toHaveText(title);
        await expectNoAxeViolations();
        await activateContinue(page);
        await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
        await expectNoAxeViolations();
        if (index + 1 < FORM_STEPS[code].length) {
          await fillChilePersonal(page, adult);
          await activateContinue(page);
        }
      }
    });

    test(`AC-027 the leave dialog passes the scan`, async ({ page, expectNoAxeViolations }) => {
      await page.goto('/');
      await page.getByRole('link', { name: code === 'co' ? 'Colombia' : 'Chile' }).click();
      await page.locator('main input').first().fill('1');
      await page.goBack();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expect(page.getByRole('button', { name: SEEDED_COPY[code].leaveStay })).toBeFocused();

      await expectNoAxeViolations();
    });

    for (const width of [320, 375]) {
      test(`AC-029 at ${width} px nothing scrolls horizontally and targets are at least 24 px, with and without errors`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await openWizard(page, code);
        await expectNoHorizontalOverflow(page);
        await expectTargetsOfAtLeast24px(page);

        await activateContinue(page);
        await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await expectTargetsOfAtLeast24px(page);
      });
    }
  });
}

test('AC-027 the root page passes the scan', async ({ page, expectNoAxeViolations }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Chile' })).toBeVisible();
  await expectNoAxeViolations();
});
