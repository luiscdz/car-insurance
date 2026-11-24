import { randomInt } from 'node:crypto';

/** Characters a quote number's random part is drawn from (AC-084). */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const RANDOM_LENGTH = 6;

/** Returns a whole number from 0 up to, not including, `max`. */
export type RandomPick = (max: number) => number;

function utcDate(now: Date): string {
  const year = String(now.getUTCFullYear()).padStart(4, '0');
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * A simulated quote number (AC-084): the request's country code in upper case, the current UTC
 * date as YYYYMMDD and six characters drawn at random from A to Z and 0 to 9. It is not stored,
 * so two payments may in rare cases receive the same number. No country is named here.
 */
export function quoteNumber(
  code: string,
  now: Date = new Date(),
  pick: RandomPick = (max) => randomInt(max),
): string {
  let random = '';
  for (let index = 0; index < RANDOM_LENGTH; index += 1) {
    random += ALPHABET.charAt(pick(ALPHABET.length));
  }
  return `${code.toUpperCase()}-${utcDate(now)}-${random}`;
}
