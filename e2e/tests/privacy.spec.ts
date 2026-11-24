import { expect, test } from './fixtures.js';
import type { Page } from '@playwright/test';
import { birthDateForAge, boundaries, vehicleYearForAge } from './support/dates.js';
import {
  activateContinue,
  backLink,
  chooseButton,
  type CountryCode,
  fillChilePersonal,
  fillColombia,
  heading,
  openWizard,
  priceStatus,
  reachPlans,
  SEEDED_PLAN_COPY,
  SEEDED_PLANS,
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

/** Values each country's seeded form steps receive from `reachPlans` (P5, fictitious). */
const ENTERED = {
  co: ['1234567890', 'ABC123'],
  cl: ['12.345.678-5', 'BBBB12'],
} as const;

interface SentRequest {
  readonly url: string;
  readonly method: string;
  readonly body: string;
  readonly authorization: string | undefined;
}

function recordRequests(page: Page): SentRequest[] {
  const sent: SentRequest[] = [];
  page.on('request', (request) =>
    sent.push({
      url: request.url(),
      method: request.method(),
      body: request.postData() ?? '',
      authorization: request.headers()['authorization'],
    }),
  );
  return sent;
}

for (const code of ['co', 'cl'] as const satisfies readonly CountryCode[]) {
  test(`AC-046 AC-066 ${code}: the price request carries only the country, the plan and the two ages, without a token`, async ({
    page,
  }) => {
    const sent = recordRequests(page);
    const console: string[] = [];
    page.on('console', (message) => console.push(message.text()));
    await reachPlans(page, code, { policyholder: 33, vehicle: 4 });
    const birthDate = await birthDateForAge(page, 33);
    const year = await vehicleYearForAge(page, 4);
    const [plan] = SEEDED_PLANS[code];

    await chooseButton(page, plan.name).click();
    await expect(priceStatus(page, plan.name)).toContainText(SEEDED_PLAN_COPY[code].finalPrice);

    const quotes = sent.filter((request) => request.url.endsWith('/api/quote/price'));
    expect(quotes).toHaveLength(1);
    const body = JSON.parse(quotes[0]?.body ?? '{}') as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['country', 'plan', 'policyholderAge', 'vehicleAge']);
    expect(body).toMatchObject({ country: code, policyholderAge: 33, vehicleAge: 4 });
    expect(new URL(quotes[0]?.url ?? '').search).toBe('');

    const toStrapi = sent.filter((request) => request.url.includes('/api/'));
    for (const value of [...ENTERED[code], birthDate, year]) {
      const leaks = toStrapi.filter(
        (request) =>
          request.url.includes(value) ||
          (request.body !== '' &&
            !request.url.endsWith('/api/quote/price') &&
            request.body.includes(value)),
      );
      expect(leaks, value).toEqual([]);
      expect(page.url()).not.toContain(value);
      expect(console.filter((line) => line.includes(value))).toEqual([]);
    }
    const planReads = toStrapi.filter((request) => request.url.includes('/api/plans'));
    expect(planReads.length).toBeGreaterThan(0);
    for (const request of [...planReads, ...quotes]) {
      expect(request.authorization, request.url).toBeUndefined();
    }
  });
}
