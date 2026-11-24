import { InjectionToken, type Type } from '@angular/core';
import type { StepType } from '@car-insurance/shared';
import { FormStep } from '../steps/form-step/form-step';
import { PlanList } from '../steps/plan-list/plan-list';

/**
 * Component that renders the body of each step type; it receives the input `step`. The summary
 * registers its component when its change adds it (open/closed).
 */
export type StepComponents = Readonly<Partial<Record<StepType, Type<unknown>>>>;

export const STEP_COMPONENTS = new InjectionToken<StepComponents>('STEP_COMPONENTS', {
  providedIn: 'root',
  factory: () => ({ form: FormStep, plans: PlanList }),
});
