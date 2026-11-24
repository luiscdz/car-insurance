import { expect, test } from './fixtures.js';
import type { Page } from '@playwright/test';
import { boundaries } from './support/dates.js';
import {
  activateContinue,
  backLink,
  fillChilePersonal,
  fillColombia,
  heading,
  openWizard,
} from './support/wizard.js';

interface Observed {
  readonly requests: string[];
  readonly console: string[];
}

function observe(page: Page): Observed {
  const observed: Observed = { requests: [], console: [] };
  page.on('request', (request) =>
    observed.requests.push(`${request.url()} ${request.postData() ?? ''}`),
  );
  page.on('console', (message) => observed.console.push(message.text()));
  return observed;
}

async function expectKeptInSessionStorageOnly(
  page: Page,
  observed: Observed,
  values: string[],
): Promise<void> {
  for (const value of values) {
    expect(page.url()).not.toContain(value);
    expect(observed.requests.filter((entry) => entry.includes(value))).toEqual([]);
    expect(observed.console.filter((entry) => entry.includes(value))).toEqual([]);
  }
  const storage = await page.evaluate(() => ({
    session: JSON.stringify(sessionStorage),
    local: JSON.stringify(localStorage),
    cookies: document.cookie,
  }));
  for (const value of values) {
    expect(storage.session).toContain(value);
    expect(storage.local).not.toContain(value);
    expect(storage.cookies).not.toContain(value);
  }
}

test.describe('entered data stays in the browser', () => {
  test('AC-026 Colombia: values never reach the address, Strapi requests or the console', async ({
    page,
  }) => {
    const observed = observe(page);
    await openWizard(page, 'co');
    const { adult, year } = await boundaries(page);
    await fillColombia(page, adult, String(year - 2));
    await activateContinue(page);
    await expect(heading(page)).toHaveText('Elige tu plan');
    await backLink(page).click();
    await expect(heading(page)).toHaveText('Tus datos y tu vehículo');

    await expectKeptInSessionStorageOnly(page, observed, ['1234567890', 'ABC123', adult]);
  });

  test('AC-026 Chile: values never reach the address, Strapi requests or the console', async ({
    page,
  }) => {
    const observed = observe(page);
    await openWizard(page, 'cl');
    const { adult } = await boundaries(page);
    await fillChilePersonal(page, adult);
    await activateContinue(page);
    await expect(heading(page)).toHaveText('Tu vehículo');
    await backLink(page).click();
    await expect(heading(page)).toHaveText('Tus datos');

    await expectKeptInSessionStorageOnly(page, observed, ['12.345.678-5', adult]);
  });
});
