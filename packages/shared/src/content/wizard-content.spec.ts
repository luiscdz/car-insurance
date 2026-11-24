import { describe, expect, it } from 'vitest';
import { chile, chileSteps, colombia, colombiaSteps, fieldFixture } from '../test-fixtures.js';
import { compareByOrder, sortByOrder } from './order.js';
import { wizardContentSchema, wizardStepsSchema } from './wizard-content.js';
import { wizardStepSchema } from './wizard-step.js';

describe('wizard content schema', () => {
  it('AC-004 sorts the steps of Colombia and their fields by configured order', () => {
    const steps = wizardStepsSchema.parse(colombiaSteps());

    expect(steps.map((step) => step.type)).toEqual(['form', 'plans', 'summary']);
    expect(steps[0]?.fields.map((field) => field.name)).toEqual([
      'tipo-documento',
      'placa',
      'anio',
    ]);
  });

  it('AC-004 keeps Chile two form steps in order', () => {
    const content = wizardContentSchema.parse({ country: chile(), steps: chileSteps() });

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

    expect(wizardContentSchema.safeParse({ country, steps: colombiaSteps() }).success).toBe(false);
  });
});
