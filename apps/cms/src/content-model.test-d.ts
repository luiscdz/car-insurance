// Type-level conformance between the generated Strapi types and the shared content types.
import type {
  CountryDetailInput,
  FieldOption,
  FieldValidation,
  FormFieldInput,
  PlanBenefit as SharedPlanBenefit,
  PlanCopy,
  PlanInput,
  SummaryCopy,
  TermsEntry,
  Theme,
  WizardCopy,
  WizardStepInput,
} from '@car-insurance/shared';
import { describe, expectTypeOf, it } from 'vitest';
import type {
  CountryPlanCopy,
  CountrySummaryCopy,
  CountryTheme,
  CountryWizardCopy,
  FormOption,
  FormValidation,
  PlanBenefit,
  PlanCoverage,
} from '../types/generated/components';
import type {
  ApiCountryCountry,
  ApiFormFieldFormField,
  ApiPlanPlan,
  ApiTermsTerm,
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

  it('AC-040 AC-041 declare every attribute the shared plan types read', () => {
    expectTypeOf<keyof PlanCopy>().toEqualTypeOf<Attributes<CountryPlanCopy>>();
    expectTypeOf<Exclude<keyof PlanInput, 'documentId'>>().toExtend<Attributes<ApiPlanPlan>>();
    expectTypeOf<keyof PlanInput['coverages'][number]>().toEqualTypeOf<Attributes<PlanCoverage>>();
    expectTypeOf<keyof SharedPlanBenefit>().toEqualTypeOf<Attributes<PlanBenefit>>();
  });
  it('AC-069 AC-073 AC-077 declare every attribute the shared summary and terms types read', () => {
    expectTypeOf<keyof SummaryCopy>().toEqualTypeOf<Attributes<CountrySummaryCopy>>();
    expectTypeOf<keyof TermsEntry>().toExtend<Attributes<ApiTermsTerm>>();
    expectTypeOf<'summaryCopy' | 'terms'>().toExtend<Attributes<ApiCountryCountry>>();
    expectTypeOf<'kind'>().toExtend<Attributes<ApiFormFieldFormField>>();
  });
});
