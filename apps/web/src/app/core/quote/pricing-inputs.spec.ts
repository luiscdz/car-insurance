import type { WizardData } from '@car-insurance/shared';
import {
  chileContent,
  colombiaContent,
  colombiaFields,
  colombiaPricingFields,
  TODAY,
} from '../../../testing/content-fixtures';
import { pricingInputs } from './pricing-inputs';

const colombia = colombiaContent([...colombiaFields(), ...colombiaPricingFields()]).steps;
const chile = chileContent().steps;

describe('pricingInputs', () => {
  it('AC-044 derives both ages from the Colombian form step that carries both marks', () => {
    const data: WizardData = {
      steps: {
        'tus-datos-y-tu-vehiculo': {
          values: { 'fecha-nacimiento': '2004-11-23', anio: '2018', placa: 'ABC123' },
          complete: true,
        },
      },
    };

    expect(pricingInputs(colombia, data, TODAY)).toEqual({ policyholderAge: 22, vehicleAge: 8 });
  });

  it('AC-044 derives the ages from the marks of two different Chilean form steps', () => {
    const data: WizardData = {
      steps: {
        'tus-datos': {
          values: { rut: '1234567-8', 'fecha-nacimiento': '1956-11-24' },
          complete: true,
        },
        'tu-vehiculo': { values: { marca: 'toyota', anio: '2011' }, complete: true },
      },
    };

    expect(pricingInputs(chile, data, TODAY)).toEqual({ policyholderAge: 69, vehicleAge: 15 });
  });

  it('AC-044 a vehicle of next year has age -1 and a birthday today completes the year', () => {
    const data: WizardData = {
      steps: {
        'tus-datos': { values: { 'fecha-nacimiento': '2000-11-23' }, complete: true },
        'tu-vehiculo': { values: { anio: '2027' }, complete: true },
      },
    };

    expect(pricingInputs(chile, data, TODAY)).toEqual({ policyholderAge: 26, vehicleAge: -1 });
  });

  it('AC-044 a 29 February birthday is reached on 1 March in years that are not leap years', () => {
    const born = (date: string): WizardData => ({
      steps: { 'tus-datos': { values: { 'fecha-nacimiento': date }, complete: true } },
    });

    expect(pricingInputs(chile, born('2008-02-29'), new Date(2026, 1, 28))).toEqual({
      policyholderAge: 17,
    });
    expect(pricingInputs(chile, born('2008-02-29'), new Date(2026, 2, 1))).toEqual({
      policyholderAge: 18,
    });
  });

  it('AC-044 an input is not available when no field carries its mark', () => {
    const unmarked = colombiaContent().steps;
    const data: WizardData = {
      steps: { 'tus-datos-y-tu-vehiculo': { values: { placa: 'ABC123' }, complete: true } },
    };

    expect(pricingInputs(unmarked, data, TODAY)).toEqual({});
  });

  it('AC-044 an input is not available when the marked field has no usable stored value', () => {
    expect(pricingInputs(chile, { steps: {} }, TODAY)).toEqual({});
    const data: WizardData = {
      steps: {
        'tus-datos': { values: { 'fecha-nacimiento': '  ' }, complete: false },
        'tu-vehiculo': { values: { anio: 'dos mil' }, complete: false },
      },
    };
    expect(pricingInputs(chile, data, TODAY)).toEqual({});
  });
});
