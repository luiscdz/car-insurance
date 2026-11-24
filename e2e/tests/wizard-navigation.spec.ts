import { expect, test } from './fixtures.js';
import { boundaries } from './support/dates.js';
import {
  activateContinue,
  backLink,
  expectStep,
  fillChilePersonal,
  fillChileVehicle,
  fillColombia,
  heading,
  openWizard,
} from './support/wizard.js';

test.describe('wizard navigation', () => {
  test('AC-019 Chile moves from "Tus datos" to "Tu vehículo" at its own address, focusing its heading', async ({
    page,
  }) => {
    await openWizard(page, 'cl');
    await fillChilePersonal(page, (await boundaries(page)).adult);

    await activateContinue(page);

    await expect(page).toHaveURL(/\/cl\/tu-vehiculo$/);
    await expect(heading(page)).toHaveText('Tu vehículo');
    await expect(heading(page)).toBeFocused();
    await expect(page.locator('[aria-current="step"]')).toContainText('Tu vehículo');
    await expect(page.getByRole('navigation', { name: 'Paso 2 de 4' })).toBeVisible();
  });

  test('AC-019 Colombia leaves its form step for the next configured step', async ({ page }) => {
    await openWizard(page, 'co');
    const { adult, year } = await boundaries(page);
    await fillColombia(page, adult, String(year - 3));

    await activateContinue(page);

    await expect(page).toHaveURL(/\/co\/elige-tu-plan$/);
    await expect(heading(page)).toHaveText('Elige tu plan');
    await expect(heading(page)).toBeFocused();
    await expect(page.locator('[aria-current="step"]')).toContainText('Elige tu plan');
  });

  test('AC-020 Chile keeps the values when going back with the back action and the browser', async ({
    page,
  }) => {
    await openWizard(page, 'cl');
    await expect(backLink(page)).toHaveCount(0);
    await fillChilePersonal(page, (await boundaries(page)).adult);
    await activateContinue(page);
    await expect(heading(page)).toHaveText('Tu vehículo');

    await backLink(page).click();
    await expect(heading(page)).toHaveText('Tus datos');
    await expect(page.getByLabel('RUT')).toHaveValue('12.345.678-5');
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);

    await activateContinue(page);
    await expect(heading(page)).toHaveText('Tu vehículo');
    await page.goBack();
    await expect(heading(page)).toHaveText('Tus datos');
    await expect(page.getByLabel('RUT')).toHaveValue('12.345.678-5');
  });

  test('AC-022 reloading keeps the step and the completed values', async ({ page }) => {
    await openWizard(page, 'cl');
    const { adult, year } = await boundaries(page);
    await fillChilePersonal(page, adult);
    await activateContinue(page);
    await expect(heading(page)).toHaveText('Tu vehículo');

    await page.reload();

    await expectStep(page, 'cl', 'Tu vehículo');
    await fillChileVehicle(page, String(year));
    await backLink(page).click();
    await expect(page.getByLabel('Fecha de nacimiento')).toHaveValue(adult);
  });

  test('AC-023 data is kept per country in the tab and a new tab starts empty', async ({
    page,
    context,
  }) => {
    await openWizard(page, 'co');
    const { adult, year } = await boundaries(page);
    await fillColombia(page, adult, String(year));
    await activateContinue(page);
    await expect(heading(page)).toHaveText('Elige tu plan');

    await openWizard(page, 'cl');
    await expect(page.getByLabel('RUT')).toHaveValue('');
    await expect(page.getByLabel('Fecha de nacimiento')).toHaveValue('');

    await openWizard(page, 'co');
    await expect(page.getByLabel('Placa')).toHaveValue('ABC123');
    await expect(page.getByLabel('Tipo de documento')).toHaveValue('cc');

    const newTab = await context.newPage();
    for (const code of ['co', 'cl'] as const) {
      await openWizard(newTab, code);
      await expect(newTab.getByLabel('Fecha de nacimiento')).toHaveValue('');
    }
  });

  test('AC-024 a later step address leads to the first step that is not complete, without errors', async ({
    page,
  }) => {
    await page.goto('/cl/tu-vehiculo');

    await expectStep(page, 'cl', 'Tus datos');
    await expect(page).toHaveURL(/\/cl\/tus-datos$/);
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);

    await page.goto('/co/elige-tu-plan');
    await expect(page).toHaveURL(/\/co\/tus-datos-y-tu-vehiculo$/);
  });

  test('AC-024 an unknown step address leads to the first step that is not complete', async ({
    page,
  }) => {
    await openWizard(page, 'cl');
    await fillChilePersonal(page, (await boundaries(page)).adult);
    await activateContinue(page);
    await expect(heading(page)).toHaveText('Tu vehículo');

    await page.goto('/cl/no-existe');

    await expect(page).toHaveURL(/\/cl\/tu-vehiculo$/);
    await expect(heading(page)).toHaveText('Tu vehículo');
  });

  test('AC-035 going back from "Tu vehículo" with typed values does not ask and discards them', async ({
    page,
  }) => {
    let dialogs = 0;
    page.on('dialog', async (dialog) => {
      dialogs += 1;
      await dialog.dismiss();
    });
    await openWizard(page, 'cl');
    const { adult, year } = await boundaries(page);
    await fillChilePersonal(page, adult);
    await activateContinue(page);
    await fillChileVehicle(page, String(year));

    await backLink(page).click();
    await expect(heading(page)).toHaveText('Tus datos');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByLabel('RUT')).toHaveValue('12.345.678-5');
    await activateContinue(page);
    await expect(page.getByLabel('Patente')).toHaveValue('');

    await page.getByLabel('Patente').fill('CCDD34');
    await page.goBack();
    await expect(heading(page)).toHaveText('Tus datos');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await page.goForward();
    await expect(heading(page)).toHaveText('Tu vehículo');
    await expect(page.getByLabel('Patente')).toHaveValue('');
    expect(dialogs).toBe(0);
  });
});
