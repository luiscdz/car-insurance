import { expect, test } from './fixtures.js';
import { FALLBACK, heading, SEEDED_STEPS } from './support/wizard.js';

test.describe('country selection', () => {
  test('AC-001 the root offers each published country by its Strapi name with fallback heading and title', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(heading(page)).toHaveText(FALLBACK.heading);
    await expect(page).toHaveTitle(FALLBACK.pageTitle);
    const links = page.getByRole('main').getByRole('link');
    await expect(links).toHaveText(['Chile', 'Colombia']);
  });

  for (const [name, code] of [
    ['Colombia', 'co'],
    ['Chile', 'cl'],
  ] as const) {
    test(`AC-001 choosing ${name} opens the first step of its wizard at /${code}`, async ({
      page,
    }) => {
      await page.goto('/');
      await page.getByRole('link', { name }).click();

      await expect(heading(page)).toHaveText(SEEDED_STEPS[code][0]);
      await expect(page).toHaveURL(new RegExp(`/${code}/[a-z0-9-]+$`));
      await expect(page).toHaveTitle(`${SEEDED_STEPS[code][0]} – ${name}`);
    });
  }

  for (const address of ['/xx', '/CO', '/xx/tus-datos']) {
    test(`AC-002 ${address} shows that the country is not available with a link to the root`, async ({
      page,
    }) => {
      await page.goto(address);

      await expect(page.getByRole('alert')).toContainText(FALLBACK.countryNotAvailable);
      await expect(page.getByRole('textbox')).toHaveCount(0);
      await expect(page.getByRole('heading')).toHaveCount(0);
      await page.getByRole('link', { name: FALLBACK.chooseCountry }).click();
      await expect(heading(page)).toHaveText(FALLBACK.heading);
    });
  }
});
