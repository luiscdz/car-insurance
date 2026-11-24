import type { Type } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import type { FormFieldContent } from '@car-insurance/shared';

/** Element ids of a rendered field, used for its label and descriptions (AC-009, AC-027). */
export interface FieldIds {
  readonly inputId: string;
  readonly helpId: string;
  readonly errorId: string;
}

interface FieldViewBase extends FieldIds {
  readonly field: FormFieldContent;
}

/** A field whose value is text: text, number, select and date fields. */
export interface TextFieldControl extends FieldViewBase {
  readonly kind: 'text';
  readonly tree: FieldTree<string>;
}

/** A checkbox field, whose value is its checked state. */
export interface CheckboxFieldControl extends FieldViewBase {
  readonly kind: 'checkbox';
  readonly tree: FieldTree<boolean>;
}

export type FieldControl = TextFieldControl | CheckboxFieldControl;

/**
 * How a field type is rendered: the control component and the static inputs it receives. Every
 * control component takes the inputs `control`, `describedBy` and `invalid` (Liskov), and
 * `labelInside` controls (the checkbox) render the label themselves.
 */
export interface FieldRenderer {
  readonly component: Type<unknown>;
  readonly inputs?: Readonly<Record<string, unknown>>;
  readonly labelInside?: boolean;
}

/** A field ready to render: its control and its renderer. */
export interface FieldView {
  readonly control: FieldControl;
  readonly renderer: FieldRenderer;
}
