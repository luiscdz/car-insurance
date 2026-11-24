import { expect, test } from './fixtures.js';
import type { Page } from '@playwright/test';
import { FALLBACK, heading, SEEDED_COPY, SEEDED_STEPS } from './support/wizard.js';

const FIRST_FIELD = { co: 'Placa', cl: 'RUT' } as const;

/** Opens a country from the root so the root stays in the tab's history. */
async function openFromRoot(
  page: Page,
  name: 'Colombia' | 'Chile',
  code: 'co' | 'cl',
): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name }).click();
  await expect(heading(page)).toHaveText(SEEDED_STEPS[code][0]);
}

async function typeUnconfirmed(page: Page, code: 'co' | 'cl'): Promise<void> {
  const field = page.getByLabel(FIRST_FIELD[code]);
  await field.click();
  await page.keyboard.type('AB1');
}

for (const [name, code] of [
  ['Colombia', 'co'],
  ['Chile', 'cl'],
] as const) {
  test.describe(`leave confirmation in ${name}`, () => {
    test(`AC-033 reloading with unconfirmed values asks the browser; staying keeps them, leaving loses them`, async ({
      page,
    }) => {
      await openFromRoot(page, name, code);
      await typeUnconfirmed(page, code);
      const url = page.url();

      const stay = page.waitForEvent('dialog');
      const reload = page.reload({ timeout: 3_000 }).catch(() => undefined);
      const asked = await stay;
      expect(asked.type()).toBe('beforeunload');
      await asked.dismiss();
      await reload;
      expect(page.url()).toBe(url);
      await expect(page.getByLabel(FIRST_FIELD[code])).toHaveValue('AB1');

      page.once('dialog', (dialog) => void dialog.accept());
      await page.reload();
      await expect(heading(page)).toHaveText(SEEDED_STEPS[code][0]);
      await expect(page.getByLabel(FIRST_FIELD[code])).toHaveValue('');
    });

    test(`AC-033 closing the tab with unconfirmed values asks the browser; without values it does not`, async ({
      context,
    }) => {
      const page = await context.newPage();
      await openFromRoot(page, name, code);
      await typeUnconfirmed(page, code);
      const asked = page.waitForEvent('dialog');
      await page.close({ runBeforeUnload: true });
      const dialog = await asked;
      expect(dialog.type()).toBe('beforeunload');
      await dialog.dismiss();
      await expect(page.getByLabel(FIRST_FIELD[code])).toHaveValue('AB1');

      const clean = await context.newPage();
      await openFromRoot(clean, name, code);
      let dialogs = 0;
      clean.on('dialog', () => (dialogs += 1));
      await clean.close({ runBeforeUnload: true });
      await expect.poll(() => clean.isClosed()).toBe(true);
      expect(dialogs).toBe(0);
    });

    test(`AC-033 reloading without unconfirmed values does not ask`, async ({ page }) => {
      let dialogs = 0;
      page.on('dialog', async (dialog) => {
        dialogs += 1;
        await dialog.accept();
      });
      await openFromRoot(page, name, code);
      await page.getByLabel(FIRST_FIELD[code]).click();

      await page.reload();

      await expect(heading(page)).toHaveText(SEEDED_STEPS[code][0]);
      expect(dialogs).toBe(0);
    });

    test(`AC-034 going back to the root from the first step asks with the country copy; stay and Escape keep the step`, async ({
      page,
    }) => {
      await openFromRoot(page, name, code);
      await typeUnconfirmed(page, code);
      const field = page.getByLabel(FIRST_FIELD[code]);
      const stepUrl = page.url();

      await page.goBack();
      const dialog = page.getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await expect(page.getByRole('button', { name: SEEDED_COPY[code].leaveStay })).toBeFocused();
      await page.getByRole('button', { name: SEEDED_COPY[code].leaveStay }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page).toHaveURL(stepUrl);
      await expect(field).toHaveValue('AB1');
      await expect(field).toBeFocused();

      await page.goBack();
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(page).toHaveURL(stepUrl);
      await expect(field).toHaveValue('AB1');

      await page.goBack();
      await page.getByRole('button', { name: SEEDED_COPY[code].leaveConfirm, exact: true }).click();
      await expect(heading(page)).toHaveText(FALLBACK.heading);
      await page.goForward();
      await expect(page.getByLabel(FIRST_FIELD[code])).toHaveValue('');
    });

    test(`AC-034 moving through history to the other country asks with its copy; leave proceeds`, async ({
      page,
    }) => {
      const other = code === 'co' ? (['Chile', 'cl'] as const) : (['Colombia', 'co'] as const);
      await page.goto(`/${other[1]}`);
      await expect(heading(page)).toHaveText(SEEDED_STEPS[other[1]][0]);
      // Reach the root within the same page, as the browser back button of an earlier visit
      // would, so the other country stays in this page's history.
      await page.evaluate(() => {
        history.pushState(null, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
      });
      await expect(heading(page)).toHaveText(FALLBACK.heading);
      await page.getByRole('link', { name }).click();
      await expect(heading(page)).toHaveText(SEEDED_STEPS[code][0]);
      await typeUnconfirmed(page, code);

      await page.evaluate(() => history.go(-2));
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expect(page.getByRole('button', { name: SEEDED_COPY[code].leaveStay })).toBeFocused();
      await page.getByRole('button', { name: SEEDED_COPY[code].leaveConfirm, exact: true }).click();

      await expect(heading(page)).toHaveText(SEEDED_STEPS[other[1]][0]);
      await expect(page).toHaveURL(new RegExp(`/${other[1]}/`));
    });

    test(`AC-034 without unconfirmed values leaving the wizard shows no dialog`, async ({
      page,
    }) => {
      await openFromRoot(page, name, code);

      await page.goBack();

      await expect(heading(page)).toHaveText(FALLBACK.heading);
      await expect(page.getByRole('alertdialog')).toHaveCount(0);
    });
  });
}
