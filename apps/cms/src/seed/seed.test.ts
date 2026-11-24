import {
  countryDetailSchema,
  type FormFieldContent,
  type Plan,
  themeSchema,
  wizardContentSchema,
  type WizardStep,
  wizardStepsSchema,
} from '@car-insurance/shared';
import { describe, expect, it } from 'vitest';
import { CHILE, COLOMBIA, type CountrySeed, SEED_COUNTRIES } from './countries';

function parse(seed: CountrySeed) {
  return {
    country: countryDetailSchema.parse(seed.country),
    theme: themeSchema.parse(seed.country.theme),
    steps: wizardStepsSchema.parse(seed.steps),
  };
}

/** The seeded country validated as the wizard validates it, with fictitious document ids. */
function content(seed: CountrySeed) {
  return wizardContentSchema.parse({
    country: seed.country,
    steps: seed.steps,
    plans: seed.plans.map((plan, index) => ({ ...plan, documentId: `seed-${index}` })),
    terms: [seed.terms],
  });
}

function summary(plan: Plan) {
  return [plan.order, plan.name, plan.basePrice, plan.currency, plan.recommended];
}

function expectPlanContent(plans: readonly Plan[]): void {
  for (const plan of plans) {
    expect(plan.description.trim()).not.toBe('');
    expect(plan.coverages.length).toBeGreaterThanOrEqual(2);
    expect(plan.coverages.some((coverage) => coverage.highlight !== null)).toBe(true);
  }
  expect(plans.map((plan) => plan.benefits.length)).toEqual([0, 1, 2]);
}

function markedFields(steps: WizardStep[]): Record<string, [string, string]> {
  return Object.fromEntries(
    steps.flatMap((step) =>
      step.fields
        .filter((field) => field.pricingInput !== null)
        .map((field) => [field.pricingInput, [step.slug, field.label]]),
    ),
  );
}

function kindFields(steps: WizardStep[]): [string, string][] {
  return steps.flatMap((step) =>
    step.fields
      .filter((field) => field.kind === 'identityDocumentNumber')
      .map((field): [string, string] => [step.slug, field.label]),
  );
}

function formFields(steps: WizardStep[], slug: string): FormFieldContent[] {
  const step = steps.find((candidate) => candidate.slug === slug);
  if (!step) {
    throw new Error(`Missing step ${slug}`);
  }
  return step.fields;
}

function matches(field: FormFieldContent | undefined, value: string): boolean {
  const pattern = field?.validation.pattern;
  if (!pattern) {
    throw new Error(`Field ${field?.name} has no pattern`);
  }
  return new RegExp(pattern).test(value);
}

function expectSpanishTexts(fields: FormFieldContent[]): void {
  for (const field of fields) {
    expect(field.required).toBe(true);
    expect(field.label.trim()).not.toBe('');
    expect(field.helpText?.trim()).toBeTruthy();
    expect(field.errorMessage.trim()).not.toBe('');
  }
}

