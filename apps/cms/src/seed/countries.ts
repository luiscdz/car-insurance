// Seed content for Colombia and Chile (AC-031, AC-032, AC-064, AC-065, AC-094, AC-095). Only
// fictitious example values (P5): plans, prices, coverages, benefits and terms are invented for
// the simulation.
// Both countries share the SURA theme today (docs/design.md); no logo is seeded, so the text
// placeholder is shown until the business team uploads the official one.
import type {
  CountryDetailInput,
  FormFieldInput,
  PlanInput,
  WizardStepInput,
} from '@car-insurance/shared';

/** A seeded plan; Strapi assigns its document id and creation time. */
export type PlanSeed = Omit<PlanInput, 'documentId' | 'createdAt'>;

/** The data of one seeded country, in the shape the content API returns it. */
export interface CountrySeed {
  readonly country: Omit<CountryDetailInput, 'theme'> & {
    readonly theme: { readonly primaryColor: string; readonly accentColor: string };
  };
  readonly steps: readonly (Omit<WizardStepInput, 'fields'> & {
    readonly fields?: readonly FormFieldInput[];
  })[];
  /** Published, active plans of the country, in creation order. */
  readonly plans: readonly PlanSeed[];
  /** The country's single published terms and conditions entry, as plain text (AC-074). */
  readonly terms: { readonly text: string };
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
  pricingInput: 'birthDate',
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
  pricingInput: 'vehicleYear',
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

/** Plan list copy both countries share; each country adds the texts that differ. */
const PLAN_COPY = {
  chooseLabel: 'Elegir este plan',
  chosenLabel: 'Plan elegido',
  recommendedLabel: 'Recomendado',
  basePriceLabel: 'Precio base anual',
  finalPriceLabel: 'Tu precio anual',
  quotingLabel: 'Calculando tu precio…',
  coveragesHeading: 'Coberturas',
  benefitsHeading: 'Beneficios',
  retryLabel: 'Reintentar',
};

/** Summary copy both countries share; each country adds the texts that differ (AC-073). */
const SUMMARY_COPY = {
  planHeading: 'Tu plan',
  editLabel: 'Editar',
  changePlanLabel: 'Cambiar plan',
  yesLabel: 'Sí',
  noLabel: 'No',
  acceptTermsLabel: 'Acepto los términos y condiciones',
  viewTermsLabel: 'Ver términos y condiciones',
  termsCloseLabel: 'Cerrar',
  payLabel: 'Pagar',
  processingLabel: 'Procesando tu pago…',
  processingLeaveTitle: '¿Quieres salir mientras procesamos tu pago?',
  processingLeaveStayLabel: 'Esperar el pago',
  processingLeaveConfirmLabel: 'Salir',
  quoteNumberLabel: 'Número de cotización',
  planLabel: 'Plan',
  newQuoteLabel: 'Nueva cotización',
};

const plan = (currency: string, seed: Omit<PlanSeed, 'currency'>): PlanSeed => ({
  currency,
  ...seed,
});

const colombianPlan = (seed: Omit<PlanSeed, 'currency'>) => plan('COP', seed);
const chileanPlan = (seed: Omit<PlanSeed, 'currency'>) => plan('CLP', seed);

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
    planCopy: {
      ...PLAN_COPY,
      noPlansMessage: 'Por ahora no tenemos planes disponibles para cotizar. Inténtalo más tarde.',
      choosePlanMessage: 'Elige un plan para continuar.',
      priceErrorMessage: 'No pudimos calcular tu precio.',
    },
    summaryCopy: {
      ...SUMMARY_COPY,
      finalPriceLabel: 'Tu precio anual',
      termsTitle: 'Términos y condiciones',
      acceptTermsMessage: 'Acepta los términos y condiciones para poder pagar.',
      processingLeaveMessage:
        'Si sales ahora, tu pago no quedará registrado y tendrás que pagar de nuevo.',
      paymentErrorMessage:
        'No pudimos procesar tu pago. Tus datos siguen aquí; inténtalo de nuevo.',
      confirmationTitle: '¡Listo! Recibimos tu pago',
      confirmationMessage: 'Tu seguro de auto quedó contratado. Guarda tu número de cotización.',
      amountPaidLabel: 'Valor pagado',
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
          kind: 'identityDocumentNumber',
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
  plans: [
    colombianPlan({
      name: 'Plan Básico',
      description: 'Lo esencial para circular tranquilo y cumplir con terceros.',
      basePrice: 1200000,
      order: 1,
      recommended: false,
      coverages: [
        { name: 'Responsabilidad civil extracontractual', highlight: 'Hasta $ 1.000 millones' },
        { name: 'Asistencia en carretera', highlight: 'Grúa hasta 50 km' },
        { name: 'Asistencia jurídica' },
      ],
      benefits: [],
    }),
    colombianPlan({
      name: 'Plan Clásico',
      description: 'Protección completa para tu carro en el día a día.',
      basePrice: 1850000,
      order: 2,
      recommended: true,
      coverages: [
        { name: 'Responsabilidad civil extracontractual', highlight: 'Hasta $ 2.000 millones' },
        { name: 'Pérdida total por daños o hurto', highlight: '100 % del valor comercial' },
        { name: 'Pérdida parcial por daños', highlight: 'Deducible de $ 1.000.000' },
        { name: 'Asistencia en carretera', highlight: 'Grúa hasta 150 km' },
      ],
      benefits: [{ text: 'Vehículo de reemplazo por 10 días' }],
    }),
    colombianPlan({
      name: 'Plan Global',
      description: 'La cobertura más amplia, sin deducible en pérdidas parciales.',
      basePrice: 2600000,
      order: 3,
      recommended: false,
      coverages: [
        { name: 'Responsabilidad civil extracontractual', highlight: 'Hasta $ 4.000 millones' },
        { name: 'Pérdida total por daños o hurto', highlight: '100 % del valor comercial' },
        { name: 'Pérdida parcial por daños', highlight: 'Sin deducible' },
        { name: 'Asistencia en carretera', highlight: 'Grúa sin límite de km' },
      ],
      benefits: [
        { text: 'Vehículo de reemplazo por 20 días' },
        { text: 'Conductor elegido 4 veces al año' },
      ],
    }),
  ],
  terms: {
    text: [
      'Estos términos y condiciones son ficticios y existen solo para esta demostración. No constituyen una oferta real de seguro.',
      'El seguro de auto cubre, durante un año contado desde la fecha del pago, los riesgos descritos en el plan elegido, con los valores asegurados y deducibles que el plan indica.',
      'El valor a pagar es el precio anual mostrado en el resumen. Si los datos que ingresaste no son correctos, la aseguradora ficticia podrá ajustar el precio o terminar el contrato.',
      'Puedes retractarte dentro de los cinco días hábiles siguientes al pago, sin costo, escribiendo a la línea de atención ficticia.\nLínea de atención: 601 000 0000\nHorario: lunes a viernes, 8:00 a 18:00',
      'La aseguradora ficticia trata tus datos solo para gestionar esta cotización. En esta demostración ningún dato sale de tu navegador, salvo el país y el plan elegido.',
      'Las exclusiones generales, como conducir sin licencia vigente o bajo los efectos del alcohol, aplican a todos los planes.',
    ].join('\n\n'),
  },
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
    planCopy: {
      ...PLAN_COPY,
      noPlansMessage:
        'En este momento no hay planes disponibles para cotizar. Vuelve a intentarlo más tarde.',
      choosePlanMessage: 'Selecciona un plan para continuar.',
      priceErrorMessage: 'No pudimos calcular tu precio en este momento.',
    },
    summaryCopy: {
      ...SUMMARY_COPY,
      finalPriceLabel: 'Tu monto anual',
      termsTitle: 'Condiciones del seguro',
      acceptTermsMessage: 'Debes aceptar los términos y condiciones para pagar.',
      processingLeaveMessage:
        'Si sales ahora, el pago no quedará registrado y deberás pagar otra vez.',
      paymentErrorMessage:
        'No fue posible procesar tu pago. Tus datos se mantienen; vuelve a intentarlo.',
      confirmationTitle: '¡Listo! Tu pago fue aprobado',
      confirmationMessage: 'Tu seguro automotriz quedó contratado. Guarda tu número de cotización.',
      amountPaidLabel: 'Monto pagado',
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
          kind: 'identityDocumentNumber',
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
  plans: [
    chileanPlan({
      name: 'Plan Esencial',
      description: 'Cubre los daños que puedas causar a terceros.',
      basePrice: 350000,
      order: 1,
      recommended: false,
      coverages: [
        { name: 'Responsabilidad civil', highlight: 'Hasta UF 500' },
        { name: 'Asistencia en ruta', highlight: 'Grúa hasta 50 km' },
      ],
      benefits: [],
    }),
    chileanPlan({
      name: 'Plan Full',
      description: 'Protege tu auto y a terceros con un deducible moderado.',
      basePrice: 520000,
      order: 2,
      recommended: true,
      coverages: [
        { name: 'Responsabilidad civil', highlight: 'Hasta UF 1.000' },
        { name: 'Daños propios y robo', highlight: 'Deducible UF 5' },
        { name: 'Asistencia en ruta', highlight: 'Grúa hasta 200 km' },
      ],
      benefits: [{ text: 'Auto de reemplazo por 7 días' }],
    }),
    chileanPlan({
      name: 'Plan Premium',
      description: 'La protección más completa, con deducible reducido.',
      basePrice: 690000,
      order: 3,
      recommended: false,
      coverages: [
        { name: 'Responsabilidad civil', highlight: 'Hasta UF 2.000' },
        { name: 'Daños propios y robo', highlight: 'Deducible UF 3' },
        { name: 'Asistencia en ruta', highlight: 'Grúa sin límite de km' },
      ],
      benefits: [
        { text: 'Auto de reemplazo por 15 días' },
        { text: 'Revisión técnica a domicilio' },
      ],
    }),
  ],
  terms: {
    text: [
      'Las presentes condiciones son ficticias y se usan únicamente para esta demostración. No corresponden a una póliza real.',
      'El seguro automotriz rige por doce meses desde la fecha del pago y cubre los riesgos indicados en el plan contratado, con los montos y deducibles en UF que el plan señala.',
      'La prima es el monto anual informado en el resumen. Declarar información inexacta puede dar lugar al ajuste de la prima o al término anticipado del seguro.',
      'Puedes solicitar el término del seguro en cualquier momento a través del canal de atención ficticio; la devolución de la prima no consumida se calcula por días.\nCanal de atención: 600 000 0000',
      'Tus datos personales se usan solo para esta cotización y no se envían a ningún servidor en esta demostración, salvo el país y el plan elegido.',
    ].join('\n\n'),
  },
};

export const SEED_COUNTRIES: readonly CountrySeed[] = [COLOMBIA, CHILE];
