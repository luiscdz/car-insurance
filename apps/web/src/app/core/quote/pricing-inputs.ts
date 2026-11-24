import type { PricingInput, WizardData, WizardStep } from '@car-insurance/shared';
import { ageInYears, calendarDateOf, parseIsoDate } from '../../shared/utils/field-validation/age';

/** The inputs of the price rule derived on the device; an absent input is not available. */
export interface PricingInputs {
  policyholderAge?: number;
  vehicleAge?: number;
}

const WHOLE_NUMBER = /^-?\d+$/;

/** Stored text value of the field carrying a pricing mark, if any (AC-044). */
function markedValue(
  steps: readonly WizardStep[],
  data: WizardData,
  mark: PricingInput,
): string | null {
  for (const step of steps) {
    const field = step.fields.find((candidate) => candidate.pricingInput === mark);
    if (field) {
      const value = data.steps[step.slug]?.values[field.name];
      return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
    }
  }
  return null;
}

/**
 * Derives the price rule inputs from the stored values of the fields marked in Strapi (AC-044):
 * the policyholder's age in whole years on the device's date, as for the legal age of AC-014, and
 * the vehicle's age as the current year minus the vehicle year. No field, step or country is named.
 */
export function pricingInputs(
  steps: readonly WizardStep[],
  data: WizardData,
  today: Date,
): PricingInputs {
  const inputs: PricingInputs = {};
  const birth = markedValue(steps, data, 'birthDate');
  const birthDate = birth === null ? null : parseIsoDate(birth);
  if (birthDate !== null) {
    inputs.policyholderAge = ageInYears(birthDate, calendarDateOf(today));
  }
  const year = markedValue(steps, data, 'vehicleYear');
  if (year !== null && WHOLE_NUMBER.test(year)) {
    inputs.vehicleAge = today.getFullYear() - Number(year);
  }
  return inputs;
}
