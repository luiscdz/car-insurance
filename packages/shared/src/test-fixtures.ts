// Fictitious Strapi-shaped content for Colombia and Chile used by the unit tests (P5).
import type { CountryDetailInput } from './content/country.js';
import type { FormFieldInput } from './content/form-field.js';
import type { PlanInput } from './content/plan.js';
import type { WizardStepInput } from './content/wizard-step.js';

const copy = {
  continueLabel: 'Continuar',
  backLabel: 'Volver',
  progressLabel: 'Paso {current} de {total}',
  leaveTitle: '¿Quieres salir?',
  leaveMessage: 'Perderás los datos de este paso.',
  leaveStayLabel: 'Seguir aquí',
  leaveConfirmLabel: 'Salir',
};

const planCopy = {
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
};

export function colombia(): CountryDetailInput {
  return {
    code: 'co',
    name: 'Colombia',
    currency: 'COP',
    formatLocale: 'es-CO',
    copy: { ...copy },
    planCopy: { ...planCopy },
    theme: { primaryColor: '#2D6DF6', accentColor: '#00AEC7', logo: null },
  };
}

export function chile(): CountryDetailInput {
  return {
    code: 'cl',
    name: 'Chile',
    currency: 'CLP',
    formatLocale: 'es-CL',
    copy: { ...copy, leaveStayLabel: 'Seguir cotizando' },
    planCopy: { ...planCopy, chooseLabel: 'Quiero este plan', recommendedLabel: 'El más elegido' },
    theme: null,
  };
}

function field(overrides: Partial<FormFieldInput> & Pick<FormFieldInput, 'name'>): FormFieldInput {
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
    ...overrides,
  };
}

export function colombiaSteps(): WizardStepInput[] {
  return [
    { slug: 'resumen-y-pago', title: 'Resumen y pago', type: 'summary', order: 3, fields: [] },
    {
      slug: 'tus-datos-y-tu-vehiculo',
      title: 'Tus datos y tu vehículo',
      type: 'form',
      order: 1,
      fields: [
        field({ name: 'placa', order: 4, validation: { pattern: '^[A-Za-z]{3}[0-9]{3}$' } }),
        field({
          name: 'tipo-documento',
          type: 'select',
          order: 1,
          options: [
            { value: 'ce', label: 'Cédula de extranjería', order: 2 },
            { value: 'cc', label: 'Cédula de ciudadanía', order: 1 },
          ],
        }),
        field({
          name: 'anio',
          type: 'number',
          order: 6,
          validation: { integer: true, yearsBefore: 20, yearsAfter: 1 },
          pricingInput: 'vehicleYear',
        }),
        field({
          name: 'fecha-nacimiento',
          type: 'date',
          order: 5,
          validation: { minAge: 18 },
          pricingInput: 'birthDate',
        }),
      ],
    },
    { slug: 'elige-tu-plan', title: 'Elige tu plan', type: 'plans', order: 2, fields: null },
  ];
}

export function chileSteps(): WizardStepInput[] {
  return [
    {
      slug: 'tus-datos',
      title: 'Tus datos',
      type: 'form',
      order: 1,
      fields: [
        field({ name: 'rut', order: 1 }),
        field({
          name: 'fecha-nacimiento',
          type: 'date',
          order: 2,
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
        field({ name: 'patente', order: 1 }),
        field({ name: 'anio', type: 'number', order: 2, pricingInput: 'vehicleYear' }),
      ],
    },
    { slug: 'elige-tu-plan', title: 'Elige tu plan', type: 'plans', order: 3 },
    { slug: 'resumen-y-pago', title: 'Resumen y pago', type: 'summary', order: 4 },
  ];
}

function plan(overrides: Partial<PlanInput> & Pick<PlanInput, 'documentId'>): PlanInput {
  return {
    name: `Plan ${overrides.documentId}`,
    description: 'Descripción del plan.',
    basePrice: 1000000,
    currency: 'COP',
    order: 1,
    recommended: false,
    coverages: [{ name: 'Responsabilidad civil', highlight: 'Hasta 100 millones' }],
    benefits: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function colombiaPlans(): PlanInput[] {
  return [
    plan({ documentId: 'co-global', name: 'Plan Global', order: 3, basePrice: 2600000 }),
    plan({
      documentId: 'co-basico',
      name: 'Plan Básico',
      order: 1,
      basePrice: 1200000,
      coverages: [{ name: 'Asistencia jurídica' }],
      benefits: null,
    }),
    plan({
      documentId: 'co-clasico',
      name: 'Plan Clásico',
      order: 2,
      basePrice: 1850000,
      recommended: true,
      benefits: [{ text: 'Vehículo de reemplazo' }],
    }),
  ];
}

export function chilePlans(): PlanInput[] {
  return [
    plan({
      documentId: 'cl-esencial',
      name: 'Plan Esencial',
      currency: 'CLP',
      basePrice: 350000,
      order: 1,
      createdAt: '2026-01-02T00:00:00.000Z',
    }),
    plan({
      documentId: 'cl-full',
      name: 'Plan Full',
      currency: 'CLP',
      basePrice: 520000,
      order: 1,
      recommended: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    }),
  ];
}

export { field as fieldFixture, plan as planFixture };