describe('seed content', () => {
  it('AC-031 AC-032 seeds valid content for both countries with different step configurations', () => {
    const parsed = SEED_COUNTRIES.map(parse);

    expect(parsed.map(({ country }) => country.code)).toEqual(['co', 'cl']);
    expect(parsed[0]?.steps.length).not.toBe(parsed[1]?.steps.length);
  });

  it('AC-031 seeds Colombia with its identifiers, steps and form fields', () => {
    const { country, steps } = parse(COLOMBIA);

    expect([country.code, country.currency, country.formatLocale]).toEqual(['co', 'COP', 'es-CO']);
    expect(steps.map((step) => [step.order, step.title, step.type])).toEqual([
      [1, 'Tus datos y tu vehículo', 'form'],
      [2, 'Elige tu plan', 'plans'],
      [3, 'Resumen y pago', 'summary'],
    ]);
    const fields = formFields(steps, 'tus-datos-y-tu-vehiculo');
    expect(fields.map((field) => [field.label, field.type])).toEqual([
      ['Tipo de documento', 'select'],
      ['Número de documento', 'text'],
      ['Fecha de nacimiento', 'date'],
      ['Placa', 'text'],
      ['Marca', 'select'],
      ['Año del vehículo', 'number'],
    ]);
    expectSpanishTexts(fields);
    expect(fields[0]?.options.map((option) => option.label)).toEqual([
      'Cédula de ciudadanía',
      'Cédula de extranjería',
    ]);
    expect(fields[4]?.options.length).toBeGreaterThanOrEqual(3);
    expect(fields[2]?.validation.minAge).toBe(18);
    expect(fields[5]?.validation).toMatchObject({ integer: true, yearsBefore: 20, yearsAfter: 1 });
  });

  it('AC-031 seeds Colombian document number and plate formats, letters in either case', () => {
    const fields = formFields(parse(COLOMBIA).steps, 'tus-datos-y-tu-vehiculo');
    const [, documentNumber, , plate] = fields;

    expect(['123456', '1234567890'].every((value) => matches(documentNumber, value))).toBe(true);
    expect(['12345', '12345678901', '12a456'].some((value) => matches(documentNumber, value))).toBe(
      false,
    );
    expect(['ABC123', 'abc123', 'aBc123'].every((value) => matches(plate, value))).toBe(true);
    expect(['AB1234', 'ABCD12', 'ABC12'].some((value) => matches(plate, value))).toBe(false);
  });

  it('AC-032 seeds Chile with its identifiers, two form steps and their fields', () => {
    const { country, steps } = parse(CHILE);

    expect([country.code, country.currency, country.formatLocale]).toEqual(['cl', 'CLP', 'es-CL']);
    expect(steps.map((step) => [step.order, step.title, step.type])).toEqual([
      [1, 'Tus datos', 'form'],
      [2, 'Tu vehículo', 'form'],
      [3, 'Elige tu plan', 'plans'],
      [4, 'Resumen y pago', 'summary'],
    ]);
    const personal = formFields(steps, 'tus-datos');
    const vehicle = formFields(steps, 'tu-vehiculo');
    expect(personal.map((field) => [field.label, field.type])).toEqual([
      ['RUT', 'text'],
      ['Fecha de nacimiento', 'date'],
    ]);
    expect(vehicle.map((field) => [field.label, field.type])).toEqual([
      ['Patente', 'text'],
      ['Marca', 'select'],
      ['Año del vehículo', 'number'],
    ]);
    expectSpanishTexts([...personal, ...vehicle]);
    expect(personal[1]?.validation.minAge).toBe(18);
    expect(vehicle[1]?.options.length).toBeGreaterThanOrEqual(3);
    expect(vehicle[2]?.validation).toMatchObject({ integer: true, yearsBefore: 20, yearsAfter: 1 });
  });

  it('AC-032 seeds Chilean RUT and licence plate formats, letters and K in either case', () => {
    const steps = parse(CHILE).steps;
    const [rut] = formFields(steps, 'tus-datos');
    const [plate] = formFields(steps, 'tu-vehiculo');

    const validRuts = ['12.345.678-5', '12345678-5', '1.234.567-K', '1234567-k', '7654321-0'];
    expect(validRuts.every((value) => matches(rut, value))).toBe(true);
    const invalidRuts = ['123456-5', '123456789-5', '12.345.678', '12.345.678-A', '12,345,678-5'];
    expect(invalidRuts.some((value) => matches(rut, value))).toBe(false);
    expect(['BBBB12', 'bbbb12', 'AB1234', 'ab1234'].every((value) => matches(plate, value))).toBe(
      true,
    );
    expect(['ABC123', 'BBBB123', 'A12345'].some((value) => matches(plate, value))).toBe(false);
  });

  it('AC-003 seeds the SURA theme for both countries', () => {
    for (const seed of SEED_COUNTRIES) {
      expect(parse(seed).theme).toEqual({ primaryColor: '#2D6DF6', accentColor: '#00AEC7' });
    }
  });

  it('AC-064 seeds the published, active plans of Colombia in COP, in order, with their content', () => {
    const { plans } = content(COLOMBIA);

    expect(plans.map(summary)).toEqual([
      [1, 'Plan Básico', 1200000, 'COP', false],
      [2, 'Plan Clásico', 1850000, 'COP', true],
      [3, 'Plan Global', 2600000, 'COP', false],
    ]);
    expectPlanContent(plans);
  });

  it('AC-065 seeds the published, active plans of Chile in CLP, in order, with their content', () => {
    const { plans } = content(CHILE);

    expect(plans.map(summary)).toEqual([
      [1, 'Plan Esencial', 350000, 'CLP', false],
      [2, 'Plan Full', 520000, 'CLP', true],
      [3, 'Plan Premium', 690000, 'CLP', false],
    ]);
    expectPlanContent(plans);
  });

  it('AC-064 AC-065 seeds the plan list copy of both countries in Spanish', () => {
    const colombia = content(COLOMBIA).country.planCopy;
    const chile = content(CHILE).country.planCopy;

    expect(colombia).toMatchObject({
      chooseLabel: 'Elegir este plan',
      chosenLabel: 'Plan elegido',
      recommendedLabel: 'Recomendado',
      basePriceLabel: 'Precio base anual',
      finalPriceLabel: 'Tu precio anual',
    });
    expect(chile.noPlansMessage).not.toBe(colombia.noPlansMessage);
    expect(Object.values(chile).every((text) => text.trim() !== '')).toBe(true);
  });

  it('AC-064 marks the birth date and the vehicle year of the Colombian form step for pricing', () => {
    expect(markedFields(content(COLOMBIA).steps)).toEqual({
      birthDate: ['tus-datos-y-tu-vehiculo', 'Fecha de nacimiento'],
      vehicleYear: ['tus-datos-y-tu-vehiculo', 'Año del vehículo'],
    });
  });

  it('AC-065 marks the birth date in "Tus datos" and the vehicle year in "Tu vehículo" for pricing', () => {
    expect(markedFields(content(CHILE).steps)).toEqual({
      birthDate: ['tus-datos', 'Fecha de nacimiento'],
      vehicleYear: ['tu-vehiculo', 'Año del vehículo'],
    });
  });

  it('AC-094 seeds the summary copy of Colombia in Spanish with the agreed texts', () => {
    const copy = content(COLOMBIA).country.summaryCopy;

    expect(copy).toMatchObject({
      payLabel: 'Pagar',
      processingLabel: 'Procesando tu pago…',
      acceptTermsLabel: 'Acepto los términos y condiciones',
      viewTermsLabel: 'Ver términos y condiciones',
      editLabel: 'Editar',
      changePlanLabel: 'Cambiar plan',
      quoteNumberLabel: 'Número de cotización',
      newQuoteLabel: 'Nueva cotización',
      processingLeaveTitle: '¿Quieres salir mientras procesamos tu pago?',
    });
  });

  it('AC-095 seeds the summary copy of Chile in Spanish, different from Colombia where the texts differ', () => {
    const chile = content(CHILE).country.summaryCopy;
    const colombia = content(COLOMBIA).country.summaryCopy;

    expect(Object.values(chile).every((text) => text.trim() !== '')).toBe(true);
    expect(chile.payLabel).toBe('Pagar');
    expect(chile.amountPaidLabel).not.toBe(colombia.amountPaidLabel);
    expect(chile.termsTitle).not.toBe(colombia.termsTitle);
  });

  it('AC-094 AC-095 seeds one fictitious terms entry per country, of at least two paragraphs, different by country', () => {
    const colombia = content(COLOMBIA).terms.text;
    const chile = content(CHILE).terms.text;

    for (const text of [colombia, chile]) {
      expect(
        text.split(/\n[ \t]*\n/).filter((block) => block.trim() !== '').length,
      ).toBeGreaterThanOrEqual(2);
      expect(text).toMatch(/ficticia/);
    }
    expect(chile).not.toBe(colombia);
  });

  it('AC-094 marks only "Número de documento" of Colombia as the identity document number', () => {
    expect(kindFields(content(COLOMBIA).steps)).toEqual([
      ['tus-datos-y-tu-vehiculo', 'Número de documento'],
    ]);
  });

  it('AC-095 marks only "RUT" of "Tus datos" in Chile as the identity document number', () => {
    expect(kindFields(content(CHILE).steps)).toEqual([['tus-datos', 'RUT']]);
  });
});
