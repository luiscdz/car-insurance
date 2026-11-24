// Conformance between the Strapi content model (schema.json, the source of the generated types in
// types/generated) and the shared Zod schemas the web application validates content with (P3).
import {
  countryDetailSchema,
  FIELD_KINDS,
  FIELD_TYPES,
  fieldOptionSchema,
  fieldValidationSchema,
  formFieldSchema,
  KEY_PATTERN,
  planBenefitSchema,
  planCopySchema,
  planCoverageSchema,
  planSchema,
  PRICING_INPUTS,
  STEP_TYPES,
  summaryCopySchema,
  termsEntrySchema,
  themeSchema,
  wizardCopySchema,
  wizardStepSchema,
} from '@car-insurance/shared';
import { describe, expect, it } from 'vitest';
import country from './api/country/content-types/country/schema.json';
import formField from './api/form-field/content-types/form-field/schema.json';
import plan from './api/plan/content-types/plan/schema.json';
import terms from './api/terms/content-types/term/schema.json';
import wizardStep from './api/wizard-step/content-types/wizard-step/schema.json';
import planCopy from './components/country/plan-copy.json';
import summaryCopy from './components/country/summary-copy.json';
import theme from './components/country/theme.json';
import wizardCopy from './components/country/wizard-copy.json';
import option from './components/form/option.json';
import validation from './components/form/validation.json';
import benefit from './components/plan/benefit.json';
import coverage from './components/plan/coverage.json';

/** Attributes the content API returns, without the relations used only to filter by country. */
function contentKeys(attributes: Record<string, unknown>, relations: string[] = []): string[] {
  return Object.keys(attributes)
    .filter((key) => !relations.includes(key))
    .sort();
}

/** Keys of a shared schema, without the identifiers and timestamps Strapi adds to every entry. */
function schemaKeys(shape: Record<string, unknown>): string[] {
  return Object.keys(shape)
    .filter((key) => key !== 'createdAt' && key !== 'documentId')
    .sort();
}

describe('content model conformance', () => {
  it('AC-031 AC-032 AC-073 country attributes match the shared country schema', () => {
    expect(contentKeys(country.attributes, ['steps', 'plans', 'terms'])).toEqual(
      schemaKeys(countryDetailSchema.shape),
    );
    expect(contentKeys(wizardCopy.attributes)).toEqual(schemaKeys(wizardCopySchema.shape));
    expect(contentKeys(planCopy.attributes)).toEqual(schemaKeys(planCopySchema.shape));
    expect(contentKeys(summaryCopy.attributes)).toEqual(schemaKeys(summaryCopySchema.shape));
    expect(Object.values(summaryCopy.attributes).every((attribute) => attribute.required)).toBe(
      true,
    );
    expect(country.attributes.summaryCopy.required).toBe(true);
    expect(contentKeys(theme.attributes)).toEqual(schemaKeys(themeSchema.shape));
  });

  it('AC-031 AC-032 wizard step attributes match the shared step schema', () => {
    expect(contentKeys(wizardStep.attributes, ['country'])).toEqual(
      schemaKeys(wizardStepSchema.in.shape),
    );
    expect(wizardStep.attributes.type.enum).toEqual([...STEP_TYPES]);
    expect(wizardStep.attributes.slug.regex).toBe(KEY_PATTERN.source);
  });

  it('AC-031 AC-032 form field attributes match the shared field schema', () => {
    expect(contentKeys(formField.attributes, ['step'])).toEqual(
      schemaKeys(formFieldSchema.in.shape),
    );
    expect(formField.attributes.type.enum).toEqual([...FIELD_TYPES]);
    expect(formField.attributes.name.regex).toBe(KEY_PATTERN.source);
    expect(contentKeys(option.attributes)).toEqual(schemaKeys(fieldOptionSchema.shape));
    expect(contentKeys(validation.attributes)).toEqual(schemaKeys(fieldValidationSchema.shape));
    expect(formField.attributes.pricingInput.enum).toEqual([...PRICING_INPUTS]);
  });

  it('AC-069 the form field kind lists exactly the shared field kinds and is optional', () => {
    expect(formField.attributes.kind.enum).toEqual([...FIELD_KINDS]);
    expect('required' in formField.attributes.kind).toBe(false);
  });

  it('AC-074 AC-077 terms attributes match the shared terms schema and belong to a country', () => {
    expect(contentKeys(terms.attributes, ['country'])).toEqual(schemaKeys(termsEntrySchema.shape));
    expect(terms.attributes.country.target).toBe('api::country.country');
    expect(terms.attributes.text.required).toBe(true);
    expect(country.attributes.terms.target).toBe('api::terms.term');
    expect(terms.info.pluralName).toBe('terms');
  });

  it('AC-036 AC-041 AC-064 AC-065 plan attributes match the shared plan schema', () => {
    // `country` and `active` are only used to filter which plans the wizard receives (AC-036).
    expect(contentKeys(plan.attributes, ['country', 'active'])).toEqual(
      schemaKeys(planSchema.in.shape),
    );
    expect(contentKeys(coverage.attributes)).toEqual(schemaKeys(planCoverageSchema.in.shape));
    expect(contentKeys(benefit.attributes)).toEqual(schemaKeys(planBenefitSchema.shape));
    expect(plan.attributes.country.target).toBe('api::country.country');
    expect(plan.attributes.active.default).toBe(true);
    expect(plan.attributes.recommended.default).toBe(false);
    expect(plan.attributes.basePrice.min).toBe(1);
  });

  it('AC-007 AC-039 AC-074 every content type the wizard reads has draft and publish', () => {
    for (const schema of [country, wizardStep, formField, plan, terms]) {
      expect(schema.options.draftAndPublish).toBe(true);
    }
  });
});
