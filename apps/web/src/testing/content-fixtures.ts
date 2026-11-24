// Fictitious Strapi content for Colombia and Chile used by unit and component tests (P5). The
// two countries have different steps, fields and copy so tests show nothing depends on a code.
import {
  type FormFieldContent,
  formFieldSchema,
  type PriceQuoteRequest,
  type WizardContent,
  wizardContentSchema,
} from '@car-insurance/shared';
import type { ContentReader, RawWizardContent } from '../app/core/content/content-reader';
import type { PriceQuote } from '../app/core/quote/price-quote';

type Raw = Record<string, unknown>;

export const MEDIA_BASE_URL = 'http://cms.test';

function copy(overrides: Raw = {}): Raw {
  return {
    continueLabel: 'Continuar',
    backLabel: 'Volver',
    progressLabel: 'Paso {current} de {total}',
    leaveTitle: '¿Quieres salir del formulario?',
    leaveMessage: 'Perderás los datos que escribiste en este paso.',
    leaveStayLabel: 'Seguir en el formulario',
    leaveConfirmLabel: 'Salir',
    ...overrides,
  };
}

function planCopy(overrides: Raw = {}): Raw {
  return {
    chooseLabel: 'Elegir este plan',
    chosenLabel: 'Plan elegido',
    recommendedLabel: 'Recomendado',
    basePriceLabel: 'Precio base anual',
    finalPriceLabel: 'Tu precio anual',
    quotingLabel: 'Calculando tu precio…',
    coveragesHeading: 'Coberturas',
    benefitsHeading: 'Beneficios',
    noPlansMessage: 'Por ahora no tenemos planes disponibles.',
    choosePlanMessage: 'Elige un plan para continuar.',
    priceErrorMessage: 'No pudimos calcular tu precio.',
    retryLabel: 'Reintentar',
    ...overrides,
  };
}

