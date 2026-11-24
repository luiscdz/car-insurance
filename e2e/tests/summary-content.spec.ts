import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import { birthDateForAge, vehicleYearForAge } from './support/dates.js';
import {
  calendarDate,
  type CountryCode,
  reachSummary,
  SEEDED_FORMAT,
  SEEDED_SUMMARY_COPY,
  SEEDED_TERMS,
  viewTermsButton,
} from './support/wizard.js';

/** The label and value pairs of a summary section, as terms and descriptions (AC-067). */
async function pairs(page: Page, title: string): Promise<[string, string][]> {
  const section = page.getByRole('region', { name: title });
  const rows = await section.locator('dl > div').all();
  const result: [string, string][] = [];
  for (const row of rows) {
    result.push([
      ((await row.locator('dt').textContent()) ?? '').trim(),
      ((await row.locator('dd').textContent()) ?? '').trim(),
    ]);
  }
  return result;
}

/** Ages used to reach the summary; the dates are derived on the browser's date. */
const AGES = { policyholder: 36, vehicle: 6 };

/** Complete identity document numbers `reachPlans` enters, and how the summary masks them. */
const DOCUMENT = {
  co: { label: 'Número de documento', full: '1234567890', masked: '••••••7890' },
  cl: { label: 'RUT', full: '12.345.678-5', masked: '••.•••.678-5' },
} as const;

for (const code of ['co', 'cl'] as const satisfies readonly CountryCode[]) {
  const copy = SEEDED_SUMMARY_COPY[code];
  const { locale } = SEEDED_FORMAT[code];

  test.describe(`summary content of ${code}`, () => {
    test(`AC-067 AC-069 AC-070 AC-094 AC-095 ${code} shows every section, the masked document, the plan and its final price`, async ({
      page,
    }) => {
      let quotesOnSummary = 0;
      const { plan, finalPrice } = await reachSummary(page, code, AGES);
      page.on('request', (request) => {
        if (request.url().endsWith('/api/quote/price')) {
          quotesOnSummary += 1;
        }
      });
      const birthDate = await calendarDate(
        page,
        await birthDateForAge(page, AGES.policyholder),
        locale,
      );
      const year = await vehicleYearForAge(page, AGES.vehicle);

      const headings = page.getByRole('heading', { level: 2 });
      if (code === 'co') {
        await expect(headings).toHaveText(['Tus datos y tu vehículo', copy.planHeading]);
        expect(await pairs(page, 'Tus datos y tu vehículo')).toEqual([
          ['Tipo de documento', 'Cédula de ciudadanía'],
          ['Número de documento', DOCUMENT.co.masked],
          ['Fecha de nacimiento', birthDate],
          ['Placa', 'ABC123'],
          ['Marca', 'Mazda'],
          ['Año del vehículo', year],
        ]);
      } else {
        await expect(headings).toHaveText(['Tus datos', 'Tu vehículo', copy.planHeading]);
        expect(await pairs(page, 'Tus datos')).toEqual([
          ['RUT', DOCUMENT.cl.masked],
          ['Fecha de nacimiento', birthDate],
        ]);
        expect(await pairs(page, 'Tu vehículo')).toEqual([
          ['Patente', 'BBBB12'],
          ['Marca', 'Toyota'],
          ['Año del vehículo', year],
        ]);
      }

      const planSection = page.getByRole('region', { name: copy.planHeading });
      await expect(planSection).toContainText(plan);
      await expect(planSection).toContainText(copy.finalPrice);
      await expect(planSection).toContainText(finalPrice);
      await expect(page.getByRole('article')).toHaveCount(0);
      expect(await page.content()).not.toContain(DOCUMENT[code].full);
      expect(quotesOnSummary).toBe(0);
    });

    test(`AC-073 AC-074 AC-094 AC-095 ${code} shows its seeded summary copy and its own terms as paragraphs`, async ({
      page,
    }) => {
      await reachSummary(page, code);

      await expect(page.getByRole('checkbox', { name: copy.acceptTerms })).not.toBeChecked();
      await expect(page.getByRole('button', { name: copy.pay })).toBeVisible();
      await expect(page.getByRole('link', { name: copy.changePlan })).toBeVisible();
      await viewTermsButton(page, code).click();

      const dialog = page.getByRole('dialog', { name: copy.termsTitle });
      await expect(dialog).toBeVisible();
      const paragraphs = dialog.locator('p');
      await expect(paragraphs).toHaveCount(SEEDED_TERMS[code].paragraphs);
      await expect(paragraphs.first()).toHaveText(SEEDED_TERMS[code].first);
      await expect(paragraphs.last()).toHaveText(SEEDED_TERMS[code].last);
      const other = SEEDED_TERMS[code === 'co' ? 'cl' : 'co'].first;
      await expect(dialog).not.toContainText(other);
    });
  });
}
