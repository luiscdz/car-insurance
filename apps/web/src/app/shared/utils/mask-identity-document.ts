/** Character shown in place of each hidden letter or digit (AC-069). */
export const MASK_CHARACTER = '•';

/** Letters and digits of any script count; every other character is a separator. */
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** Letters and digits that stay visible at the end of the value. */
const VISIBLE = 4;

/**
 * Masks an identity document number with one fixed rule (AC-069): every letter and digit is
 * replaced by `•` except the last four, which stay as entered; dots, hyphens, spaces and other
 * separators stay in place; a value with four letters and digits or fewer is masked completely.
 * The rule is the same for every country and names none.
 */
export function maskIdentityDocument(value: string): string {
  const characters = [...value];
  const total = characters.filter((character) => LETTER_OR_DIGIT.test(character)).length;
  const hidden = total > VISIBLE ? total - VISIBLE : total;
  let seen = 0;
  return characters
    .map((character) => {
      if (!LETTER_OR_DIGIT.test(character)) {
        return character;
      }
      seen += 1;
      return seen <= hidden ? MASK_CHARACTER : character;
    })
    .join('');
}
