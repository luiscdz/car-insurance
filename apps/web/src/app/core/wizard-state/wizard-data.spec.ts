import type { WizardData, WizardStep } from '@car-insurance/shared';
import { chileContent, colombiaContent, TODAY } from '../../../testing/content-fixtures';
import {
  firstIncompleteIndex,
  isStepComplete,
  reconcile,
  resolveStep,
  withChosenPlan,
  withFinalPrice,
  withoutFinalPrice,
} from './wizard-data';

const chileWizard = chileContent();
const colombiaWizard = colombiaContent();
const chile = chileWizard.steps;
const colombia = colombiaWizard.steps;

const chileFormsDone: WizardData = {
  steps: {
    'tus-datos': { values: { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01' }, complete: true },
    'tu-vehiculo': { values: { marca: 'toyota', anio: '2020' }, complete: true },
  },
};

const chileFirstStepDone: WizardData = {
  steps: {
    'tus-datos': { values: { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01' }, complete: true },
  },
};

describe('wizard data', () => {
  it('AC-024 the first step that is not complete is the first form step without data', () => {
    expect(firstIncompleteIndex(chile, { steps: {} })).toBe(0);
    expect(firstIncompleteIndex(chile, chileFirstStepDone)).toBe(1);
    expect(isStepComplete(chileFirstStepDone, chile[0] as WizardStep)).toBe(true);
    expect(isStepComplete(chileFirstStepDone, chile[2] as WizardStep)).toBe(false);
  });

  it('AC-056 the plan step is complete only with a chosen plan and its final price', () => {
    const plans = chile[2] as WizardStep;
    const summary = chile[3] as WizardStep;

    expect(isStepComplete(chileFormsDone, plans)).toBe(false);
    expect(isStepComplete(withChosenPlan(chileFormsDone, 'cl-full'), plans)).toBe(false);
    const priced = withFinalPrice(withChosenPlan(chileFormsDone, 'cl-full'), 'cl-full', 624000);
    expect(isStepComplete(priced, plans)).toBe(true);
    expect(isStepComplete(withoutFinalPrice(priced), plans)).toBe(false);
    expect(isStepComplete(priced, summary)).toBe(false);
  });

  it('AC-056 the plan or summary address with a form step not complete leads to that form step', () => {
    expect(resolveStep(chile, chileFirstStepDone, 'elige-tu-plan')).toEqual({
      index: 1,
      redirect: true,
    });
    expect(resolveStep(colombia, { steps: {} }, 'resumen-y-pago')).toEqual({
      index: 0,
      redirect: true,
    });
  });

  it('AC-056 the summary address without a chosen plan with a final price leads to the plan step', () => {
    expect(resolveStep(chile, chileFormsDone, 'resumen-y-pago')).toEqual({
      index: 2,
      redirect: true,
    });
    expect(resolveStep(chile, withChosenPlan(chileFormsDone, 'cl-full'), 'resumen-y-pago')).toEqual(
      { index: 2, redirect: true },
    );
    const priced = withFinalPrice(withChosenPlan(chileFormsDone, 'cl-full'), 'cl-full', 624000);
    expect(resolveStep(chile, priced, 'resumen-y-pago')).toEqual({ index: 3, redirect: false });
    expect(resolveStep(chile, chileFormsDone, 'elige-tu-plan')).toEqual({
      index: 2,
      redirect: false,
    });
  });

  it('AC-049 a final price is kept only for the plan that is still chosen', () => {
    const chosen = withChosenPlan(chileFormsDone, 'cl-full');

    expect(withFinalPrice(chosen, 'cl-esencial', 350000)).toBe(chosen);
    expect(withFinalPrice(chileFormsDone, 'cl-full', 1)).toBe(chileFormsDone);
    expect(withoutFinalPrice(chileFormsDone)).toBe(chileFormsDone);
  });

  it('AC-024 a later step address leads to the first step that is not complete', () => {
    expect(resolveStep(chile, { steps: {} }, 'tu-vehiculo')).toEqual({ index: 0, redirect: true });
    expect(resolveStep(chile, chileFirstStepDone, 'elige-tu-plan')).toEqual({
      index: 1,
      redirect: true,
    });
  });

  it('AC-024 an unknown step address leads to the first step that is not complete', () => {
    expect(resolveStep(colombia, { steps: {} }, 'no-existe')).toEqual({ index: 0, redirect: true });
    expect(resolveStep(chile, chileFirstStepDone, '')).toEqual({ index: 1, redirect: true });
  });

  it('AC-001 AC-023 the country address opens the first step', () => {
    expect(resolveStep(chile, chileFirstStepDone, null)).toEqual({ index: 0, redirect: true });
  });

  it('AC-020 AC-022 a completed step and the step after it can be opened directly', () => {
    expect(resolveStep(chile, chileFirstStepDone, 'tus-datos')).toEqual({
      index: 0,
      redirect: false,
    });
    expect(resolveStep(chile, chileFirstStepDone, 'tu-vehiculo')).toEqual({
      index: 1,
      redirect: false,
    });
  });

  it('AC-025 discards stored values of fields and steps no longer published', () => {
    const stored: WizardData = {
      steps: {
        'tus-datos-y-tu-vehiculo': {
          values: { placa: 'ABC123', 'tipo-documento': 'cc', 'campo-retirado': 'x' },
          complete: true,
        },
        'paso-retirado': { values: { a: 'b' }, complete: true },
      },
    };

    const reconciled = reconcile(stored, colombiaWizard, TODAY);

    expect(Object.keys(reconciled.steps)).toEqual(['tus-datos-y-tu-vehiculo']);
    expect(reconciled.steps['tus-datos-y-tu-vehiculo']).toEqual({
      values: { placa: 'ABC123', 'tipo-documento': 'cc' },
      complete: true,
    });
  });

  it('AC-025 a step whose stored values no longer satisfy the configuration is not complete', () => {
    const stored: WizardData = {
      steps: {
        'tus-datos': {
          values: { rut: 'invalido', 'fecha-nacimiento': '1990-01-01' },
          complete: true,
        },
      },
    };

    const reconciled = reconcile(stored, chileWizard, TODAY);

    expect(reconciled.steps['tus-datos']).toEqual({
      values: { rut: 'invalido', 'fecha-nacimiento': '1990-01-01' },
      complete: false,
    });
    expect(resolveStep(chile, reconciled, 'tu-vehiculo')).toEqual({ index: 0, redirect: true });
  });

  it('AC-025 a new required field makes a completed step incomplete and keeps the other values', () => {
    const stored: WizardData = {
      steps: { 'tus-datos': { values: { rut: '1234567-8' }, complete: true } },
    };

    expect(reconcile(stored, chileWizard, TODAY).steps['tus-datos']).toEqual({
      values: { rut: '1234567-8' },
      complete: false,
    });
  });

  it('AC-025 discards stored values of the wrong type', () => {
    const stored: WizardData = {
      steps: {
        'tus-datos-y-tu-vehiculo': {
          values: { placa: true, 'uso-particular': 'si' },
          complete: false,
        },
      },
    };

    expect(
      reconcile(stored, colombiaWizard, TODAY).steps['tus-datos-y-tu-vehiculo']?.values,
    ).toEqual({});
  });

  it.each([
    ['Colombia', colombiaWizard, 'co-clasico'],
    ['Chile', chileWizard, 'cl-full'],
  ])(
    'AC-055 %s keeps a chosen plan that is still offered with its final price',
    (_, content, id) => {
      const stored: WizardData = { steps: {}, plan: { id, finalPrice: 100 } };

      expect(reconcile(stored, content, TODAY).plan).toEqual({ id, finalPrice: 100 });
    },
  );

  it.each([
    ['Colombia', colombiaWizard, 'co-retirado'],
    ['Chile', chileWizard, 'co-clasico'],
  ])(
    'AC-055 %s discards a chosen plan no longer offered, silently, and the plan step is not complete',
    (_, content, id) => {
      const stored: WizardData = { ...chileFormsDone, plan: { id, finalPrice: 100 } };

      const reconciled = reconcile(stored, content, TODAY);

      expect(reconciled.plan).toBeUndefined();
      expect('plan' in reconciled).toBe(false);
      const planStep = content.steps.find((step) => step.type === 'plans') as WizardStep;
      expect(isStepComplete(reconciled, planStep)).toBe(false);
    },
  );

  it('AC-055 a country without plans discards the stored choice', () => {
    const stored: WizardData = { steps: {}, plan: { id: 'cl-full', finalPrice: null } };

    expect(reconcile(stored, chileContent([]), TODAY).plan).toBeUndefined();
  });

  it('AC-054 stored values that changed with the configuration discard the final price, not the choice', () => {
    const stored: WizardData = {
      steps: {
        'tus-datos': {
          values: { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01', retirado: 'x' },
          complete: true,
        },
      },
      plan: { id: 'cl-full', finalPrice: 624000 },
    };

    expect(reconcile(stored, chileWizard, TODAY).plan).toEqual({ id: 'cl-full', finalPrice: null });
    const gone: WizardData = {
      ...chileFormsDone,
      steps: { ...chileFormsDone.steps, viejo: { values: {}, complete: true } },
      plan: { id: 'cl-full', finalPrice: 1 },
    };
    expect(reconcile(gone, chileWizard, TODAY).plan?.finalPrice).toBeNull();
  });

  it('AC-053 unchanged stored values keep the chosen plan and its final price', () => {
    const stored: WizardData = { ...chileFormsDone, plan: { id: 'cl-full', finalPrice: 624000 } };

    expect(reconcile(stored, chileWizard, TODAY)).toEqual(stored);
  });
});
