import { expect, type Locator, type Page, type Route } from '@playwright/test';
import { birthDateForAge, vehicleYearForAge } from './dates.js';

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

/** Seeded plans of each country in display order (AC-064, AC-065). */
export const SEEDED_PLANS = {
  co: [
    { name: 'Plan Básico', basePrice: 1200000, recommended: false, benefits: 0 },
    { name: 'Plan Clásico', basePrice: 1850000, recommended: true, benefits: 1 },
    { name: 'Plan Global', basePrice: 2600000, recommended: false, benefits: 2 },
  ],
  cl: [
    { name: 'Plan Esencial', basePrice: 350000, recommended: false, benefits: 0 },
    { name: 'Plan Full', basePrice: 520000, recommended: true, benefits: 1 },
    { name: 'Plan Premium', basePrice: 690000, recommended: false, benefits: 2 },
  ],
} as const;

/** Seeded plan list copy (AC-040, AC-064, AC-065). */
const PLAN_COPY = {
  choose: 'Elegir este plan',
  chosen: 'Plan elegido',
  recommended: 'Recomendado',
  basePrice: 'Precio base anual',
  finalPrice: 'Tu precio anual',
  quoting: 'Calculando tu precio…',
  coverages: 'Coberturas',
  benefits: 'Beneficios',
  retry: 'Reintentar',
} as const;

export const SEEDED_PLAN_COPY = {
  co: {
    ...PLAN_COPY,
    noPlans: 'Por ahora no tenemos planes disponibles para cotizar. Inténtalo más tarde.',
    choosePlan: 'Elige un plan para continuar.',
    priceError: 'No pudimos calcular tu precio.',
  },
  cl: {
    ...PLAN_COPY,
    noPlans:
      'En este momento no hay planes disponibles para cotizar. Vuelve a intentarlo más tarde.',
    choosePlan: 'Selecciona un plan para continuar.',
    priceError: 'No pudimos calcular tu precio en este momento.',
  },
} as const;

export const PLAN_STEP = 'Elige tu plan';
export const SUMMARY_STEP = 'Resumen y pago';
export const PRICE_QUOTE_REQUESTS = '**/api/quote/price';

/** Ages that decide the simulated price (AC-043); the defaults add no adjustment. */
export interface Ages {
  readonly policyholder: number;
  readonly vehicle: number;
}

const NEUTRAL_AGES: Ages = { policyholder: 40, vehicle: 3 };

/** Completes a country's form steps with valid fictitious data and waits for the plan step. */
export async function reachPlans(
  page: Page,
  code: CountryCode,
  ages: Ages = NEUTRAL_AGES,
): Promise<void> {
  await openWizard(page, code);
  const birthDate = await birthDateForAge(page, ages.policyholder);
  const year = await vehicleYearForAge(page, ages.vehicle);
  if (code === 'co') {
    await fillColombia(page, birthDate, year);
  } else {
    await fillChilePersonal(page, birthDate);
    await activateContinue(page);
    await expect(heading(page)).toHaveText(SEEDED_STEPS.cl[1]);
    await fillChileVehicle(page, year);
  }
  await activateContinue(page);
  await expect(heading(page)).toHaveText(PLAN_STEP);
}

/** The card of a plan, named by the plan's name (AC-060). */
export function planCard(page: Page, name: string): Locator {
  return page.getByRole('article', { name });
}

/** The action that chooses a plan; its accessible name ends with the plan's name (AC-060). */
export function chooseButton(page: Page, name: string): Locator {
  return page.getByRole('button', { name: new RegExp(`: ${name}$`) });
}

/** The final price area of a plan, a status region (AC-045). */
export function priceStatus(page: Page, name: string): Locator {
  return planCard(page, name).getByRole('status');
}

/** A whole amount formatted by the browser's `Intl` for a locale and currency (AC-042). */
export async function formatted(
  page: Page,
  amount: number,
  currency: string,
  locale: string,
): Promise<string> {
  return page.evaluate(
    ([value, code, tag]) =>
      new Intl.NumberFormat(tag, {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0,
      }).format(value),
    [amount, currency, locale] as const,
  );
}

