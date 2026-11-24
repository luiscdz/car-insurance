import { z } from 'zod';
import { sortByOrder } from './order.js';
import {
  createdAtSchema,
  keySchema,
  nonBlankTextSchema,
  optionalTextSchema,
  orderSchema,
} from './primitives.js';

/** Field types implemented by the form step (ADR-001). */
export const FIELD_TYPES = ['text', 'number', 'select', 'date', 'checkbox'] as const;

export const fieldTypeSchema = z.enum(FIELD_TYPES);

/**
 * Marks that tell the price rule which field holds each of its inputs (AC-044): the policyholder's
 * birth date and the vehicle year. They are configuration; no code names a field to find them.
 */
export const PRICING_INPUTS = ['birthDate', 'vehicleYear'] as const;
export const pricingInputSchema = z.enum(PRICING_INPUTS);
export type PricingInput = z.output<typeof pricingInputSchema>;

/** The only field type each pricing mark may be placed on (AC-044). */
export const PRICING_INPUT_FIELD_TYPES: Readonly<Record<PricingInput, FieldType>> = {
  birthDate: 'date',
  vehicleYear: 'number',
};

export const fieldOptionSchema = z.object({
  value: nonBlankTextSchema,
  label: nonBlankTextSchema,
  order: orderSchema,
});

const nonNegativeIntegerSchema = z.number().int().min(0);

function compiles(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validations configured for a field. Every limit is inclusive. `minAge` applies to dates and
 * `yearsBefore`/`yearsAfter` define a year range relative to the current year (AC-012 to AC-014).
 */
export const fieldValidationSchema = z
  .object({
    minLength: nonNegativeIntegerSchema.nullish(),
    maxLength: nonNegativeIntegerSchema.nullish(),
    pattern: z.string().nullish(),
    min: z.number().nullish(),
    max: z.number().nullish(),
    integer: z.boolean().nullish(),
    minAge: nonNegativeIntegerSchema.nullish(),
    yearsBefore: nonNegativeIntegerSchema.nullish(),
    yearsAfter: nonNegativeIntegerSchema.nullish(),
  })
  .superRefine((validation, ctx) => {
    const { minLength, maxLength, min, max, pattern, yearsBefore, yearsAfter } = validation;
    if (minLength != null && maxLength != null && minLength > maxLength) {
      ctx.addIssue({ code: 'custom', message: 'minLength is greater than maxLength' });
    }
    if (min != null && max != null && min > max) {
      ctx.addIssue({ code: 'custom', message: 'min is greater than max' });
    }
    if (pattern != null && (pattern.trim() === '' || !compiles(pattern))) {
      ctx.addIssue({ code: 'custom', message: 'pattern is not a usable regular expression' });
    }
    if ((yearsBefore == null) !== (yearsAfter == null)) {
      ctx.addIssue({ code: 'custom', message: 'yearsBefore and yearsAfter go together' });
    }
  });

export type FieldValidation = z.output<typeof fieldValidationSchema>;

const NO_VALIDATION: FieldValidation = {};

/** A form field as configured in Strapi, with its options sorted and defaults applied. */
export const formFieldSchema = z
  .object({
    name: keySchema,
    label: nonBlankTextSchema,
    type: fieldTypeSchema,
    required: z.boolean().nullish(),
    placeholder: optionalTextSchema,
    helpText: optionalTextSchema,
    errorMessage: nonBlankTextSchema,
    order: orderSchema,
    options: z.array(fieldOptionSchema).nullish(),
    validation: fieldValidationSchema.nullish(),
    pricingInput: pricingInputSchema.nullish(),
    createdAt: createdAtSchema,
  })
  .superRefine((field, ctx) => {
    const options = field.options ?? [];
    if (field.type === 'select' && options.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'A select field needs at least one option' });
    }
    if (new Set(options.map((option) => option.value)).size !== options.length) {
      ctx.addIssue({ code: 'custom', message: 'Option values must be unique' });
    }
    if (
      field.pricingInput != null &&
      PRICING_INPUT_FIELD_TYPES[field.pricingInput] !== field.type
    ) {
      ctx.addIssue({ code: 'custom', message: 'A pricing mark is not allowed on this field type' });
    }
  })
  .transform((field) => ({
    ...field,
    required: field.required === true,
    options: sortByOrder(field.options ?? []),
    validation: field.validation ?? NO_VALIDATION,
    pricingInput: field.pricingInput ?? null,
  }));

export type FieldType = z.output<typeof fieldTypeSchema>;
export type FieldOption = z.output<typeof fieldOptionSchema>;
export type FormFieldContent = z.output<typeof formFieldSchema>;
export type FormFieldInput = z.input<typeof formFieldSchema>;
