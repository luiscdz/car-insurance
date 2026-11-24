// Fictitious Strapi-shaped content for Colombia and Chile used by the unit tests (P5).
import type { CountryDetailInput } from './content/country.js';
import type { FormFieldInput } from './content/form-field.js';
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

export function colombia(): CountryDetailInput {
  return {
    code: 'co',
    name: 'Colombia',
    currency: 'COP',
    formatLocale: 'es-CO',
    copy: { ...copy },
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
        field({ name: 'fecha-nacimiento', type: 'date', order: 2, validation: { minAge: 18 } }),
      ],
    },
    {
      slug: 'tu-vehiculo',
      title: 'Tu vehículo',
      type: 'form',
      order: 2,
      fields: [field({ name: 'patente', order: 1 })],
    },
    { slug: 'elige-tu-plan', title: 'Elige tu plan', type: 'plans', order: 3 },
    { slug: 'resumen-y-pago', title: 'Resumen y pago', type: 'summary', order: 4 },
  ];
}

export { field as fieldFixture };
