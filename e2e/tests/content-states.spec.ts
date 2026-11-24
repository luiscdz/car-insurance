import { expect, test } from './fixtures.js';
import { FALLBACK, heading, SEEDED_STEPS } from './support/wizard.js';

const CMS_REQUESTS = '**/api/**';

test.describe('content states', () => {
  for (const code of ['co', 'cl'] as const) {
    test(`AC-016 ${code} shows the unavailable message when Strapi fails and retry loads the form`, async ({
      page,
    }) => {
      await page.route(CMS_REQUESTS, (route) => route.abort('connectionrefused'));
      await page.goto(`/${code}`);

      await expect(page.getByRole('alert')).toContainText(FALLBACK.unavailable);
      await expect(page.getByRole('textbox')).toHaveCount(0);

      await page.unroute(CMS_REQUESTS);
      await page.getByRole('button', { name: FALLBACK.retry }).click();
      await expect(heading(page)).toHaveText(SEEDED_STEPS[code][0]);
    });
  }

  test('AC-016 the root shows the unavailable message on an HTTP error and recovers with retry', async ({
    page,
  }) => {
    await page.route(CMS_REQUESTS, (route) => route.fulfill({ status: 500, body: 'error' }));
    await page.goto('/');

    await expect(page.getByRole('alert')).toContainText(FALLBACK.unavailable);
    await expect(page.getByRole('alert')).not.toContainText('500');

    await page.unroute(CMS_REQUESTS);
    await page.getByRole('button', { name: FALLBACK.retry }).click();
    await expect(page.getByRole('link', { name: 'Chile' })).toBeVisible();
  });
});
