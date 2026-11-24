import { expect, test } from './fixtures.js';
import { CMS_URL } from './support/strapi-admin.js';

/** Answers that mean the public role cannot use an endpoint (P4). */
const NOT_USABLE = [403, 404, 405];

test.describe('public access to Strapi', () => {
  test('AC-001 AC-004 the public role reads the wizard content', async ({ request }) => {
    for (const path of ['/api/countries', '/api/wizard-steps', '/api/form-fields']) {
      const response = await request.get(`${CMS_URL}${path}`);
      expect(response.status(), path).toBe(200);
    }
  });

  test('AC-001 the public role cannot register accounts or use any other endpoint', async ({
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
    ];
    for (const response of await Promise.all(attempts)) {
      expect(NOT_USABLE, `${response.url()} answered ${response.status()}`).toContain(
        response.status(),
      );
    }
  });
});
