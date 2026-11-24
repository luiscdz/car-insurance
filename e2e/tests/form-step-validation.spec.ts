import { expect, test } from './fixtures.js';
import { boundaries } from './support/dates.js';
import {
  activateContinue,
  continueButton,
  fillChilePersonal,
  fillChileVehicle,
  fillColombia,
  heading,
  openWizard,
  SEEDED_STEPS,
} from './support/wizard.js';

test.describe('form step validation', () => {
  test('AC-009 AC-011 Colombia stays on the step, shows every error and focuses the first invalid field', async ({
    page,
  }) => {
    await openWizard(page, 'co');
    await expect(continueButton(page)).toHaveAttribute('aria-disabled', 'true');

    await activateContinue(page);

    await expect(heading(page)).toHaveText(SEEDED_STEPS.co[0]);
    const documentType = page.getByLabel('Tipo de documento');
    await expect(documentType).toBeFocused();
    await expect(documentType).toHaveAttribute('aria-invalid', 'true');
    await expect(documentType).toHaveAccessibleDescription(/Selecciona un tipo de documento\./);
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(6);
    await expect(
      page.getByText('Ingresa una placa con tres letras y tres números, por ejemplo ABC123.'),
    ).toBeVisible();
  });

  test('AC-009 AC-011 Chile shows the configured message next to the field and enables continue when valid', async ({
    page,
  }) => {
    await openWizard(page, 'cl');
    const dates = await boundaries(page);
    const rut = page.getByLabel('RUT');
    await rut.fill('12345');
    await activateContinue(page);

    await expect(rut).toBeFocused();
    await expect(rut).toHaveAccessibleDescription(
      /Ingresa un RUT válido, por ejemplo 12\.345\.678-5\./,
    );
    await fillChilePersonal(page, dates.adult);
    await expect(continueButton(page)).toHaveAttribute('aria-disabled', 'false');
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);
  });

  test('AC-013 Colombia accepts the vehicle year limits and rejects the years outside them', async ({
    page,
  }) => {
    await openWizard(page, 'co');
    const { year, adult } = await boundaries(page);
    await fillColombia(page, adult, String(year - 20));
    const field = page.getByLabel('Año del vehículo');

    for (const [value, valid] of [
      [year - 20, true],
      [year + 1, true],
      [year - 21, false],
      [year + 2, false],
    ] as const) {
      await field.fill(String(value));
      await field.blur();
      await expect(field).toHaveAttribute('aria-invalid', String(!valid));
    }
    await field.fill(`${year - 1}.5`);
    await activateContinue(page);
    await expect(field).toBeFocused();
    await expect(heading(page)).toHaveText(SEEDED_STEPS.co[0]);
  });

  test('AC-013 Chile accepts the vehicle year limits and rejects the years outside them', async ({
    page,
  }) => {
    await openWizard(page, 'cl');
    const { year, adult } = await boundaries(page);
    await fillChilePersonal(page, adult);
    await activateContinue(page);
    await fillChileVehicle(page, String(year + 1));
    const field = page.getByLabel('Año del vehículo');
    await expect(continueButton(page)).toHaveAttribute('aria-disabled', 'false');

    await field.fill(String(year - 21));
    await field.blur();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await expect(continueButton(page)).toHaveAttribute('aria-disabled', 'true');
    await field.fill(String(year - 20));
    await expect(field).toHaveAttribute('aria-invalid', 'false');
  });

  for (const code of ['co', 'cl'] as const) {
    test(`AC-014 ${code} accepts a person who turns 18 today and rejects one who turns 18 tomorrow`, async ({
      page,
    }) => {
      await openWizard(page, code);
      const { eighteenToday, eighteenTomorrow } = await boundaries(page);
      const birth = page.getByLabel('Fecha de nacimiento');

      await birth.fill(eighteenTomorrow);
      await birth.blur();
      await expect(birth).toHaveAttribute('aria-invalid', 'true');
      await expect(birth).toHaveAccessibleDescription(/Debes tener 18 años o más\./);
      await birth.fill(eighteenToday);
      await expect(birth).toHaveAttribute('aria-invalid', 'false');
    });
  }
});
