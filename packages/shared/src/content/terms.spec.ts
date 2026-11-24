import { describe, expect, it } from 'vitest';
import { chileTerms, colombiaTerms } from '../test-fixtures.js';
import { termsSchema } from './terms.js';

describe('terms schema', () => {
  it('AC-077 accepts exactly one published terms entry and keeps its text as configured', () => {
    expect(termsSchema.parse(colombiaTerms())).toEqual(colombiaTerms()[0]);
    expect(termsSchema.parse(chileTerms()).text).toContain('\n\n');
  });

  it.each([
    ['no entry', []],
    ['two entries', [...colombiaTerms(), ...chileTerms()]],
    ['an empty text', [{ text: '' }]],
    ['a text made only of blank lines', [{ text: '  \n\n \t ' }]],
    ['no text', [{ text: null }]],
    ['no list', null],
  ])('AC-077 AC-017 rejects %s', (_, terms) => {
    expect(termsSchema.safeParse(terms).success).toBe(false);
  });
});
