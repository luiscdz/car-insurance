// Seed content for Colombia and Chile (AC-031, AC-032). Only fictitious example values (P5).
// Both countries share the SURA theme today (docs/design.md); no logo is seeded, so the text
// placeholder is shown until the business team uploads the official one.
import type { CountryDetailInput, FormFieldInput, WizardStepInput } from '@car-insurance/shared';

/** The data of one seeded country, in the shape the content API returns it. */
export interface CountrySeed {
  readonly country: Omit<CountryDetailInput, 'theme'> & {
    readonly theme: { readonly primaryColor: string; readonly accentColor: string };
  };
  readonly steps: readonly (Omit<WizardStepInput, 'fields'> & {
    readonly fields?: readonly FormFieldInput[];
  })[];
}

const SURA_THEME = { primaryColor: '#2D6DF6', accentColor: '#00AEC7' };

const birthDate = (order: number): FormFieldInput => ({
  name: 'fecha-nacimiento',
  label: 'Fecha de nacimiento',
  type: 'date',
  required: true,
  helpText: 'Debes ser mayor de edad para contratar el seguro.',
  errorMessage: 'Ingresa una fecha válida. Debes tener 18 años o más.',
  order,
  validation: { minAge: 18 },
});

const vehicleYear = (order: number): FormFieldInput => ({
  name: 'anio',
  label: 'Año del vehículo',
  type: 'number',
  required: true,
  placeholder: 'Ej: 2020',
  helpText: 'Año de fabricación que aparece en la licencia del vehículo.',
  errorMessage: 'Ingresa un año válido: el vehículo puede tener hasta 20 años de antigüedad.',
  order,
  validation: { integer: true, yearsBefore: 20, yearsAfter: 1 },
});

const make = (order: number, helpText: string, labels: readonly string[]): FormFieldInput => ({
  name: 'marca',
  label: 'Marca',
  type: 'select',
  required: true,
  placeholder: 'Selecciona la marca',
  helpText,
  errorMessage: 'Selecciona la marca de tu vehículo.',
  order,
  options: labels.map((label, index) => ({
    value: label.toLowerCase(),
    label,
    order: index + 1,
  })),
});

const planSteps = (firstOrder: number): CountrySeed['steps'] => [
  { slug: 'elige-tu-plan', title: 'Elige tu plan', type: 'plans', order: firstOrder },
  { slug: 'resumen-y-pago', title: 'Resumen y pago', type: 'summary', order: firstOrder + 1 },
];

export const COLOMBIA: CountrySeed = {
  country: {
    code: 'co',
    name: 'Colombia',
    currency: 'COP',
    formatLocale: 'es-CO',
    theme: SURA_THEME,
    copy: {
      continueLabel: 'Continuar',
      backLabel: 'Volver',
      progressLabel: 'Paso {current} de {total}',
      leaveTitle: '¿Quieres salir del formulario?',
      leaveMessage: 'Perderás los datos que escribiste en este paso y aún no confirmaste.',
      leaveStayLabel: 'Seguir en el formulario',
      leaveConfirmLabel: 'Salir',
    },
  },
  steps: [
    {
      slug: 'tus-datos-y-tu-vehiculo',
      title: 'Tus datos y tu vehículo',
      type: 'form',
      order: 1,
      fields: [
        {
          name: 'tipo-documento',
          label: 'Tipo de documento',
          type: 'select',
          required: true,
          placeholder: 'Selecciona tu tipo de documento',
          helpText: 'Elige el documento con el que te identificas.',
          errorMessage: 'Selecciona un tipo de documento.',
          order: 1,
          options: [
            { value: 'cc', label: 'Cédula de ciudadanía', order: 1 },
            { value: 'ce', label: 'Cédula de extranjería', order: 2 },
          ],
        },
        {
          name: 'numero-documento',
          label: 'Número de documento',
          type: 'text',
          required: true,
          placeholder: 'Ej: 1234567890',
          helpText: 'Solo números, sin puntos ni espacios.',
          errorMessage: 'Ingresa un número de documento de 6 a 10 dígitos.',
          order: 2,
          validation: { pattern: '^[0-9]{6,10}$' },
        },
        birthDate(3),
        {
          name: 'placa',
          label: 'Placa',
          type: 'text',
          required: true,
          placeholder: 'Ej: ABC123',
          helpText: 'Tres letras seguidas de tres números.',
          errorMessage: 'Ingresa una placa con tres letras y tres números, por ejemplo ABC123.',
          order: 4,
          validation: { pattern: '^[A-Za-z]{3}[0-9]{3}$' },
        },
        make(5, 'Marca que aparece en la licencia de tránsito.', [
          'Chevrolet',
          'Renault',
          'Mazda',
          'Kia',
        ]),
        vehicleYear(6),
      ],
    },
    ...planSteps(2),
  ],
};

export const CHILE: CountrySeed = {
  country: {
    code: 'cl',
    name: 'Chile',
    currency: 'CLP',
    formatLocale: 'es-CL',
    theme: SURA_THEME,
    copy: {
      continueLabel: 'Continuar',
      backLabel: 'Volver',
      progressLabel: 'Paso {current} de {total}',
      leaveTitle: '¿Quieres salir de la cotización?',
      leaveMessage: 'Se perderán los datos que ingresaste en este paso y que aún no confirmaste.',
      leaveStayLabel: 'Seguir cotizando',
      leaveConfirmLabel: 'Salir',
    },
  },
  steps: [
    {
      slug: 'tus-datos',
      title: 'Tus datos',
      type: 'form',
      order: 1,
      fields: [
        {
          name: 'rut',
          label: 'RUT',
          type: 'text',
          required: true,
          placeholder: 'Ej: 12.345.678-5',
          helpText: 'Con o sin puntos, con guion y dígito verificador.',
          errorMessage: 'Ingresa un RUT válido, por ejemplo 12.345.678-5.',
          order: 1,
          validation: { pattern: '^([0-9]{1,2}(\\.[0-9]{3}){2}|[0-9]{7,8})-[0-9Kk]$' },
        },
        birthDate(2),
      ],
    },
    {
      slug: 'tu-vehiculo',
      title: 'Tu vehículo',
      type: 'form',
      order: 2,
      fields: [
        {
          name: 'patente',
          label: 'Patente',
          type: 'text',
          required: true,
          placeholder: 'Ej: BBBB12',
          helpText: 'Cuatro letras y dos números, o dos letras y cuatro números.',
          errorMessage: 'Ingresa una patente válida, por ejemplo BBBB12 o AB1234.',
          order: 1,
          validation: { pattern: '^([A-Za-z]{4}[0-9]{2}|[A-Za-z]{2}[0-9]{4})$' },
        },
        make(2, 'Marca que aparece en el padrón del vehículo.', [
          'Toyota',
          'Hyundai',
          'Suzuki',
          'Chevrolet',
        ]),
        vehicleYear(3),
      ],
    },
    ...planSteps(3),
  ],
};

export const SEED_COUNTRIES: readonly CountrySeed[] = [COLOMBIA, CHILE];
