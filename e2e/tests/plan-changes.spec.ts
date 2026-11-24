import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';
import { type PlanData, type PublishedPlan, StrapiAdmin } from './support/strapi-admin.js';
import {
  backLink,
  type CountryCode,
  heading,
  PLAN_STEP,
  price,
  reachPlans,
  SEEDED_PLAN_COPY,
  SEEDED_PLANS,
  SEEDED_STEPS,
} from './support/wizard.js';

/**
 * AC-036, AC-039 and AC-058: plans published, changed, deactivated or saved as drafts in Strapi
 * show on the next load, with no code change or deployment. Runs alone after AC-007 because it
 * changes the seeded plans; every plan it creates is deleted and every seeded plan it changes is
 * restored afterwards, so the seed is left as it was.
 */
test.describe.configure({ mode: 'serial' });

const CURRENCY: Record<CountryCode, string> = { co: 'COP', cl: 'CLP' };

function plan(code: CountryCode, name: string, overrides: Partial<PlanData> = {}): PlanData {
  return {
    name,
    description: 'Plan de prueba creado por la configuración del test.',
    basePrice: 999000,
    currency: CURRENCY[code],
    order: 0,
    recommended: false,
    active: true,
    coverages: [
      { name: 'Responsabilidad civil', highlight: 'Cobertura de prueba' },
      { name: 'Asistencia en ruta' },
    ],
    benefits: [],
    ...overrides,
  };
}

let admin: StrapiAdmin;
const created = new Set<string>();
const seeded = new Map<CountryCode, PublishedPlan[]>();

async function create(code: CountryCode, data: PlanData, publish: boolean): Promise<string> {
  const id = await admin.createPlan(await StrapiAdmin.countryId(code), data, publish);
  created.add(id);
  return id;
}

function seededPlan(code: CountryCode, name: string): PublishedPlan {
  const found = seeded.get(code)?.find((candidate) => candidate.name === name);
  if (!found) {
    throw new Error(`Seeded plan ${name} not found`);
  }
  return found;
}

async function restore(code: CountryCode): Promise<void> {
  for (const original of seeded.get(code) ?? []) {
    const { basePrice, order, recommended, active } = original;
    await admin.publishPlan(original.documentId, { basePrice, order, recommended, active });
  }
}

function planNames(page: Page) {
  return page.getByRole('article').getByRole('heading', { level: 2 });
}

async function reload(page: Page): Promise<void> {
  await page.reload();
  await expect(heading(page)).toHaveText(PLAN_STEP);
}

test.beforeAll(async () => {
  admin = await StrapiAdmin.connect();
  for (const code of ['co', 'cl'] as const) {
    seeded.set(code, await StrapiAdmin.publishedPlans(code));
  }
});

test.afterAll(async () => {
  for (const id of created) {
    await admin.deletePlan(id);
  }
  for (const code of ['co', 'cl'] as const) {
    await restore(code);
  }
});

for (const code of ['co', 'cl'] as const) {
  test(`AC-036 ${code}: an inactive plan and a draft plan are never shown`, async ({ page }) => {
    await create(code, plan(code, `Plan Inactivo ${code}`, { active: false }), true);
    await create(code, plan(code, `Plan Borrador ${code}`), false);

    await reachPlans(page, code);

    await expect(planNames(page)).toHaveText(SEEDED_PLANS[code].map((seed) => seed.name));
  });
}

test('AC-039 Colombia: added, reordered, deactivated and changed plans show after a reload', async ({
  page,
}) => {
  const copy = SEEDED_PLAN_COPY.co;
  await reachPlans(page, 'co');
  await expect(planNames(page)).toHaveText(['Plan Básico', 'Plan Clásico', 'Plan Global']);

  await create('co', plan('co', 'Plan Nuevo', { order: 4, basePrice: 3100000 }), true);
  await admin.publishPlan(seededPlan('co', 'Plan Global').documentId, { order: 0 });
  await admin.publishPlan(seededPlan('co', 'Plan Básico').documentId, {
    basePrice: 1250000,
    recommended: true,
  });
  await admin.publishPlan(seededPlan('co', 'Plan Clásico').documentId, {
    active: false,
  });
  await reload(page);

  await expect(planNames(page)).toHaveText(['Plan Global', 'Plan Básico', 'Plan Nuevo']);
  const basic = page.getByRole('article', { name: 'Plan Básico' });
  await expect(basic).toContainText(await price(page, 'co', 1250000));
  await expect(basic.getByText(copy.recommended, { exact: true })).toBeVisible();
  await expect(page.getByText(copy.recommended, { exact: true })).toHaveCount(1);
  await expect(page.getByRole('article', { name: 'Plan Nuevo' })).toContainText(
    await price(page, 'co', 3100000),
  );

  await restore('co');
  await reload(page);
  await expect(planNames(page)).toHaveText([
    'Plan Básico',
    'Plan Clásico',
    'Plan Global',
    'Plan Nuevo',
  ]);
});

test('AC-058 AC-060 Chile without active plans shows the no-plans message, only the back action and no summary', async ({
  page,
  expectNoAxeViolations,
}) => {
  const copy = SEEDED_PLAN_COPY.cl;
  for (const seed of seeded.get('cl') ?? []) {
    await admin.publishPlan(seed.documentId, { active: false });
  }

  await reachPlans(page, 'cl');

  await expect(page.getByRole('alert')).toHaveText(copy.noPlans);
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByRole('main').getByRole('button')).toHaveCount(0);
  await expect(backLink(page)).toBeVisible();
  await expectNoAxeViolations();

  await page.goto('/cl/resumen-y-pago');
  await expect(page).toHaveURL(/\/cl\/elige-tu-plan$/);
  await expect(page.getByRole('alert')).toHaveText(copy.noPlans);
  await backLink(page).click();
  await expect(heading(page)).toHaveText(SEEDED_STEPS.cl[1]);
});
