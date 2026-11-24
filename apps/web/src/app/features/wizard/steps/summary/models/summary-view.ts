import type {
  FieldValue,
  FormFieldContent,
  SummaryCopy,
  WizardContent,
  WizardData,
} from '@car-insurance/shared';
import { isEmptyValue } from '../../../../../shared/utils/field-validation/is-empty';
import { formatCalendarDate } from '../../../../../shared/utils/format-calendar-date';
import { maskIdentityDocument } from '../../../../../shared/utils/mask-identity-document';

/** One label and value pair of a summary section (AC-067). */
export interface SummaryRow {
  readonly key: string;
  readonly label: string;
  readonly value: string;
}

/** The data of one form step as the summary shows it (AC-067). */
export interface SummarySection {
  readonly slug: string;
  readonly title: string;
  readonly rows: readonly SummaryRow[];
}

/**
 * Presents a stored value (AC-068, AC-069): the identity document number masked, a select by its
 * option label, a date with `Intl` for the country's locale, a checkbox as the yes or no copy, and
 * text and numbers as entered. `null` means the value is not listed.
 */
function presentValue(
  field: FormFieldContent,
  value: FieldValue | undefined,
  locale: string,
  copy: SummaryCopy,
): string | null {
  if (field.type === 'checkbox') {
    // A checkbox with a stored value is always listed (owner answer Q1 of the plan).
    return typeof value === 'boolean' ? (value ? copy.yesLabel : copy.noLabel) : null;
  }
  if (typeof value !== 'string' || isEmptyValue(field.type, value)) {
    return null;
  }
  if (field.kind === 'identityDocumentNumber') {
    return maskIdentityDocument(value);
  }
  switch (field.type) {
    case 'select':
      return field.options.find((option) => option.value === value)?.label ?? null;
    case 'date':
      return formatCalendarDate(value, locale);
    default:
      return value;
  }
}

/**
 * The summary sections of a country (AC-067): one per form step in configured order, each listing
 * the fields of that step that have a stored value, in configured order. A field that is not
 * required and was left empty is not listed (AC-068). Steps and fields come from the content, so
 * no country, step or field is named here.
 */
export function toSummarySections(
  content: WizardContent,
  data: WizardData,
  copy: SummaryCopy,
): SummarySection[] {
  const locale = content.country.formatLocale;
  return content.steps
    .filter((step) => step.type === 'form')
    .map((step) => {
      const values = data.steps[step.slug]?.values ?? {};
      const rows = step.fields.flatMap((field): SummaryRow[] => {
        const value = presentValue(field, values[field.name], locale, copy);
        return value === null ? [] : [{ key: field.name, label: field.label, value }];
      });
      return { slug: step.slug, title: step.title, rows };
    });
}
