import { type DestroyRef, InjectionToken, type Signal } from '@angular/core';
import type { FieldValue, StoredStep, WizardCopy } from '@car-insurance/shared';

/**
 * What the wizard shell offers to the step component it renders. Every step type uses the same
 * contract, so the shell treats them alike (Liskov, docs/engineering.md).
 */
export interface StepContext {
  /** The wizard copy of the current country, from Strapi (AC-008). */
  readonly copy: Signal<WizardCopy>;
  /** Router commands of the previous step, or `null` on the first step (AC-020). */
  readonly previousStepLink: Signal<readonly string[] | null>;
  /** The values confirmed for a step in this tab, if any. */
  storedStep(slug: string): StoredStep | undefined;
  /** Stores the step's values and moves to the next step (AC-019). */
  confirm(slug: string, values: Readonly<Record<string, FieldValue>>): void;
  /** Registers how the step tells whether it has unconfirmed values (AC-033, AC-034). */
  trackUnconfirmed(check: () => boolean, destroyRef: DestroyRef): void;
}

export const STEP_CONTEXT = new InjectionToken<StepContext>('STEP_CONTEXT');
