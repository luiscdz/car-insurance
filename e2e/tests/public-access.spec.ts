import { expect, test } from './fixtures.js';
import { CMS_URL } from './support/strapi-admin.js';

/** Answers that mean the public role cannot use an endpoint (P4). */
const NOT_USABLE = [403, 404, 405];

test.describe('public access to Strapi', () => {
  test('AC-001 AC-004 AC-066 the public role reads the wizard content, plans included', async ({
    request,
  }) => {
    for (const path of ['/api/countries', '/api/wizard-steps', '/api/form-fields', '/api/plans']) {
      const response = await request.get(`${CMS_URL}${path}`);
      expect(response.status(), path).toBe(200);
    }
  });

  test('AC-001 AC-066 the public role cannot register accounts, write plans or use any other endpoint', async ({
    request,
  }) => {
    const attempts = [
      request.post(`${CMS_URL}/api/auth/local/register`, {
        data: { username: 'prueba', email: 'prueba@example.test', password: 'Prueba-1234' },
      }),
      request.post(`${CMS_URL}/api/auth/local`, {
        data: { identifier: 'prueba@example.test', password: 'Prueba-1234' },
      }),
      request.post(`${CMS_URL}/api/auth/forgot-password`, {
        data: { email: 'prueba@example.test' },
      }),
      request.get(`${CMS_URL}/api/auth/email-confirmation?confirmation=x`),
      request.get(`${CMS_URL}/api/users`),
      request.post(`${CMS_URL}/api/countries`, { data: { data: { code: 'pe', name: 'Perú' } } }),
      request.delete(`${CMS_URL}/api/form-fields/x`),
      request.post(`${CMS_URL}/api/plans`, { data: { data: { name: 'Plan Pirata' } } }),
      request.put(`${CMS_URL}/api/plans/x`, { data: { data: { basePrice: 1 } } }),
      request.delete(`${CMS_URL}/api/plans/x`),
      request.get(`${CMS_URL}/api/quote/price`),
    ];
    for (const response of await Promise.all(attempts)) {
      expect(NOT_USABLE, `${response.url()} answered ${response.status()}`).toContain(
        response.status(),
      );
    }
  });

  test('AC-066 the price quote answers without any token', async ({ request }) => {
    const plans = await request.get(
      `${CMS_URL}/api/plans?filters[country][code][$eq]=cl&filters[active][$eq]=true&sort[0]=order:asc`,
    );
    const [plan] = ((await plans.json()) as { data: { documentId: string }[] }).data;

    const response = await request.post(`${CMS_URL}/api/quote/price`, {
      data: { country: 'cl', plan: plan?.documentId, policyholderAge: 70, vehicleAge: 15 },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ data: { finalPrice: 455000 } });
  });

  test('AC-045 the price quote rejects malformed inputs and plans of another country', async ({
    request,
  }) => {
    const plans = await request.get(`${CMS_URL}/api/plans?filters[country][code][$eq]=co`);
    const [plan] = ((await plans.json()) as { data: { documentId: string }[] }).data;
    const quote = (data: object) => request.post(`${CMS_URL}/api/quote/price`, { data });

    expect((await quote({ country: 'cl', plan: plan?.documentId })).status()).toBe(404);
    expect((await quote({ country: 'co', plan: plan?.documentId, vehicleAge: 2.5 })).status()).toBe(
      400,
    );
    expect((await quote({ country: 'co', plan: plan?.documentId, basePrice: 1 })).status()).toBe(
      400,
    );
  });
});
