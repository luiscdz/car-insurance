import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Label } from '../../../../../shared/ui/label';
import type { FieldView } from '../models/field-view';

/**
 * A field built from its configuration: label above the control with a required marker, help text
 * below it and, when shown, the configured error with an icon, all associated with the control
 * (AC-005, AC-009, AC-010, AC-027).
 */
@Component({
  selector: 'app-dynamic-field',
  imports: [Label, NgComponentOutlet],
  template: `
    <div class="flex min-w-0 flex-col gap-1.5">
      @if (!view().renderer.labelInside) {
        <label appLabel [for]="view().control.inputId"
          >{{ field().label }}
          @if (field().required) {
            <span class="ml-0.5 text-danger" aria-hidden="true">*</span>
          }
        </label>
      }
      <ng-container *ngComponentOutlet="view().renderer.component; inputs: controlInputs()" />
      @if (field().helpText) {
        <p class="m-0 text-sm text-foreground" [id]="view().control.helpId">
          {{ field().helpText }}
        </p>
      }
      @if (showError()) {
        <p
          class="m-0 flex items-start gap-1.5 text-sm font-semibold text-danger"
          [id]="view().control.errorId"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
            class="mt-0.5 size-4 flex-none"
          >
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
            <path d="M12 7v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <circle cx="12" cy="17" r="1.3" fill="currentColor" />
          </svg>
          <span>{{ field().errorMessage }}</span>
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicField {
  readonly view = input.required<FieldView>();

  protected readonly field = computed(() => this.view().control.field);

  /** The error shows once the person left the field or tried to advance, while invalid (AC-010). */
  protected readonly showError = computed(() => {
    const state = this.view().control.tree();
    return state.touched() && state.invalid();
  });

  private readonly describedBy = computed(() => {
    const { control } = this.view();
    const ids = [
      control.field.helpText ? control.helpId : null,
      this.showError() ? control.errorId : null,
    ].filter((id): id is string => id !== null);
    return ids.length > 0 ? ids.join(' ') : null;
  });

  protected readonly controlInputs = computed(() => ({
    ...this.view().renderer.inputs,
    control: this.view().control,
    describedBy: this.describedBy(),
    invalid: this.showError(),
  }));
}
