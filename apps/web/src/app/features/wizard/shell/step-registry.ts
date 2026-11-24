import { InjectionToken, type Type } from '@angular/core';
import type { StepType } from '@car-insurance/shared';
import { FormStep } from '../steps/form-step/form-step';

/**
 * Component that renders the body of each step type; it receives the input `step`. The plan list
 * and the summary register their components when their changes add them (open/closed).
 */
export type StepComponents = Readonly<Partial<Record<StepType, Type<unknown>>>>;

export const STEP_COMPONENTS = new InjectionToken<StepComponents>('STEP_COMPONENTS', {
  providedIn: 'root',
  factory: () => ({ form: FormStep }),
});
