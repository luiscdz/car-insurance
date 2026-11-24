import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import { type FieldData, StrapiAdmin } from './support/strapi-admin.js';
import { activateContinue, heading, openWizard } from './support/wizard.js';

/**
 * AC-007: content published in Strapi shows on the next load, with no code change or deployment,
 * and a draft never shows. Runs alone after the other projects because it changes the seeded
 * content; every field it creates is deleted afterwards, so the seed is left as it was.
 */
test.describe.configure({ mode: 'serial' });

const STEP_TITLE = 'Tus datos y tu vehículo';

const USAGE: FieldData = {
  name: 'uso-del-vehiculo',
  label: 'Uso del vehículo',
  type: 'select',
  required: false,
  placeholder: 'Selecciona el uso',
  helpText: 'Indica para qué usas el vehículo.',
  errorMessage: 'Selecciona el uso del vehículo.',
  order: 7,
  options: [
    { value: 'particular', label: 'Particular', order: 1 },
    { value: 'comercial', label: 'Comercial', order: 2 },
  ],
};

const PROMO_CODE: FieldData = {
  name: 'codigo-de-referido',
  label: 'Código de referido',
  type: 'text',
  required: false,
  helpText: 'Tres letras mayúsculas.',
  errorMessage: 'Ingresa un código de referido válido.',
  order: 8,
  validation: { pattern: '^[A-Z]{3}$' },
};

const DRAFT: FieldData = {
  name: 'campo-en-borrador',
  label: 'Campo solo en borrador',
  type: 'text',
  required: false,
  errorMessage: 'Revisa este campo.',
  order: 0,
};

let admin: StrapiAdmin;
const created = new Set<string>();

async function create(stepId: string, field: FieldData, publish: boolean): Promise<string> {
  const id = await admin.createField(stepId, field, publish);
  created.add(id);
  return id;
}

async function reload(page: Page): Promise<void> {
  await page.reload();
  await expect(heading(page)).toHaveText(STEP_TITLE);
}

function labels(page: Page) {
  return page.locator('main form label');
}

test.beforeAll(async () => {
  admin = await StrapiAdmin.connect();
});

test.afterAll(async () => {
  for (const id of created) {
    await admin.deleteField(id);
  }
});

test('AC-007 a published field shows in its position after a reload and a draft never shows', async ({
  page,
}) => {
  const stepId = await StrapiAdmin.stepId('co', 'tus-datos-y-tu-vehiculo');
  await openWizard(page, 'co');
  await expect(labels(page)).toHaveCount(6);

  await create(stepId, USAGE, true);
  await create(stepId, PROMO_CODE, true);
  await create(stepId, DRAFT, false);
  await reload(page);

  await expect(labels(page)).toHaveCount(8);
  await expect(labels(page).nth(6)).toHaveText(USAGE.label);
  await expect(labels(page).nth(7)).toHaveText(PROMO_CODE.label);
  await expect(page.getByLabel(USAGE.label)).toHaveAccessibleDescription(USAGE.helpText ?? '');
  await expect(page.getByLabel(USAGE.label).locator('option:not([disabled])')).toHaveText([
    'Particular',
    'Comercial',
  ]);
  await expect(page.getByLabel(DRAFT.label)).toHaveCount(0);
});

test('AC-007 changed order, label, help text, error message and options show after a reload', async ({
  page,
}) => {
  const [usageId] = [...created];
  if (!usageId) {
    throw new Error('The published field was not created');
  }
  await openWizard(page, 'co');

  await admin.publishField(usageId, {
    order: 0,
    label: 'Uso principal del vehículo',
    helpText: 'Elige el uso más frecuente.',
    errorMessage: 'Indica el uso principal.',
    required: true,
    options: [
      { value: 'mixto', label: 'Mixto', order: 1 },
      { value: 'particular', label: 'Particular', order: 2 },
      { value: 'comercial', label: 'Comercial con pasajeros', order: 3 },
    ],
  });
  await reload(page);

  await expect(labels(page).first()).toHaveText(/^Uso principal del vehículo\s*\*$/);
  const usage = page.getByLabel('Uso principal del vehículo');
  await expect(usage).toHaveAccessibleDescription('Elige el uso más frecuente.');
  await expect(usage.locator('option:not([disabled])')).toHaveText([
    'Mixto',
    'Particular',
    'Comercial con pasajeros',
  ]);
  await activateContinue(page);
  await expect(usage).toBeFocused();
  await expect(usage).toHaveAccessibleDescription(/Indica el uso principal\./);
  await expect(page.getByLabel(DRAFT.label)).toHaveCount(0);
});

test('AC-007 a changed validation applies after a reload', async ({ page }) => {
  const promoId = [...created][1];
  if (!promoId) {
    throw new Error('The published field was not created');
  }
  await openWizard(page, 'co');
  const promo = page.getByLabel(PROMO_CODE.label);
  await promo.fill('ABC');
  await promo.blur();
  await expect(promo).toHaveAttribute('aria-invalid', 'false');

  await admin.publishField(promoId, { validation: { pattern: '^[0-9]{4}$' } });
  await reload(page);

  await promo.fill('ABC');
  await promo.blur();
  await expect(promo).toHaveAttribute('aria-invalid', 'true');
  await promo.fill('1234');
  await expect(promo).toHaveAttribute('aria-invalid', 'false');
});

test('AC-007 deleted and unpublished fields no longer show after a reload', async ({ page }) => {
  const [usageId, promoId] = [...created];
  if (!usageId || !promoId) {
    throw new Error('The published fields were not created');
  }
  await openWizard(page, 'co');
  await expect(labels(page)).toHaveCount(8);

  await admin.deleteField(promoId);
  created.delete(promoId);
  await reload(page);
  await expect(labels(page)).toHaveCount(7);
  await expect(page.getByLabel(PROMO_CODE.label)).toHaveCount(0);

  await admin.unpublishField(usageId);
  await reload(page);
  await expect(labels(page)).toHaveCount(6);
  await expect(page.getByLabel('Uso principal del vehículo')).toHaveCount(0);
  await expect(page.getByLabel(DRAFT.label)).toHaveCount(0);
});
