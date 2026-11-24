import { z } from 'zod';
import { sortByOrder } from './order.js';
import {
  createdAtSchema,
  currencyCodeSchema,
  nonBlankTextSchema,
  orderSchema,
} from './primitives.js';

/**
 * A coverage of a plan: its name and, optionally, a highlighted value written by the business
 * team as free text, for example a limit (AC-037). A highlight that is present must not be blank.
 */
export const planCoverageSchema = z
  .object({
    name: nonBlankTextSchema,
    highlight: nonBlankTextSchema.nullish(),
  })
  .transform((coverage) => ({ name: coverage.name, highlight: coverage.highlight ?? null }));

/** A benefit of a plan (AC-037). */
export const planBenefitSchema = z.object({
  text: nonBlankTextSchema,
});

/**
 * A published, active plan of a country as configured in Strapi (AC-037, AC-041). The base price
 * is a whole amount of the currency greater than zero; an absent recommended flag means false;
 * benefits may be empty but every plan has at least one coverage.
 */
export const planSchema = z
  .object({
    documentId: nonBlankTextSchema,
    name: nonBlankTextSchema,
    description: nonBlankTextSchema,
    basePrice: z.number().int().positive(),
    currency: currencyCodeSchema,
    order: orderSchema,
    recommended: z.boolean().nullish(),
    coverages: z.array(planCoverageSchema).min(1),
    benefits: z.array(planBenefitSchema).nullish(),
    createdAt: createdAtSchema,
  })
  .transform((plan) => ({
    ...plan,
    recommended: plan.recommended === true,
    benefits: plan.benefits ?? [],
  }));

/** The plans of a country in ascending configured order, ties by creation order (AC-036). */
export const plansSchema = z.array(planSchema).transform((plans) => sortByOrder(plans));

export type PlanCoverage = z.output<typeof planCoverageSchema>;
export type PlanBenefit = z.output<typeof planBenefitSchema>;
export type Plan = z.output<typeof planSchema>;
export type PlanInput = z.input<typeof planSchema>;
