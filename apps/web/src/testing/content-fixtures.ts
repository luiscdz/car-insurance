// Fictitious Strapi content for Colombia and Chile used by unit and component tests (P5). The
// two countries have different steps, fields and copy so tests show nothing depends on a code.
import {
  type FormFieldContent,
  formFieldSchema,
  type WizardContent,
  wizardContentSchema,
} from '@car-insurance/shared';
import type { ContentReader, RawWizardContent } from '../app/core/content/content-reader';

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
        }),
      ],
    },
    { slug: 'elige-tu-plan', title: 'Elige tu plan', type: 'plans', order: 3, fields: [] },
    { slug: 'resumen-y-pago', title: 'Resumen y pago', type: 'summary', order: 4, fields: [] },
  ];
}

export function envelope(data: unknown[]): Raw {
  return {
    data,
    meta: { pagination: { page: 1, pageSize: 100, pageCount: 1, total: data.length } },
  };
}

export function colombiaContent(): WizardContent {
  return wizardContentSchema.parse({ country: rawColombia(), steps: rawColombiaSteps() });
}

export function chileContent(): WizardContent {
  return wizardContentSchema.parse({ country: rawChile(), steps: rawChileSteps() });
}

export function field(overrides: Raw & { name: string }): FormFieldContent {
  return formFieldSchema.parse(rawField(overrides));
}

/** A content reader serving fixed responses per country code; `fail` makes every read fail. */
export class FakeContentReader implements ContentReader {
  readonly wizards = new Map<string, { country: unknown; steps: unknown }>([
    ['co', { country: envelope([rawColombia()]), steps: envelope(rawColombiaSteps()) }],
    ['cl', { country: envelope([rawChile()]), steps: envelope(rawChileSteps()) }],
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