export function rawField(overrides: Raw & { name: string }): Raw {
  return {
    label: `Etiqueta ${overrides.name}`,
    type: 'text',
    required: true,
    placeholder: null,
    helpText: null,
    errorMessage: `Revisa ${overrides.name}`,
    order: 1,
    options: [],
    validation: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function rawColombia(overrides: Raw = {}): Raw {
  return {
    id: 1,
    documentId: 'co-doc',
    code: 'co',
    name: 'Colombia',
    currency: 'COP',
    formatLocale: 'es-CO',
    theme: { primaryColor: '#2D6DF6', accentColor: '#00AEC7', logo: null },
    copy: copy(),
    planCopy: planCopy(),
    ...overrides,
  };
}

export function rawChile(overrides: Raw = {}): Raw {
  return {
    id: 2,
    documentId: 'cl-doc',
    code: 'cl',
    name: 'Chile',
    currency: 'CLP',
    formatLocale: 'es-CL',
    theme: {
      primaryColor: '#123456',
      accentColor: '#654321',
      logo: { url: '/uploads/logo-cl.png', alternativeText: 'Logo de prueba' },
    },
    copy: copy({
      continueLabel: 'Siguiente',
      backLabel: 'Atrás',
      progressLabel: 'Etapa {current} / {total}',
      leaveTitle: '¿Quieres salir de la cotización?',
      leaveMessage: 'Se perderán los datos de esta etapa.',
      leaveStayLabel: 'Seguir cotizando',
      leaveConfirmLabel: 'Abandonar',
    }),
    planCopy: planCopy({
      chooseLabel: 'Quiero este plan',
      chosenLabel: 'Tu elección',
      recommendedLabel: 'El más elegido',
      basePriceLabel: 'Desde',
      finalPriceLabel: 'Tu precio final',
      quotingLabel: 'Estamos calculando…',
      coveragesHeading: 'Qué cubre',
      benefitsHeading: 'Extras',
      noPlansMessage: 'No hay planes para cotizar.',
      choosePlanMessage: 'Selecciona un plan.',
      priceErrorMessage: 'El precio no está disponible.',
      retryLabel: 'Volver a intentar',
    }),
    ...overrides,
  };
}

export function colombiaFields(): Raw[] {
  return [
    rawField({
      name: 'tipo-documento',
      label: 'Tipo de documento',
      type: 'select',
      order: 1,
      placeholder: 'Selecciona tu tipo de documento',
      helpText: 'Elige el documento con el que te identificas.',
      errorMessage: 'Selecciona un tipo de documento.',
      options: [
        { value: 'ce', label: 'Cédula de extranjería', order: 2 },
        { value: 'cc', label: 'Cédula de ciudadanía', order: 1 },
      ],
    }),
    rawField({
      name: 'placa',
      label: 'Placa',
      order: 2,
      placeholder: 'Ej: ABC123',
      helpText: 'Tres letras seguidas de tres números.',
      errorMessage: 'Ingresa una placa válida.',
      validation: { pattern: '^[A-Za-z]{3}[0-9]{3}$' },
    }),
    rawField({
      name: 'uso-particular',
      label: 'El vehículo es de uso particular',
      type: 'checkbox',
      required: false,
      order: 3,
      errorMessage: 'Revisa esta opción.',
    }),
  ];
}

export function rawColombiaSteps(fields: Raw[] = colombiaFields()): Raw[] {
  return [
    {
      slug: 'tus-datos-y-tu-vehiculo',
      title: 'Tus datos y tu vehículo',
      type: 'form',
      order: 1,
      fields,
    },
    { slug: 'elige-tu-plan', title: 'Elige tu plan', type: 'plans', order: 2, fields: [] },
    { slug: 'resumen-y-pago', title: 'Resumen y pago', type: 'summary', order: 3, fields: [] },
  ];
}

export function rawChileSteps(): Raw[] {
  return [
    {
      slug: 'tus-datos',
      title: 'Tus datos',
      type: 'form',
      order: 1,
      fields: [
        rawField({
          name: 'rut',
          label: 'RUT',
          order: 1,
          errorMessage: 'Ingresa un RUT válido.',
          validation: { pattern: '^[0-9]{7,8}-[0-9Kk]$' },
        }),
        rawField({
          name: 'fecha-nacimiento',
          label: 'Fecha de nacimiento',
          type: 'date',
          order: 2,
          helpText: 'Debes ser mayor de edad.',
          errorMessage: 'Debes tener 18 años o más.',
          validation: { minAge: 18 },
          pricingInput: 'birthDate',
        }),
      ],
    },
    {
      slug: 'tu-vehiculo',
      title: 'Tu vehículo',
      type: 'form',
      order: 2,
      fields: [
        rawField({
          name: 'marca',
          label: 'Marca',
          type: 'select',
          order: 1,
          errorMessage: 'Selecciona la marca.',
          options: [
            { value: 'toyota', label: 'Toyota', order: 1 },
            { value: 'suzuki', label: 'Suzuki', order: 2 },
          ],
        }),
        rawField({
          name: 'anio',
          label: 'Año del vehículo',
          type: 'number',
          order: 2,
          placeholder: 'Ej: 2020',
          errorMessage: 'Ingresa un año válido.',
          validation: { integer: true, yearsBefore: 20, yearsAfter: 1 },
          pricingInput: 'vehicleYear',
        }),
      ],
    },
    { slug: 'elige-tu-plan', title: 'Elige tu plan', type: 'plans', order: 3, fields: [] },
    { slug: 'resumen-y-pago', title: 'Resumen y pago', type: 'summary', order: 4, fields: [] },
  ];
}

/** Colombian fields marked for pricing, both in its single form step (AC-044). */
export function colombiaPricingFields(): Raw[] {
  return [
    rawField({
      name: 'fecha-nacimiento',
      label: 'Fecha de nacimiento',
      type: 'date',
      order: 4,
      validation: { minAge: 18 },
      pricingInput: 'birthDate',
    }),
    rawField({
      name: 'anio',
      label: 'Año del vehículo',
      type: 'number',
      order: 5,
      validation: { integer: true, yearsBefore: 20, yearsAfter: 1 },
      pricingInput: 'vehicleYear',
    }),
  ];
}

export function rawPlan(overrides: Raw & { documentId: string }): Raw {
  return {
    id: 10,
    name: `Plan ${overrides.documentId}`,
    description: 'Descripción del plan.',
    basePrice: 1000000,
    currency: 'COP',
    order: 1,
    recommended: false,
    active: true,
    coverages: [{ id: 1, name: 'Responsabilidad civil', highlight: 'Hasta 100 millones' }],
    benefits: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    publishedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Colombian plans in creation order: the first has no benefits and a coverage without value. */
export function rawColombiaPlans(): Raw[] {
  return [
    rawPlan({
      documentId: 'co-basico',
      name: 'Plan Básico',
      description: 'Lo esencial para circular.',
      basePrice: 1200000,
      order: 1,
      coverages: [
        { id: 1, name: 'Responsabilidad civil', highlight: 'Hasta $ 1.000 millones' },
        { id: 2, name: 'Asistencia jurídica', highlight: null },
      ],
      benefits: [],
    }),
    rawPlan({
      documentId: 'co-clasico',
      name: 'Plan Clásico',
      description: 'Protección completa.',
      basePrice: 1850000,
      order: 2,
      recommended: true,
      coverages: [
        { id: 3, name: 'Pérdida total', highlight: '100 % del valor comercial' },
        { id: 4, name: 'Asistencia en carretera', highlight: 'Grúa hasta 150 km' },
      ],
      benefits: [{ id: 1, text: 'Vehículo de reemplazo por 10 días' }],
    }),
    rawPlan({
      documentId: 'co-global',
      name: 'Plan Global',
      description: 'La cobertura más amplia.',
      basePrice: 2600000,
      order: 3,
      benefits: [
        { id: 2, text: 'Vehículo de reemplazo por 20 días' },
        { id: 3, text: 'Conductor elegido' },
      ],
    }),
  ];
}

/** Chilean plans with equal order values, shown by creation order (AC-036). */
export function rawChilePlans(): Raw[] {
  return [
    rawPlan({
      documentId: 'cl-premium',
      name: 'Plan Premium',
      description: 'La protección más completa.',
      basePrice: 690000,
      currency: 'CLP',
      order: 2,
      createdAt: '2026-01-03T00:00:00.000Z',
    }),
    rawPlan({
      documentId: 'cl-full',
      name: 'Plan Full',
      description: 'Protege tu auto y a terceros.',
      basePrice: 520000,
      currency: 'CLP',
      order: 2,
      recommended: true,
      createdAt: '2026-01-02T00:00:00.000Z',
      benefits: [{ id: 4, text: 'Auto de reemplazo por 7 días' }],
    }),
    rawPlan({
      documentId: 'cl-esencial',
      name: 'Plan Esencial',
      description: 'Cubre los daños a terceros.',
      basePrice: 350000,
      currency: 'CLP',
      order: 1,
      createdAt: '2026-01-04T00:00:00.000Z',
    }),
  ];
}

export function envelope(data: unknown[]): Raw {
  return {
    data,
    meta: { pagination: { page: 1, pageSize: 100, pageCount: 1, total: data.length } },
  };
}

export function colombiaContent(
  fields: Raw[] = colombiaFields(),
  plans: Raw[] = rawColombiaPlans(),
): WizardContent {
  return wizardContentSchema.parse({
    country: rawColombia(),
    steps: rawColombiaSteps(fields),
    plans,
  });
}

export function chileContent(plans: Raw[] = rawChilePlans()): WizardContent {
  return wizardContentSchema.parse({ country: rawChile(), steps: rawChileSteps(), plans });
}

export function field(overrides: Raw & { name: string }): FormFieldContent {
  return formFieldSchema.parse(rawField(overrides));
}

/** A content reader serving fixed responses per country code; `fail` makes every read fail. */
export class FakeContentReader implements ContentReader {
  readonly wizards = new Map<string, { country: unknown; steps: unknown; plans?: unknown }>([
    [
      'co',
      {
        country: envelope([rawColombia()]),
        steps: envelope(rawColombiaSteps()),
        plans: envelope(rawColombiaPlans()),
      },
    ],
    [
      'cl',
      {
        country: envelope([rawChile()]),
        steps: envelope(rawChileSteps()),
        plans: envelope(rawChilePlans()),
      },
    ],
  ]);
  countries: unknown = envelope([
    { code: 'cl', name: 'Chile' },
    { code: 'co', name: 'Colombia' },
  ]);
  fail = false;
  /** Pending reads stay unresolved while `hold` is set, to observe loading states. */
  hold = false;
  readonly requests: string[] = [];

  async readCountries(): Promise<unknown> {
    this.requests.push('countries');
    await this.wait();
    return this.countries;
  }

  async readWizard(code: string): Promise<RawWizardContent> {
    this.requests.push(code);
    await this.wait();
    const wizard = this.wizards.get(code);
    return {
      country: wizard?.country ?? envelope([]),
      steps: wizard?.steps ?? envelope([]),
      plans: wizard?.plans ?? envelope([]),
      mediaBaseUrl: MEDIA_BASE_URL,
    };
  }

  private async wait(): Promise<void> {
    while (this.hold) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    if (this.fail) {
      throw new Error('network');
    }
  }
}

/** A price-quote request the test answers when and how it wants. */
export interface PendingQuote {
  readonly request: PriceQuoteRequest;
  readonly signal: AbortSignal | undefined;
  resolve(price: number): void;
  reject(error: unknown): void;
}

/** A price quote whose answers are controlled by the test, in any order (AC-049). */
export class FakePriceQuote implements PriceQuote {
  readonly requests: PendingQuote[] = [];

  finalPrice(request: PriceQuoteRequest, signal?: AbortSignal): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.requests.push({ request, signal, resolve, reject });
    });
  }

  /** The latest request; fails the test when none was sent. */
  last(): PendingQuote {
    const last = this.requests.at(-1);
    if (!last) {
      throw new Error('No price quote was requested');
    }
    return last;
  }
}

/** In-memory session storage for the wizard state store. */
export class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();
  get length(): number {
    return this.items.size;
  }
  clear(): void {
    this.items.clear();
  }
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.items.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

/** A fixed device date: 23 November 2026, local time. */
export const TODAY = new Date(2026, 10, 23, 10, 0, 0);
