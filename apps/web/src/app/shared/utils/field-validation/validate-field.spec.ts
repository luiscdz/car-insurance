import { field, TODAY } from '../../../../testing/content-fixtures';
import { isEmptyValue } from './is-empty';
import { isFieldValueValid } from './validate-field';

describe('field validation', () => {
  it('AC-012 treats blank text, unchecked checkboxes and unchosen selects as empty', () => {
    expect(isEmptyValue('text', '   ')).toBe(true);
    expect(isEmptyValue('checkbox', false)).toBe(true);
    expect(isEmptyValue('select', '')).toBe(true);
    expect(isEmptyValue('date', undefined)).toBe(true);
    expect(isEmptyValue('checkbox', true)).toBe(false);
  });

  it('AC-012 a required field is invalid when empty', () => {
    expect(isFieldValueValid(field({ name: 'placa' }), '  ', TODAY)).toBe(false);
    expect(isFieldValueValid(field({ name: 'acepta', type: 'checkbox' }), false, TODAY)).toBe(
      false,
    );
    expect(isFieldValueValid(field({ name: 'acepta', type: 'checkbox' }), true, TODAY)).toBe(true);
  });

  it('AC-012 an optional empty field is valid and its other validations are not evaluated', () => {
    const optional = field({
      name: 'telefono',
      required: false,
      validation: { pattern: '^[0-9]+$', minLength: 7 },
    });

    expect(isFieldValueValid(optional, '', TODAY)).toBe(true);
    expect(isFieldValueValid(optional, 'abc', TODAY)).toBe(false);
  });

  it('AC-012 evaluates text on the trimmed value', () => {
    const plate = field({ name: 'placa', validation: { pattern: '^[A-Za-z]{3}[0-9]{3}$' } });

    expect(isFieldValueValid(plate, '  abc123  ', TODAY)).toBe(true);
  });

  it('AC-006 AC-012 a select value must be one of its options', () => {
    const make = field({
      name: 'marca',
      type: 'select',
      options: [{ value: 'toyota', label: 'Toyota', order: 1 }],
    });

    expect(isFieldValueValid(make, 'toyota', TODAY)).toBe(true);
    expect(isFieldValueValid(make, 'kia', TODAY)).toBe(false);
  });

  it('AC-013 AC-014 applies the seeded year and age rules of both countries', () => {
    const year = field({
      name: 'anio',
      type: 'number',
      validation: { integer: true, yearsBefore: 20, yearsAfter: 1 },
    });
    const birth = field({ name: 'fecha-nacimiento', type: 'date', validation: { minAge: 18 } });

    expect(isFieldValueValid(year, '2006', TODAY)).toBe(true);
    expect(isFieldValueValid(year, '2005', TODAY)).toBe(false);
    expect(isFieldValueValid(birth, '2008-11-23', TODAY)).toBe(true);
    expect(isFieldValueValid(birth, '2008-11-24', TODAY)).toBe(false);
  });
});
