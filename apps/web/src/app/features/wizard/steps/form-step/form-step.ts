import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { WizardStep } from '@car-insurance/shared';
import { FALLBACK_COPY } from '../../../../core/content/fallback-copy';
import { hasUnconfirmedValues } from '../../../../core/wizard-state/unconfirmed-values';
import { Button } from '../../../../shared/ui/button';
import { StatusMessage } from '../../../../shared/ui/status-message';
import { STEP_CONTEXT } from '../../shell/step-context';
import { DynamicField } from './components/dynamic-field';
import { FIELD_RENDERERS } from './components/field-renderers';
import { FieldFormFactory } from './services/field-form';
import type { FieldView } from './models/field-view';

/**
 * A form step generated with Signal Forms from its configuration in Strapi (REQ-002, REQ-003).
 * It advances once all fields are valid, stores the values through the shell and asks the
 * browser to confirm a reload or close while values are unconfirmed (AC-033).
 */
@Component({
  selector: 'app-form-step',
  imports: [Button, DynamicField, NgTemplateOutlet, RouterLink, StatusMessage],
  providers: [FieldFormFactory],
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
  template: `
    @if (fieldViews().length === 0) {
      <app-status-message [message]="fallback.notAvailableNow" />
      <div class="mt-8 flex">
        <ng-container *ngTemplateOutlet="back" />
      </div>
    } @else {
      <form novalidate (submit)="$event.preventDefault(); continue()">
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-x-6">
          @for (view of fieldViews(); track view.control.field.name) {
            <app-dynamic-field [view]="view" />
          }
        </div>
        <div class="mt-8 flex flex-wrap-reverse items-center justify-between gap-3">
          <ng-container *ngTemplateOutlet="back" />
          <button
            type="submit"
            appButton="cta"
            class="ml-auto w-full min-[480px]:w-auto"
            [attr.aria-disabled]="!canAdvance()"
          >
            {{ context.copy().continueLabel }}
          </button>
        </div>
      </form>
    }
    <ng-template #back>
      @if (context.previousStepLink(); as link) {
        <a appButton="link" [routerLink]="link">{{ context.copy().backLabel }}</a>
      }
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormStep {
  readonly step = input.required<WizardStep>();

  protected readonly context = inject(STEP_CONTEXT);
  private readonly forms = inject(FieldFormFactory);
  private readonly injector = inject(Injector);
  protected readonly fallback = FALLBACK_COPY;
  private advancing = false;

  /** The step's form, built once per step with the values confirmed earlier in this tab. */
  private readonly stepForm = computed(() => {
    const step = this.step();
    return untracked(() =>
      this.forms.create(step.fields, this.context.storedStep(step.slug)?.values),
    );
  });

  protected readonly fieldViews = computed<readonly FieldView[]>(() =>
    this.stepForm().controls.map((control) => ({
      control,
      renderer: FIELD_RENDERERS[control.field.type],
    })),
  );

  /** The continue action looks enabled only when every field is valid (AC-011). */
  protected readonly canAdvance = computed(() => this.stepForm().tree().valid());

  constructor() {
    this.context.trackUnconfirmed(() => this.hasUnconfirmedValues(), inject(DestroyRef));
  }

  /**
   * Advances exactly once when every field is valid (AC-019, AC-021). Otherwise it stays, shows
   * every error and moves focus to the first invalid field (AC-011).
   */
  protected continue(): void {
    if (this.advancing) {
      return;
    }
    const form = this.stepForm();
    const firstInvalid = form.firstInvalid();
    if (firstInvalid) {
      form.markAllTouched();
      // Focus once the errors are rendered, so the field is announced with its error (AC-011).
      afterNextRender(() => firstInvalid.tree().focusBoundControl(), { injector: this.injector });
      return;
    }
    this.advancing = true;
    this.context.confirm(this.step().slug, form.values());
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnconfirmedValues()) {
      event.preventDefault();
    }
  }

  private hasUnconfirmedValues(): boolean {
    const step = this.step();
    return hasUnconfirmedValues(
      step.fields,
      this.stepForm().values(),
      this.context.storedStep(step.slug)?.values,
    );
  }
}
