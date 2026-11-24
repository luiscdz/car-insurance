import { expect, test } from './fixtures.js';
import {
  activateContinue,
  continueButton,
  fillChilePersonal,
  heading,
  openWizard,
  SEEDED_STEPS,
} from './support/wizard.js';
import { boundaries } from './support/dates.js';

function fieldLabels(page: import('@playwright/test').Page) {
  return page.locator('main form label');
}

test.describe('form step content', () => {
  test('AC-004 AC-031 Colombia shows its seeded steps and exactly its fields in order', async ({
    page,
  }) => {
    await openWizard(page, 'co');

    await expect(page.getByRole('navigation').getByRole('listitem')).toHaveText(
      SEEDED_STEPS.co.map((title, index) => new RegExp(`${index + 1}\\s*${title}`)),
    );
    await expect(fieldLabels(page)).toHaveText([
      /^Tipo de documento\s*\*$/,
      /^Número de documento\s*\*$/,
      /^Fecha de nacimiento\s*\*$/,
      /^Placa\s*\*$/,
      /^Marca\s*\*$/,
      /^Año del vehículo\s*\*$/,
    ]);
    for (const label of [
      'Tipo de documento',
      'Número de documento',
      'Fecha de nacimiento',
      'Placa',
      'Marca',
      'Año del vehículo',
    ]) {
      const control = page.getByLabel(label);
      await expect(control).toHaveAttribute('aria-required', 'true');
      await expect(control).toHaveAccessibleDescription(/\S/);
    }
    await expect(page.getByLabel('RUT')).toHaveCount(0);
  });

  test('AC-004 AC-032 Chile shows its two form steps with their fields in order', async ({
    page,
  }) => {
    await openWizard(page, 'cl');
    const dates = await boundaries(page);

    await expect(page.getByRole('navigation').getByRole('listitem')).toHaveText(
      SEEDED_STEPS.cl.map((title, index) => new RegExp(`${index + 1}\\s*${title}`)),
    );
    await expect(fieldLabels(page)).toHaveText([/^RUT\s*\*$/, /^Fecha de nacimiento\s*\*$/]);
    await expect(page.getByLabel('Placa')).toHaveCount(0);

    await fillChilePersonal(page, dates.adult);
    await activateContinue(page);
    await expect(heading(page)).toHaveText('Tu vehículo');
    await expect(fieldLabels(page)).toHaveText([
      /^Patente\s*\*$/,
      /^Marca\s*\*$/,
      /^Año del vehículo\s*\*$/,
    ]);
    for (const label of ['Patente', 'Marca', 'Año del vehículo']) {
      await expect(page.getByLabel(label)).toHaveAttribute('aria-required', 'true');
      await expect(page.getByLabel(label)).toHaveAccessibleDescription(/\S/);
    }
  });

  test('AC-006 AC-031 the Colombian document type and makes offer their configured options, none chosen', async ({
    page,
  }) => {
    await openWizard(page, 'co');

    const documentType = page.getByLabel('Tipo de documento');
    await expect(documentType).toHaveValue('');
    await expect(documentType.locator('option:not([disabled])')).toHaveText([
      'Cédula de ciudadanía',
      'Cédula de extranjería',
    ]);
    const makes = page.getByLabel('Marca').locator('option:not([disabled])');
    await expect(makes).toHaveText(['Chevrolet', 'Renault', 'Mazda', 'Kia']);
  });

  test('AC-006 AC-032 the Chilean makes are the makes configured for Chile', async ({ page }) => {
    await openWizard(page, 'cl');
    await fillChilePersonal(page, (await boundaries(page)).adult);
    await activateContinue(page);

    await expect(page.getByLabel('Marca')).toHaveValue('');
    await expect(page.getByLabel('Marca').locator('option:not([disabled])')).toHaveText([
      'Toyota',
      'Hyundai',
      'Suzuki',
      'Chevrolet',
    ]);
  });

  test('AC-031 Colombian document number and plate formats accept letters in either case', async ({
    page,
  }) => {
    await openWizard(page, 'co');
    const plate = page.getByLabel('Placa');
    const number = page.getByLabel('Número de documento');

    for (const value of ['abc123', 'ABC123']) {
      await plate.fill(value);
      await plate.blur();
      await expect(plate).toHaveAttribute('aria-invalid', 'false');
    }
    await plate.fill('AB1234');
    await plate.blur();
    await expect(plate).toHaveAttribute('aria-invalid', 'true');
    await number.fill('12345');
    await number.blur();
    await expect(number).toHaveAttribute('aria-invalid', 'true');
    await number.fill('123456');
    await expect(number).toHaveAttribute('aria-invalid', 'false');
  });

  test('AC-032 the Chilean RUT and licence plate accept their formats, K and letters in either case', async ({
    page,
  }) => {
    await openWizard(page, 'cl');
    const rut = page.getByLabel('RUT');

    for (const value of ['12.345.678-5', '12345678-K', '1.234.567-k']) {
      await rut.fill(value);
      await rut.blur();
      await expect(rut).toHaveAttribute('aria-invalid', 'false');
    }
    await rut.fill('123456-5');
    await rut.blur();
    await expect(rut).toHaveAttribute('aria-invalid', 'true');

    await fillChilePersonal(page, (await boundaries(page)).adult);
    await activateContinue(page);
    const plate = page.getByLabel('Patente');
    for (const value of ['bbbb12', 'AB1234']) {
      await plate.fill(value);
      await plate.blur();
      await expect(plate).toHaveAttribute('aria-invalid', 'false');
    }
    await plate.fill('ABC123');
    await plate.blur();
    await expect(plate).toHaveAttribute('aria-invalid', 'true');
    await expect(continueButton(page)).toHaveAttribute('aria-disabled', 'true');
  });
});
