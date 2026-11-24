// Type-level conformance between the generated Strapi types and the shared content types.
import type {
  CountryDetailInput,
  FieldOption,
  FieldValidation,
  FormFieldInput,
  Theme,
  WizardCopy,
  WizardStepInput,
} from '@car-insurance/shared';
import { describe, expectTypeOf, it } from 'vitest';
import type {
  CountryTheme,
  CountryWizardCopy,
  FormOption,
  FormValidation,
} from '../types/generated/components';
import type {
  ApiCountryCountry,
  ApiFormFieldFormField,
  ApiWizardStepWizardStep,
} from '../types/generated/contentTypes';

type Attributes<T extends { attributes: object }> = keyof T['attributes'];

describe('generated Strapi types', () => {
  it('AC-031 AC-032 declare every attribute the shared content types read', () => {
    expectTypeOf<keyof CountryDetailInput>().toExtend<Attributes<ApiCountryCountry>>();
    expectTypeOf<keyof WizardCopy>().toEqualTypeOf<Attributes<CountryWizardCopy>>();
    expectTypeOf<keyof Theme>().toEqualTypeOf<Attributes<CountryTheme>>();
    expectTypeOf<keyof WizardStepInput>().toExtend<Attributes<ApiWizardStepWizardStep>>();
    expectTypeOf<keyof FormFieldInput>().toExtend<Attributes<ApiFormFieldFormField>>();
    expectTypeOf<keyof FieldOption>().toEqualTypeOf<Attributes<FormOption>>();
    expectTypeOf<keyof FieldValidation>().toEqualTypeOf<Attributes<FormValidation>>();
  });
});
