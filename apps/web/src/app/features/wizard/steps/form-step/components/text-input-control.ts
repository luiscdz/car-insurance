import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { Input } from '../../../../../shared/ui/input';
import type { TextFieldControl } from '../models/field-view';

/** Text, number (numeric keyboard) and date controls (AC-005). */
@Component({
  selector: 'app-text-input-control',
  imports: [FormField, Input],
  template: `
    <input
      appInput
      [formField]="control().tree"
      [id]="control().inputId"
      [attr.type]="type()"
      [attr.inputmode]="inputMode()"
      [attr.data-empty]="control().tree().value() === '' ? '' : null"
      [attr.placeholder]="control().field.placeholder || null"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="invalid()"
      [attr.aria-required]="control().field.required"
      [attr.spellcheck]="type() === 'text' ? 'false' : null"
      autocomplete="off"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextInputControl {
  readonly control = input.required<TextFieldControl>();
  readonly describedBy = input<string | null>(null);
  readonly invalid = input(false);
  readonly type = input<'text' | 'date'>('text');
  readonly inputMode = input<'numeric' | null>(null);
}
