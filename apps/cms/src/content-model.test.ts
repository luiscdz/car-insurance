// Conformance between the Strapi content model (schema.json, the source of the generated types in
// types/generated) and the shared Zod schemas the web application validates content with (P3).
import {
  countryDetailSchema,
  FIELD_TYPES,
  fieldOptionSchema,
  fieldValidationSchema,
  formFieldSchema,
  KEY_PATTERN,
  STEP_TYPES,
  themeSchema,
  wizardCopySchema,
  wizardStepSchema,
} from '@car-insurance/shared';
import { describe, expect, it } from 'vitest';
import country from './api/country/content-types/country/schema.json';
import formField from './api/form-field/content-types/form-field/schema.json';
import wizardStep from './api/wizard-step/content-types/wizard-step/schema.json';
import theme from './components/country/theme.json';
import wizardCopy from './components/country/wizard-copy.json';
import option from './components/form/option.json';
import validation from './components/form/validation.json';

/** Attributes the content API returns, without the relations used only to filter by country. */
function contentKeys(attributes: Record<string, unknown>, relations: string[] = []): string[] {
  return Object.keys(attributes)
    .filter((key) => !relations.includes(key))
    .sort();
}

function schemaKeys(shape: Record<string, unknown>): string[] {
  return Object.keys(shape)
    .filter((key) => key !== 'createdAt')
    .sort();
}

describe('content model conformance', () => {
  it('AC-031 AC-032 country attributes match the shared country schema', () => {
    expect(contentKeys(country.attributes, ['steps'])).toEqual(
      schemaKeys(countryDetailSchema.shape),
    );
    expect(contentKeys(wizardCopy.attributes)).toEqual(schemaKeys(wizardCopySchema.shape));
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
  });

  it('AC-007 every content type the wizard reads has draft and publish', () => {
    for (const schema of [country, wizardStep, formField]) {
      expect(schema.options.draftAndPublish).toBe(true);
    }
  });
});
