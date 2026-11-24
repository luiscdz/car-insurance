import {
  countryDetailSchema,
  type FormFieldContent,
  themeSchema,
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
});
