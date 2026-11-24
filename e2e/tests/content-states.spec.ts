import { expect, test } from './fixtures.js';
import { FALLBACK, heading, SEEDED_STEPS } from './support/wizard.js';

const CMS_REQUESTS = '**/api/**';
const PLAN_REQUESTS = '**/api/plans?**';
const TERMS_REQUESTS = '**/api/terms?**';

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

  for (const code of ['co', 'cl'] as const) {
    test(`AC-059 ${code} shows the unavailable message when the plans request fails and retry loads the wizard`, async ({
      page,
    }) => {
      await page.route(PLAN_REQUESTS, (route) => route.abort('connectionrefused'));
      await page.goto(`/${code}`);

      await expect(page.getByRole('alert')).toContainText(FALLBACK.unavailable);
      await expect(page.getByRole('textbox')).toHaveCount(0);
      await expect(page.getByRole('heading')).toHaveCount(0);

      await page.unroute(PLAN_REQUESTS);
      await page.getByRole('button', { name: FALLBACK.retry }).click();
      await expect(heading(page)).toHaveText(SEEDED_STEPS[code][0]);
    });
  }

  test('AC-059 an HTTP error on the plans request shows the unavailable message on the plan address', async ({
    page,
  }) => {
    await page.route(PLAN_REQUESTS, (route) => route.fulfill({ status: 503, body: 'error' }));
    await page.goto('/cl/elige-tu-plan');

    await expect(page.getByRole('alert')).toContainText(FALLBACK.unavailable);
    await expect(page.getByRole('article')).toHaveCount(0);
  });

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

  for (const code of ['co', 'cl'] as const) {
    test(`AC-077 ${code} shows the unavailable message when the terms request fails and retry loads the wizard`, async ({
      page,
    }) => {
      let termsRequests = 0;
      await page.route(TERMS_REQUESTS, (route) => {
        termsRequests += 1;
        const url = new URL(route.request().url());
        expect(url.searchParams.get('filters[country][code][$eq]')).toBe(code);
        return route.abort('connectionrefused');
      });
      await page.goto(`/${code}`);

      await expect(page.getByRole('alert')).toContainText(FALLBACK.unavailable);
      await expect(page.getByRole('heading')).toHaveCount(0);
      expect(termsRequests).toBeGreaterThan(0);

      await page.unroute(TERMS_REQUESTS);
      await page.getByRole('button', { name: FALLBACK.retry }).click();
      await expect(heading(page)).toHaveText(SEEDED_STEPS[code][0]);
    });
  }

  test('AC-077 an HTTP error on the terms request shows the unavailable message on the summary address', async ({
    page,
  }) => {
    await page.route(TERMS_REQUESTS, (route) => route.fulfill({ status: 500, body: 'error' }));
    await page.goto('/co/resumen-y-pago');

    await expect(page.getByRole('alert')).toContainText(FALLBACK.unavailable);
    await expect(page.getByRole('checkbox')).toHaveCount(0);
  });
});