/** Currency and locale of each seeded country (AC-031, AC-032). */
export const SEEDED_FORMAT = {
  co: { currency: 'COP', locale: 'es-CO' },
  cl: { currency: 'CLP', locale: 'es-CL' },
} as const;

/** A price of a seeded country formatted as the application shows it (AC-042). */
export async function price(page: Page, code: CountryCode, amount: number): Promise<string> {
  return formatted(page, amount, SEEDED_FORMAT[code].currency, SEEDED_FORMAT[code].locale);
}

/** Seeded summary copy shown by the tests (AC-073, AC-094, AC-095). */
const SUMMARY_COPY = {
  planHeading: 'Tu plan',
  edit: 'Editar',
  changePlan: 'Cambiar plan',
  acceptTerms: 'Acepto los términos y condiciones',
  viewTerms: 'Ver términos y condiciones',
  termsClose: 'Cerrar',
  pay: 'Pagar',
  processing: 'Procesando tu pago…',
  processingLeaveTitle: '¿Quieres salir mientras procesamos tu pago?',
  processingLeaveStay: 'Esperar el pago',
  processingLeaveConfirm: 'Salir',
  quoteNumber: 'Número de cotización',
  plan: 'Plan',
  newQuote: 'Nueva cotización',
} as const;

export const SEEDED_SUMMARY_COPY = {
  co: {
    ...SUMMARY_COPY,
    finalPrice: 'Tu precio anual',
    termsTitle: 'Términos y condiciones',
    acceptTermsMessage: 'Acepta los términos y condiciones para poder pagar.',
    paymentError: 'No pudimos procesar tu pago. Tus datos siguen aquí; inténtalo de nuevo.',
    confirmationTitle: '¡Listo! Recibimos tu pago',
    confirmationMessage: 'Tu seguro de auto quedó contratado. Guarda tu número de cotización.',
    amountPaid: 'Valor pagado',
  },
  cl: {
    ...SUMMARY_COPY,
    finalPrice: 'Tu monto anual',
    termsTitle: 'Condiciones del seguro',
    acceptTermsMessage: 'Debes aceptar los términos y condiciones para pagar.',
    paymentError: 'No fue posible procesar tu pago. Tus datos se mantienen; vuelve a intentarlo.',
    confirmationTitle: '¡Listo! Tu pago fue aprobado',
    confirmationMessage: 'Tu seguro automotriz quedó contratado. Guarda tu número de cotización.',
    amountPaid: 'Monto pagado',
  },
} as const;

/** First and last paragraph of each country's seeded terms (AC-094, AC-095). */
export const SEEDED_TERMS = {
  co: {
    first:
      'Estos términos y condiciones son ficticios y existen solo para esta demostración. No constituyen una oferta real de seguro.',
    last: 'Las exclusiones generales, como conducir sin licencia vigente o bajo los efectos del alcohol, aplican a todos los planes.',
    paragraphs: 6,
  },
  cl: {
    first:
      'Las presentes condiciones son ficticias y se usan únicamente para esta demostración. No corresponden a una póliza real.',
    last: 'Tus datos personales se usan solo para esta cotización y no se envían a ningún servidor en esta demostración, salvo el país y el plan elegido.',
    paragraphs: 5,
  },
} as const;

/** The recommended seeded plan of each country, which `reachSummary` chooses. */
export const RECOMMENDED_PLAN = { co: 'Plan Clásico', cl: 'Plan Full' } as const;

export const PAYMENT_REQUESTS = '**/api/quote/pay';

/**
 * Completes a country's form steps, chooses its recommended plan, waits for its final price and
 * continues to the summary. Returns the plan name and the final price the plan step showed.
 */
