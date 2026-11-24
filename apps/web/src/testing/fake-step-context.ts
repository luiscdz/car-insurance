import { type DestroyRef, signal } from '@angular/core';
import type { FieldValue, StoredStep, WizardContent, WizardCopy } from '@car-insurance/shared';
import type { StepContext } from '../app/features/wizard/shell/step-context';

/** A wizard shell stand-in that records what a step component asks of it. */
export class FakeStepContext implements StepContext {
  readonly copy = signal<WizardCopy>({
    continueLabel: 'Continuar',
    backLabel: 'Volver',
    progressLabel: 'Paso {current} de {total}',
    leaveTitle: '¿Quieres salir del formulario?',
    leaveMessage: 'Perderás los datos que escribiste en este paso.',
    leaveStayLabel: 'Seguir en el formulario',
    leaveConfirmLabel: 'Salir',
  });
  readonly content = signal<WizardContent | null>(null);
  readonly previousStepLink = signal<readonly string[] | null>(null);
  readonly stored: Record<string, StoredStep> = {};
  readonly confirmed: { slug: string; values: Readonly<Record<string, FieldValue>> }[] = [];
  readonly advanced: string[] = [];
  unconfirmed: (() => boolean) | null = null;

  /** Serves a country's content and copy. */
  withContent(content: WizardContent): this {
    this.content.set(content);
    this.copy.set(content.country.copy);
    return this;
  }

  storedStep(slug: string): StoredStep | undefined {
    return this.stored[slug];
  }
  confirm(slug: string, values: Readonly<Record<string, FieldValue>>): void {
    this.confirmed.push({ slug, values });
  }
  advance(slug: string): void {
    this.advanced.push(slug);
  }
  trackUnconfirmed(check: () => boolean, destroyRef: DestroyRef): void {
    this.unconfirmed = check;
    destroyRef.onDestroy(() => (this.unconfirmed = null));
  }
}
