import {
  colombiaFields,
  envelope,
  rawChile,
  rawChilePlans,
  rawChileSteps,
  rawColombia,
  rawColombiaPlans,
  rawColombiaSteps,
  rawField,
  rawPlan,
} from '../../../testing/content-fixtures';

const coPlans = () => envelope(rawColombiaPlans());
const clPlans = () => envelope(rawChilePlans());
import { toCountryList, toWizardContent } from './wizard-content';

describe('toWizardContent', () => {
  it('AC-004 builds the wizard of Colombia with its fields in configured order', () => {
    const result = toWizardContent(
      'co',
      envelope([rawColombia()]),
      envelope(rawColombiaSteps()),
      coPlans(),
    );

    expect(result.kind).toBe('ready');
    if (result.kind === 'ready') {
      expect(result.content.steps.map((step) => step.slug)).toEqual([
        'tus-datos-y-tu-vehiculo',
        'elige-tu-plan',
        'resumen-y-pago',
      ]);
      expect(result.content.steps[0]?.fields.map((f) => f.name)).toEqual([
        'tipo-documento',
        'placa',
        'uso-particular',
      ]);
    }
  });

  it('AC-004 builds the wizard of Chile with only its own steps and fields', () => {
    const steps = [...rawChileSteps()].reverse();
    const result = toWizardContent('cl', envelope([rawChile()]), envelope(steps), clPlans());

    expect(result.kind === 'ready' && result.content.steps.map((step) => step.title)).toEqual([
      'Tus datos',
      'Tu vehículo',
      'Elige tu plan',
      'Resumen y pago',
    ]);
  });

  it('AC-004 shows fields with equal order values in ascending creation order', () => {
    const fields = [
      rawField({ name: 'tercero', order: 1, createdAt: '2026-03-01T00:00:00.000Z' }),
      rawField({ name: 'primero', order: 1, createdAt: '2026-01-01T00:00:00.000Z' }),
      rawField({ name: 'segundo', order: 1, createdAt: '2026-02-01T00:00:00.000Z' }),
    ];
    const result = toWizardContent(
      'co',
      envelope([rawColombia()]),
      envelope(rawColombiaSteps(fields)),
      coPlans(),
    );

    expect(result.kind === 'ready' && result.content.steps[0]?.fields.map((f) => f.name)).toEqual([
      'primero',
      'segundo',
      'tercero',
    ]);
  });

  it('AC-002 a code that does not exactly match a published country is not found', () => {
    expect(toWizardContent('CO', envelope([rawColombia()]), envelope([]), coPlans()).kind).toBe(
      'not-found',
    );
    expect(toWizardContent('xx', envelope([]), envelope([]), envelope([])).kind).toBe('not-found');
  });

  it('AC-002 a country absent from the published response is not found', () => {
    expect(
      toWizardContent('co', envelope([rawChile()]), envelope(rawColombiaSteps()), coPlans()).kind,
    ).toBe('not-found');
  });

  it('AC-017 content failing validation is invalid', () => {
    const withoutError = colombiaFields().map((field) =>
      field['name'] === 'placa' ? { ...field, errorMessage: '' } : field,
    );

    expect(
      toWizardContent(
        'co',
        envelope([rawColombia()]),
        envelope(rawColombiaSteps(withoutError)),
        coPlans(),
      ).kind,
    ).toBe('invalid');
    expect(
      toWizardContent(
        'cl',
        envelope([rawChile({ copy: null })]),
        envelope(rawChileSteps()),
        clPlans(),
      ).kind,
    ).toBe('invalid');
    expect(
      toWizardContent(
        'cl',
        envelope([rawChile()]),
        envelope(rawChileSteps().slice(0, 3)),
        clPlans(),
      ).kind,
    ).toBe('invalid');
    expect(toWizardContent('cl', { error: 'x' }, envelope([]), clPlans()).kind).toBe('invalid');
  });

  it('AC-003 a malformed theme does not make the content invalid', () => {
    const result = toWizardContent(
      'co',
      envelope([rawColombia({ theme: { primaryColor: 'azul' } })]),
      envelope(rawColombiaSteps()),
      coPlans(),
    );

    expect(result.kind).toBe('ready');
  });
});

describe('toWizardContent with plans', () => {
  it('AC-036 Colombia receives its plans in configured order', () => {
    const result = toWizardContent(
      'co',
      envelope([rawColombia()]),
      envelope(rawColombiaSteps()),
      envelope([...rawColombiaPlans()].reverse()),
    );

    expect(result.kind === 'ready' && result.content.plans.map((plan) => plan.name)).toEqual([
      'Plan Básico',
      'Plan Clásico',
      'Plan Global',
    ]);
  });

  it('AC-036 Chile plans with equal order values keep ascending creation order', () => {
    const result = toWizardContent(
      'cl',
      envelope([rawChile()]),
      envelope(rawChileSteps()),
      clPlans(),
    );

    expect(result.kind === 'ready' && result.content.plans.map((plan) => plan.name)).toEqual([
      'Plan Esencial',
      'Plan Full',
      'Plan Premium',
    ]);
  });

  it('AC-058 a country without plans is still valid', () => {
    const result = toWizardContent(
      'cl',
      envelope([rawChile()]),
      envelope(rawChileSteps()),
      envelope([]),
    );

    expect(result.kind === 'ready' && result.content.plans).toEqual([]);
  });

  it.each([
    [
      'a plan with a base price of 0',
      [rawPlan({ documentId: 'x', currency: 'CLP', basePrice: 0 })],
    ],
    ['a plan in the currency of another country', [rawPlan({ documentId: 'x', currency: 'COP' })]],
    ['a plan without coverages', [rawPlan({ documentId: 'x', currency: 'CLP', coverages: [] })]],
  ])('AC-041 AC-059 content with %s is invalid', (_, plans) => {
    expect(
      toWizardContent('cl', envelope([rawChile()]), envelope(rawChileSteps()), envelope(plans))
        .kind,
    ).toBe('invalid');
  });

  it('AC-059 a plans response that is not a collection is invalid', () => {
    expect(
      toWizardContent('co', envelope([rawColombia()]), envelope(rawColombiaSteps()), null).kind,
    ).toBe('invalid');
  });

  it('AC-040 content without plan list copy is invalid', () => {
    expect(
      toWizardContent(
        'co',
        envelope([rawColombia({ planCopy: null })]),
        envelope(rawColombiaSteps()),
        coPlans(),
      ).kind,
    ).toBe('invalid');
  });
});

describe('toCountryList', () => {
  it('AC-001 lists the published countries', () => {
    const result = toCountryList(
      envelope([
        { code: 'cl', name: 'Chile' },
        { code: 'co', name: 'Colombia' },
      ]),
    );

    expect(result.kind === 'ready' && result.countries.map((c) => c.name)).toEqual([
      'Chile',
      'Colombia',
    ]);
  });

  it('AC-017 an invalid list is invalid', () => {
    expect(toCountryList(envelope([{ code: 'CHILE', name: '' }])).kind).toBe('invalid');
    expect(toCountryList(null).kind).toBe('invalid');
  });
});
