import { maskIdentityDocument } from './mask-identity-document';

describe('maskIdentityDocument', () => {
  it.each([
    ['1234567890', '••••••7890'],
    ['123456', '••3456'],
    ['12.345.678-5', '••.•••.678-5'],
    ['12345678-k', '•••••678-k'],
    ['1234567-K', '••••567-K'],
  ])('AC-069 masks %s as %s', (value, masked) => {
    expect(maskIdentityDocument(value)).toBe(masked);
  });

  it.each([
    ['1234', '••••'],
    ['12-3', '••-•'],
    ['k', '•'],
    ['', ''],
  ])('AC-069 masks every letter and digit of %s, which has four or fewer', (value, masked) => {
    expect(maskIdentityDocument(value)).toBe(masked);
  });

  it.each([
    ['.12.345.678-5.', '.••.•••.678-5.'],
    [' 123 456 789 ', ' ••• ••6 789 '],
    ['-AB-1234567', '-••-•••4567'],
  ])('AC-069 keeps separators at the start and the end in place: %s', (value, masked) => {
    expect(maskIdentityDocument(value)).toBe(masked);
  });

  it('AC-069 keeps the length and never shows a hidden character', () => {
    const value = '98.765.432-1';
    const masked = maskIdentityDocument(value);

    expect([...masked]).toHaveLength([...value].length);
    expect(masked).not.toContain('98');
    expect(masked).not.toContain('765');
  });
});
