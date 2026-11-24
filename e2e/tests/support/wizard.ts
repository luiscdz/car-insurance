import { expect, type Locator, type Page } from '@playwright/test';

/** Fallback copy of the front end (apps/web core/content/fallback-copy.ts). */
export const FALLBACK = {
  pageTitle: 'Cotiza tu seguro de auto',
  heading: 'Elige tu país para cotizar tu seguro de auto',
  unavailable: 'No pudimos cargar el formulario. Revisa tu conexión e inténtalo de nuevo.',
  retry: 'Reintentar',
  countryNotAvailable: 'Este país no está disponible.',
  chooseCountry: 'Elegir otro país',
} as const;

/** Seeded steps of each country (AC-031, AC-032). */
export const SEEDED_STEPS = {
  co: ['Tus datos y tu vehículo', 'Elige tu plan', 'Resumen y pago'],
  cl: ['Tus datos', 'Tu vehículo', 'Elige tu plan', 'Resumen y pago'],
} as const;

export type CountryCode = keyof typeof SEEDED_STEPS;

/** Seeded wizard copy shown by the tests (AC-008). */
export const SEEDED_COPY = {
  co: { leaveStay: 'Seguir en el formulario', leaveConfirm: 'Salir' },
  cl: { leaveStay: 'Seguir cotizando', leaveConfirm: 'Salir' },
} as const;

export function heading(page: Page): Locator {
  return page.getByRole('heading', { level: 1 });
}

export function continueButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Continuar' });
}

export function backLink(page: Page): Locator {
  return page.getByRole('link', { name: 'Volver' });
}

/**
 * Activates continue like a person does. The action stays focusable while it looks disabled
 * (AC-011), which Playwright treats as not enabled, so the click is forced.
 */
export async function activateContinue(page: Page): Promise<void> {
  await continueButton(page).click({ force: true });
}

/** Opens a country's wizard from its address and waits for its first step. */
export async function openWizard(page: Page, code: CountryCode): Promise<void> {
  await page.goto(`/${code}`);
  await expect(heading(page)).toHaveText(SEEDED_STEPS[code][0]);
}

export async function expectStep(page: Page, code: CountryCode, title: string): Promise<void> {
  await expect(heading(page)).toHaveText(title);
  await expect(page).toHaveURL(new RegExp(`/${code}/[a-z0-9-]+$`));
}

/** Fills Colombia's form step with valid fictitious data (P5). */
export async function fillColombia(page: Page, birthDate: string, year: string): Promise<void> {
  await page.getByLabel('Tipo de documento').selectOption({ label: 'Cédula de ciudadanía' });
  await page.getByLabel('Número de documento').fill('1234567890');
  await page.getByLabel('Fecha de nacimiento').fill(birthDate);
  await page.getByLabel('Placa').fill('ABC123');
  await page.getByLabel('Marca').selectOption({ label: 'Mazda' });
  await page.getByLabel('Año del vehículo').fill(year);
}

/** Fills Chile's first form step, "Tus datos", with valid fictitious data (P5). */
export async function fillChilePersonal(page: Page, birthDate: string): Promise<void> {
  await page.getByLabel('RUT').fill('12.345.678-5');
  await page.getByLabel('Fecha de nacimiento').fill(birthDate);
}

/** Fills Chile's second form step, "Tu vehículo", with valid fictitious data (P5). */
export async function fillChileVehicle(page: Page, year: string): Promise<void> {
  await page.getByLabel('Patente').fill('BBBB12');
  await page.getByLabel('Marca').selectOption({ label: 'Toyota' });
  await page.getByLabel('Año del vehículo').fill(year);
}
