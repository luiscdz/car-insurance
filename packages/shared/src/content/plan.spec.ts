import { describe, expect, it } from 'vitest';
import { chilePlans, colombiaPlans, planFixture } from '../test-fixtures.js';
import { planSchema, plansSchema } from './plan.js';

describe('plan schemas', () => {
  it('AC-036 sorts the plans of Colombia by configured order', () => {
    const plans = plansSchema.parse(colombiaPlans());

    expect(plans.map((plan) => plan.name)).toEqual(['Plan Básico', 'Plan Clásico', 'Plan Global']);
  });

  it('AC-036 shows the plans of Chile with equal order values in ascending creation order', () => {
    const plans = plansSchema.parse(chilePlans());

    expect(plans.map((plan) => plan.documentId)).toEqual(['cl-full', 'cl-esencial']);
  });

  it('AC-037 AC-041 applies defaults: no benefits, not recommended, coverage without highlight', () => {
    const [basic] = plansSchema.parse(colombiaPlans());
    const [full] = plansSchema.parse(chilePlans());

    expect(basic?.benefits).toEqual([]);
    expect(basic?.recommended).toBe(false);
    expect(basic?.coverages).toEqual([{ name: 'Asistencia jurídica', highlight: null }]);
    expect(full?.recommended).toBe(false);
    expect(
      planSchema.parse(planFixture({ documentId: 'x', recommended: undefined })).recommended,
    ).toBe(false);
  });

  it('AC-041 accepts a valid plan of each country', () => {
    for (const plan of [...colombiaPlans(), ...chilePlans()]) {
      expect(planSchema.safeParse(plan).success).toBe(true);
    }
  });

  it.each([
    ['a blank name', { name: '  ' }],
    ['a missing name', { name: undefined }],
    ['a blank short description', { description: '' }],
    ['a base price of 0', { basePrice: 0 }],
    ['a negative base price', { basePrice: -1000 }],
    ['a base price that is not a whole number', { basePrice: 1000.5 }],
    ['a missing base price', { basePrice: undefined }],
    ['a currency that is not a code', { currency: 'cop' }],
    ['an order that is not a whole number', { order: 1.5 }],
    ['no coverage', { coverages: [] }],
    ['missing coverages', { coverages: null }],
    ['a coverage with a blank name', { coverages: [{ name: ' ' }] }],
    ['a coverage with a blank highlight', { coverages: [{ name: 'Robo', highlight: '' }] }],
    ['a blank benefit', { benefits: [{ text: '  ' }] }],
    ['a recommended flag that is not a boolean', { recommended: 'si' }],
    ['a blank document id', { documentId: '' }],
  ])('AC-041 rejects a plan with %s', (_, overrides) => {
    for (const valid of [colombiaPlans()[0], chilePlans()[0]]) {
      expect(planSchema.safeParse({ ...valid, ...overrides }).success).toBe(false);
    }
  });
});
