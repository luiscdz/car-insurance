import { describe, expect, it } from 'vitest';
import { fieldFixture } from '../test-fixtures.js';
import { fieldValidationSchema, formFieldSchema } from './form-field.js';

describe('form field schema', () => {
  it('AC-006 sorts select options by their configured order', () => {
    const parsed = formFieldSchema.parse(
      fieldFixture({
        name: 'marca',
        type: 'select',
        options: [
          { value: 'kia', label: 'Kia', order: 3 },
          { value: 'chevrolet', label: 'Chevrolet', order: 1 },
          { value: 'renault', label: 'Renault', order: 2 },
        ],
      }),
    );

    expect(parsed.options.map((option) => option.label)).toEqual(['Chevrolet', 'Renault', 'Kia']);
  });

  it('AC-012 applies defaults: optional when required is absent, no validations, no options', () => {
    const parsed = formFieldSchema.parse(
      fieldFixture({
        name: 'uso',
        type: 'checkbox',
        required: null,
        options: null,
        validation: null,
      }),
    );

    expect(parsed.required).toBe(false);
    expect(parsed.options).toEqual([]);
    expect(parsed.validation).toEqual({});
  });

  it.each([
    ['a field without label', { label: '' }],
    ['a field without error message', { errorMessage: ' ' }],
    ['an unknown field type', { type: 'color' }],
    ['a select without options', { type: 'select', options: [] }],
    [
      'repeated option values',
      {
        type: 'select',
        options: [
          { value: 'a', label: 'A', order: 1 },
          { value: 'a', label: 'B', order: 2 },
        ],
      },
    ],
    ['a name that is not a key', { name: 'Tipo Documento' }],
  ])('AC-017 rejects %s', (_, overrides) => {
    const candidate = { ...fieldFixture({ name: 'campo' }), ...overrides };

    expect(formFieldSchema.safeParse(candidate).success).toBe(false);
  });

  it.each([
    ['a minimum greater than its maximum', { min: 10, max: 1 }],
    ['a minimum length greater than its maximum length', { minLength: 5, maxLength: 4 }],
    ['an unusable pattern', { pattern: '([a-z' }],
    ['a blank pattern', { pattern: '  ' }],
    ['a year range with a missing value', { yearsBefore: 20 }],
    ['a negative minimum age', { minAge: -1 }],
    ['a decimal length', { maxLength: 2.5 }],
  ])('AC-017 rejects a validation with %s', (_, validation) => {
    expect(fieldValidationSchema.safeParse(validation).success).toBe(false);
  });

  it('AC-012 accepts equal limits and every supported validation', () => {
    expect(
      fieldValidationSchema.safeParse({
        minLength: 6,
        maxLength: 6,
        pattern: '^[0-9]+$',
        min: 1,
        max: 1,
        integer: true,
        minAge: 18,
        yearsBefore: 20,
        yearsAfter: 1,
      }).success,
    ).toBe(true);
  });
});
