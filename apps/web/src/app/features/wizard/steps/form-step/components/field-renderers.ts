import type { FieldType } from '@car-insurance/shared';
import type { FieldRenderer } from '../models/field-view';
import { CheckboxControl } from './checkbox-control';
import { SelectControl } from './select-control';
import { TextInputControl } from './text-input-control';

/**
 * Control rendered for each field type (AC-005). A new field type is added here with its own
 * control component; the form step and the dynamic field do not change (open/closed).
 */
export const FIELD_RENDERERS: Readonly<Record<FieldType, FieldRenderer>> = {
  text: { component: TextInputControl, inputs: { type: 'text' } },
  number: { component: TextInputControl, inputs: { type: 'text', inputMode: 'numeric' } },
  date: { component: TextInputControl, inputs: { type: 'date' } },
  select: { component: SelectControl },
  checkbox: { component: CheckboxControl, labelInside: true },
};
