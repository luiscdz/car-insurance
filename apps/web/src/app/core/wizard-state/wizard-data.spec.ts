import type { WizardData, WizardStep } from '@car-insurance/shared';
import { chileContent, colombiaContent, TODAY } from '../../../testing/content-fixtures';
import { firstIncompleteIndex, isStepComplete, reconcile, resolveStep } from './wizard-data';

const chile = chileContent().steps;
const colombia = colombiaContent().steps;

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

    const reconciled = reconcile(stored, colombia, TODAY);

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

    const reconciled = reconcile(stored, chile, TODAY);

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

    expect(reconcile(stored, chile, TODAY).steps['tus-datos']).toEqual({
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

    expect(reconcile(stored, colombia, TODAY).steps['tus-datos-y-tu-vehiculo']?.values).toEqual({});
  });
});
