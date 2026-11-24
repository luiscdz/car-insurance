import { Injectable, Injector, inject, signal } from '@angular/core';
import { type FieldTree, form, validate } from '@angular/forms/signals';
import type { FieldValue, FormFieldContent } from '@car-insurance/shared';
import { CLOCK } from '../../../../../core/clock';
import { isFieldValueValid } from '../../../../../shared/utils/field-validation/validate-field';
import type { FieldControl, FieldIds } from '../models/field-view';

/** Signal Forms model of a form step: text values and checkbox states, keyed by field name. */
export interface FieldFormModel {
  readonly text: Record<string, string>;
  readonly checked: Record<string, boolean>;
}

/** A Signal Form built from a form step's field configuration. */
export interface FieldForm {
  readonly tree: FieldTree<FieldFormModel>;
  /** Controls in display order. */
  readonly controls: readonly FieldControl[];
  /** Current values; text is kept without leading or trailing spaces. */
  values(): Record<string, FieldValue>;
  /** Shows the error of every invalid field (AC-011). */
  markAllTouched(): void;
  /** The first invalid field in display order. */
  firstInvalid(): FieldControl | undefined;
}

/** The error every failing validation of a field reports: its single configured message. */
export const CONFIGURED_ERROR_KIND = 'configured';

export function fieldIds(name: string): FieldIds {
  const inputId = `field-${name}`;
  return { inputId, helpId: `${inputId}-help`, errorId: `${inputId}-error` };
}

function initialModel(
  fields: readonly FormFieldContent[],
  stored: Readonly<Record<string, FieldValue>> | undefined,
): FieldFormModel {
  const text: Record<string, string> = {};
  const checked: Record<string, boolean> = {};
  for (const field of fields) {
    const value = stored?.[field.name];
    if (field.type === 'checkbox') {
      checked[field.name] = value === true;
    } else {
      text[field.name] = typeof value === 'string' ? value : '';
    }
  }
  return { text, checked };
}

/**
 * Builds the Signal Form of a form step from its configuration in Strapi (REQ-002, REQ-003):
 * each field is validated with the shared rules and reports its configured error message.
 * Provided by the form step, so the form lives as long as the step.
 */
@Injectable()
export class FieldFormFactory {
  private readonly injector = inject(Injector);
  private readonly clock = inject(CLOCK);

  create(
    fields: readonly FormFieldContent[],
    stored: Readonly<Record<string, FieldValue>> | undefined,
  ): FieldForm {
    const model = signal(initialModel(fields, stored));
    const error = (field: FormFieldContent) => ({
      kind: CONFIGURED_ERROR_KIND,
      message: field.errorMessage,
    });
    const tree = form(
      model,
      (path) => {
        for (const field of fields) {
          if (field.type === 'checkbox') {
            const checkboxPath = path.checked[field.name];
            if (checkboxPath) {
              validate(checkboxPath, ({ value }) =>
                isFieldValueValid(field, value(), this.clock()) ? undefined : error(field),
              );
            }
          } else {
            const textPath = path.text[field.name];
            if (textPath) {
              validate(textPath, ({ value }) =>
                isFieldValueValid(field, value(), this.clock()) ? undefined : error(field),
              );
            }
          }
        }
      },
      { injector: this.injector },
    );
    const controls = fields.flatMap((field): FieldControl[] => {
      const ids = fieldIds(field.name);
      if (field.type === 'checkbox') {
        const checkboxTree = tree.checked[field.name];
        return checkboxTree ? [{ kind: 'checkbox', field, tree: checkboxTree, ...ids }] : [];
      }
      const textTree = tree.text[field.name];
      return textTree ? [{ kind: 'text', field, tree: textTree, ...ids }] : [];
    });

    return {
      tree,
      controls,
      values: () => {
        const { text, checked } = model();
        const values: Record<string, FieldValue> = { ...checked };
        for (const [name, value] of Object.entries(text)) {
          values[name] = value.trim();
        }
        return values;
      },
      markAllTouched: () => {
        for (const control of controls) {
          control.tree().markAsTouched();
        }
      },
      firstInvalid: () => controls.find((control) => control.tree().invalid()),
    };
  }
}
