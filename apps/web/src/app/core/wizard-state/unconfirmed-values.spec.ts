import { field } from '../../../testing/content-fixtures';
import { hasUnconfirmedValues } from './unconfirmed-values';

const fields = [
  field({ name: 'placa' }),
  field({ name: 'uso', type: 'checkbox', required: false }),
];

describe('unconfirmed values', () => {
  it('AC-033 nothing typed in a step never completed has no unconfirmed values', () => {
    expect(hasUnconfirmedValues(fields, { placa: '', uso: false }, undefined)).toBe(false);
  });

  it('AC-033 a value typed in a step never completed is unconfirmed', () => {
    expect(hasUnconfirmedValues(fields, { placa: 'abc', uso: false }, undefined)).toBe(true);
    expect(hasUnconfirmedValues(fields, { placa: '', uso: true }, undefined)).toBe(true);
  });

  it('AC-033 values equal to the stored ones are not unconfirmed, ignoring outer spaces', () => {
    const stored = { placa: 'ABC123', uso: true };

    expect(hasUnconfirmedValues(fields, { placa: ' ABC123 ', uso: true }, stored)).toBe(false);
    expect(hasUnconfirmedValues(fields, { placa: 'ABC124', uso: true }, stored)).toBe(true);
    expect(hasUnconfirmedValues(fields, { placa: 'ABC123', uso: false }, stored)).toBe(true);
  });

  it('AC-033 a field missing from the stored values counts as empty', () => {
    expect(hasUnconfirmedValues(fields, { placa: 'ABC123', uso: false }, { placa: 'ABC123' })).toBe(
      false,
    );
  });
});
