import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Checkbox } from '../../../../../shared/ui/checkbox';
import type { CheckboxFieldControl } from '../models/field-view';

/** A checkbox whose text is the field's label, with the required marker (AC-005). */
@Component({
  selector: 'app-checkbox-control',
  imports: [Checkbox, FormField],
  template: `
    <label class="flex min-h-6 cursor-pointer items-start gap-2.5" [for]="control().inputId">
      <input
        type="checkbox"
        appCheckbox
        [formField]="control().tree"
        [id]="control().inputId"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="invalid()"
        [attr.aria-required]="control().field.required"
      />
      <span class="text-base text-foreground"
        >{{ control().field.label }}
        @if (control().field.required) {
          <span class="ml-0.5 text-danger" aria-hidden="true">*</span>
        }
      </span>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxControl {
  readonly control = input.required<CheckboxFieldControl>();
  readonly describedBy = input<string | null>(null);
  readonly invalid = input(false);
}
