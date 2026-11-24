import { describe, expect, it } from 'vitest';
import {
  chile,
  chilePlans,
  chileSteps,
  chileTerms,
  colombia,
  colombiaPlans,
  colombiaSteps,
  colombiaTerms,
  fieldFixture,
  planFixture,
} from '../test-fixtures.js';
import { compareByOrder, sortByOrder } from './order.js';
import { wizardContentSchema, wizardStepsSchema } from './wizard-content.js';
import { wizardStepSchema } from './wizard-step.js';

describe('wizard content schema', () => {
  it('AC-004 sorts the steps of Colombia and their fields by configured order', () => {
    const steps = wizardStepsSchema.parse(colombiaSteps());

    expect(steps.map((step) => step.type)).toEqual(['form', 'plans', 'summary']);
    expect(steps[0]?.fields.map((field) => field.name)).toEqual([
      'tipo-documento',
      'numero-documento',
      'placa',
      'fecha-nacimiento',
      'anio',
    ]);
  });

  it('AC-004 keeps Chile two form steps in order', () => {
    const content = wizardContentSchema.parse({
      country: chile(),
      steps: chileSteps(),
      plans: chilePlans(),
      terms: chileTerms(),
    });

    expect(content.steps.map((step) => step.slug)).toEqual([
      'tus-datos',
      'tu-vehiculo',
      'elige-tu-plan',
      'resumen-y-pago',
    ]);
    expect(content.country.formatLocale).toBe('es-CL');
  });

  it('AC-004 orders fields with equal order values by ascending creation time', () => {
    const step = wizardStepSchema.parse({
      slug: 'paso',
      title: 'Paso',
      type: 'form',
      order: 1,
      fields: [
        fieldFixture({ name: 'c', order: 1, createdAt: '2026-01-03T00:00:00.000Z' }),
        fieldFixture({ name: 'a', order: 1, createdAt: '2026-01-01T00:00:00.000Z' }),
        fieldFixture({ name: 'b', order: 1, createdAt: '2026-01-02T00:00:00.000Z' }),
        fieldFixture({ name: 'z', order: 0, createdAt: '2026-01-09T00:00:00.000Z' }),
      ],
    });

    expect(step.fields.map((field) => field.name)).toEqual(['z', 'a', 'b', 'c']);
  });

  it('AC-004 keeps the original order of entries with equal order and creation time', () => {
    const items = [
      { id: 1, order: 2 },
      { id: 2, order: 1 },
      { id: 3, order: 2 },
    ];

    expect(sortByOrder(items).map((item) => item.id)).toEqual([2, 1, 3]);
    expect(compareByOrder({ order: 1, createdAt: 'b' }, { order: 1, createdAt: 'a' })).toBe(1);
  });

  it.each([
    [
      'no form step',
      (steps: ReturnType<typeof chileSteps>) => steps.filter((s) => s.type !== 'form'),
    ],
    [
      'no plan list',
      (steps: ReturnType<typeof chileSteps>) => steps.filter((s) => s.type !== 'plans'),
    ],
    [
      'two summary steps',
      (steps: ReturnType<typeof chileSteps>) => [
        ...steps,
        { slug: 'otro', title: 'Otro', type: 'summary' as const, order: 9 },
      ],
    ],
    [
      'a form step after the plan list',
      (steps: ReturnType<typeof chileSteps>) => [
        ...steps,
        { slug: 'extra', title: 'Extra', type: 'form' as const, order: 5, fields: [] },
      ],
    ],
    [
      'the summary before the plan list',
      (steps: ReturnType<typeof chileSteps>) =>
        steps.map((s) =>
          s.type === 'summary' ? { ...s, order: 3 } : s.type === 'plans' ? { ...s, order: 4 } : s,
        ),
    ],
    [
      'repeated step slugs',
      (steps: ReturnType<typeof chileSteps>) =>
        steps.map((s) => (s.slug === 'tu-vehiculo' ? { ...s, slug: 'tus-datos' } : s)),
    ],
    [
      'an unknown step type',
      (steps: ReturnType<typeof chileSteps>) =>
        steps.map((s) => (s.type === 'plans' ? { ...s, type: 'quiz' } : s)),
    ],
  ])('AC-017 rejects a step sequence with %s', (_, change) => {
    expect(wizardStepsSchema.safeParse(change(chileSteps())).success).toBe(false);
  });

  it('AC-017 rejects repeated field names within a step', () => {
    const steps = colombiaSteps().map((step) =>
      step.type === 'form'
        ? {
            ...step,
            fields: [fieldFixture({ name: 'placa' }), fieldFixture({ name: 'placa', order: 2 })],
          }
        : step,
    );

    expect(wizardStepsSchema.safeParse(steps).success).toBe(false);
  });

  it('AC-018 accepts a form step without published fields', () => {
    const steps = chileSteps().map((step) =>
      step.slug === 'tu-vehiculo' ? { ...step, fields: [] } : step,
    );

    expect(wizardStepsSchema.safeParse(steps).success).toBe(true);
  });

  it('AC-017 rejects the content of a country with invalid copy', () => {
    const country = colombia();
    country.copy = { ...country.copy, progressLabel: '' };

    expect(
      wizardContentSchema.safeParse({
        country,
        steps: colombiaSteps(),
        plans: colombiaPlans(),
        terms: colombiaTerms(),
      }).success,
    ).toBe(false);
  });

  it('AC-036 AC-041 accepts the content of each country with its plans in configured order', () => {
    const colombiaContent = wizardContentSchema.parse({
      country: colombia(),
      steps: colombiaSteps(),
      plans: colombiaPlans(),
      terms: colombiaTerms(),
    });
    const chileContent = wizardContentSchema.parse({
      country: chile(),
      steps: chileSteps(),
      plans: chilePlans(),
      terms: chileTerms(),
    });

    expect(colombiaContent.plans.map((plan) => plan.documentId)).toEqual([
      'co-basico',
      'co-clasico',
      'co-global',
    ]);
    expect(chileContent.plans.map((plan) => plan.documentId)).toEqual(['cl-full', 'cl-esencial']);
  });

  it('AC-058 accepts a country without plans', () => {
    expect(
      wizardContentSchema.safeParse({
        country: chile(),
        steps: chileSteps(),
        plans: [],
        terms: chileTerms(),
      }).success,
    ).toBe(true);
  });

  it('AC-041 AC-017 rejects a plan whose currency differs from the country currency', () => {
    const plans = [...chilePlans(), planFixture({ documentId: 'otro', currency: 'COP' })];

    expect(
      wizardContentSchema.safeParse({
        country: chile(),
        steps: chileSteps(),
        plans,
        terms: chileTerms(),
      }).success,
    ).toBe(false);
    expect(
      wizardContentSchema.safeParse({
        country: colombia(),
        steps: colombiaSteps(),
        plans: chilePlans(),
        terms: colombiaTerms(),
      }).success,
    ).toBe(false);
  });

  it('AC-041 AC-017 rejects content whose plans are missing or one plan is invalid', () => {
    const invalid = [...colombiaPlans(), planFixture({ documentId: 'x', basePrice: 0 })];

    expect(
      wizardContentSchema.safeParse({
        country: colombia(),
        steps: colombiaSteps(),
        terms: colombiaTerms(),
      }).success,
    ).toBe(false);
    expect(
      wizardContentSchema.safeParse({
        country: colombia(),
        steps: colombiaSteps(),
        plans: invalid,
        terms: colombiaTerms(),
      }).success,
    ).toBe(false);
  });

  it('AC-044 AC-017 rejects the same pricing mark on two fields of the country', () => {
    const steps = chileSteps().map((step) =>
      step.slug === 'tu-vehiculo'
        ? {
            ...step,
            fields: [
              ...(step.fields ?? []),
              fieldFixture({
                name: 'otra-fecha',
                type: 'date',
                order: 3,
                pricingInput: 'birthDate',
              }),
            ],
          }
        : step,
    );

    expect(
      wizardContentSchema.safeParse({
        country: chile(),
        steps,
        plans: chilePlans(),
        terms: chileTerms(),
      }).success,
    ).toBe(false);
  });

  it('AC-044 accepts a country without pricing marks', () => {
    const steps = chileSteps().map((step) => ({
      ...step,
      fields: (step.fields ?? []).map((field) => ({ ...field, pricingInput: null })),
    }));

    expect(
      wizardContentSchema.safeParse({
        country: chile(),
        steps,
        plans: chilePlans(),
        terms: chileTerms(),
      }).success,
    ).toBe(true);
  });
  it('AC-069 accepts exactly one identity document number field in each country', () => {
    const colombiaContent = wizardContentSchema.parse({
      country: colombia(),
      steps: colombiaSteps(),
      plans: colombiaPlans(),
      terms: colombiaTerms(),
    });
    const chileContent = wizardContentSchema.parse({
      country: chile(),
      steps: chileSteps(),
      plans: chilePlans(),
      terms: chileTerms(),
    });
    const kinds = (content: typeof chileContent) =>
      content.steps.flatMap((step) =>
        step.fields.filter((field) => field.kind !== null).map((field) => field.name),
      );

    expect(kinds(colombiaContent)).toEqual(['numero-documento']);
    expect(kinds(chileContent)).toEqual(['rut']);
  });

  it.each([
    [
      'no identity document number field',
      (steps: ReturnType<typeof chileSteps>) =>
        steps.map((step) => ({
          ...step,
          fields: (step.fields ?? []).map((field) => ({ ...field, kind: null })),
        })),
    ],
    [
      'two identity document number fields',
      (steps: ReturnType<typeof chileSteps>) =>
        steps.map((step) =>
          step.slug === 'tu-vehiculo'
            ? {
                ...step,
                fields: (step.fields ?? []).map((field) =>
                  field.name === 'patente'
                    ? { ...field, kind: 'identityDocumentNumber' as const }
                    : field,
                ),
              }
            : step,
        ),
    ],
  ])('AC-069 AC-017 rejects the content of Chile with %s', (_, change) => {
    expect(
      wizardContentSchema.safeParse({
        country: chile(),
        steps: change(chileSteps()),
        plans: chilePlans(),
        terms: chileTerms(),
      }).success,
    ).toBe(false);
  });

  it('AC-069 AC-017 rejects the content of Colombia without its identity document number field', () => {
    const steps = colombiaSteps().map((step) => ({
      ...step,
      fields: (step.fields ?? []).filter((field) => field.name !== 'numero-documento'),
    }));

    expect(
      wizardContentSchema.safeParse({
        country: colombia(),
        steps,
        plans: colombiaPlans(),
        terms: colombiaTerms(),
      }).success,
    ).toBe(false);
  });

  it.each([
    ['no terms', []],
    ['two terms entries', [{ text: 'Uno.' }, { text: 'Dos.' }]],
    ['blank terms', [{ text: ' \n\n  ' }]],
    ['terms without text', [{}]],
  ])('AC-077 AC-017 rejects the content of a country with %s', (_, terms) => {
    for (const [country, steps, plans] of [
      [colombia(), colombiaSteps(), colombiaPlans()],
      [chile(), chileSteps(), chilePlans()],
    ] as const) {
      expect(wizardContentSchema.safeParse({ country, steps, plans, terms }).success).toBe(false);
      expect(wizardContentSchema.safeParse({ country, steps, plans }).success).toBe(false);
    }
  });

  it('AC-077 keeps the single terms entry of each country', () => {
    const content = wizardContentSchema.parse({
      country: colombia(),
      steps: colombiaSteps(),
      plans: colombiaPlans(),
      terms: colombiaTerms(),
    });

    expect(content.terms).toEqual(colombiaTerms()[0]);
  });
});
