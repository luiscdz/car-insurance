import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Input } from '../../../../../shared/ui/input';
import type { TextFieldControl } from '../models/field-view';

/**
 * Native select with exactly the configured options in their order; no option is chosen until
 * the person chooses one (AC-006).
 */
@Component({
  selector: 'app-select-control',
  imports: [FormField, Input],
  template: `
    <div class="relative">
      <select
        appInput
        class="pr-10"
        [attr.data-empty]="control().tree().value() === '' ? '' : null"
        [formField]="control().tree"
        [id]="control().inputId"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="invalid()"
        [attr.aria-required]="control().field.required"
      >
        <option value="" disabled>{{ control().field.placeholder ?? '' }}</option>
        @for (option of control().field.options; track option.value) {
          <option class="font-normal text-foreground" [value]="option.value">
            {{ option.label }}
          </option>
        }
      </select>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        class="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-primary"
      >
        <path
          d="M6 9l6 6 6-6"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectControl {
  readonly control = input.required<TextFieldControl>();
  readonly describedBy = input<string | null>(null);
  readonly invalid = input(false);
}