export async function reachSummary(
  page: Page,
  code: CountryCode,
  ages: Ages = NEUTRAL_AGES,
): Promise<{ readonly plan: string; readonly finalPrice: string }> {
  await reachPlans(page, code, ages);
  const plan = RECOMMENDED_PLAN[code];
  await chooseButton(page, plan).click();
  const status = priceStatus(page, plan);
  await expect(status).toContainText(SEEDED_PLAN_COPY[code].finalPrice);
  const text = (await status.textContent()) ?? '';
  const finalPrice = text.replace(SEEDED_PLAN_COPY[code].finalPrice, '').trim();
  await continueButton(page).click();
  await expect(heading(page)).toHaveText(SUMMARY_STEP);
  return { plan, finalPrice };
}

/** The pay action; it stays focusable while it looks disabled (AC-076). */
export function payButton(page: Page, code: CountryCode): Locator {
  return page.getByRole('button', {
    name: new RegExp(
      `^(${SEEDED_SUMMARY_COPY[code].pay}|${SEEDED_SUMMARY_COPY[code].processing})$`,
    ),
  });
}

export function termsCheckbox(page: Page, code: CountryCode): Locator {
  return page.getByRole('checkbox', { name: SEEDED_SUMMARY_COPY[code].acceptTerms });
}

export function viewTermsButton(page: Page, code: CountryCode): Locator {
  return page.getByRole('button', { name: SEEDED_SUMMARY_COPY[code].viewTerms });
}

/** The edit action of a section, named with the section title (AC-071). */
export function editLink(page: Page, code: CountryCode, title: string): Locator {
  return page.getByRole('link', { name: `${SEEDED_SUMMARY_COPY[code].edit} ${title}` });
}

export function changePlanLink(page: Page, code: CountryCode): Locator {
  return page.getByRole('link', { name: SEEDED_SUMMARY_COPY[code].changePlan });
}

/** Activates pay like a person does: it may look disabled, so the click is forced (AC-076). */
export async function activatePay(page: Page, code: CountryCode): Promise<void> {
  await payButton(page, code).click({ force: true });
}

/** Payment requests held by the test until it answers them (AC-078, AC-081, AC-096). */
export interface HeldPayments {
  /** Payment requests the browser sent so far. */
  count(): number;
  /** Waits until `n` payment requests were sent. */
  waitFor(n: number): Promise<void>;
  /** Lets every held request reach the endpoint. */
  release(): Promise<void>;
  /** Answers every held request as rejected by the endpoint. */
  reject(): Promise<void>;
  /** Fails every held request as a network failure. */
  abort(): Promise<void>;
  /** Stops holding: later requests reach the endpoint. */
  stop(): Promise<void>;
}

/** Holds the browser's payment requests so the test can observe the processing state. */
export async function holdPayment(page: Page): Promise<HeldPayments> {
  const held: Route[] = [];
  let sent = 0;
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
  };
  await page.route(PAYMENT_REQUESTS, async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors });
      return;
    }
    sent += 1;
    held.push(route);
  });
  const drain = async (answer: (route: Route) => Promise<void>) => {
    for (const route of held.splice(0)) {
      await answer(route);
    }
  };
  return {
    count: () => sent,
    waitFor: (n) => expect.poll(() => sent).toBeGreaterThanOrEqual(n),
    release: () => drain((route) => route.continue()),
    reject: () =>
      drain((route) =>
        route.fulfill({
          status: 200,
          headers: cors,
          contentType: 'application/json',
          body: JSON.stringify({ data: { status: 'rejected' } }),
        }),
      ),
    abort: () => drain((route) => route.abort('connectionrefused')),
    stop: () => page.unroute(PAYMENT_REQUESTS),
  };
}

/** Formats a stored calendar date as the summary shows it, with the browser's `Intl` (AC-068). */
export async function calendarDate(page: Page, iso: string, locale: string): Promise<string> {
  return page.evaluate(
    ([value, tag]) => {
      const [year, month, day] = value.split('-').map(Number) as [number, number, number];
      return new Intl.DateTimeFormat(tag, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(year, month - 1, day)));
    },
    [iso, locale] as const,
  );
}
