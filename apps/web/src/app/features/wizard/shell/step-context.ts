import { type DestroyRef, InjectionToken, type Signal } from '@angular/core';
import type { FieldValue, StoredStep, WizardContent, WizardCopy } from '@car-insurance/shared';

/** Element id of the current step's heading, the programmatic name of a step's groups (AC-060). */
export const STEP_HEADING_ID = 'step-heading';

/**
 * What the wizard shell offers to the step component it renders. Every step type uses the same
 * contract, so the shell treats them alike (Liskov, docs/engineering.md).
 */
export interface StepContext {
  /** The wizard copy of the current country, from Strapi (AC-008). */
  readonly copy: Signal<WizardCopy>;
  /** The validated content of the current country: country, steps and plans. */
  readonly content: Signal<WizardContent | null>;
  /** Router commands of the previous step, or `null` on the first step (AC-020). */
  readonly previousStepLink: Signal<readonly string[] | null>;
  /** The values confirmed for a step in this tab, if any. */
  storedStep(slug: string): StoredStep | undefined;
  /** Stores the step's values and moves to the next step (AC-019). */
  confirm(slug: string, values: Readonly<Record<string, FieldValue>>): void;
  /** Moves to the step after `slug` without storing values (AC-050). */
  advance(slug: string): void;
  /** Registers how the step tells whether it has unconfirmed values (AC-033, AC-034). */
  trackUnconfirmed(check: () => boolean, destroyRef: DestroyRef): void;
}

export const STEP_CONTEXT = new InjectionToken<StepContext>('STEP_CONTEXT');
