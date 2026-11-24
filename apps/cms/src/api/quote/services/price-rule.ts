/**
 * The simulated price rule (AC-043). It is a simulation (P5), not a real rating, and the same for
 * every country: final price = base × (1 + vehicle adjustment + age adjustment), rounded to the
 * nearest whole amount with halves up. Adjustments are whole percentages, so the arithmetic is
 * exact on integers.
 */

/** An adjustment that applies up to and including an age in whole years. */
interface Bracket {
  readonly upToAge: number;
  readonly percent: number;
}

/** Vehicle age V: 0–5 years +0 %, 6–10 +10 %, 11 or more +20 % (next year's model is V = −1). */
export const VEHICLE_AGE_BRACKETS: readonly Bracket[] = [
  { upToAge: 5, percent: 0 },
  { upToAge: 10, percent: 10 },
  { upToAge: Number.POSITIVE_INFINITY, percent: 20 },
];

/** Policyholder age A: up to 25 years +15 %, 26–64 +0 %, 65 or more +10 %. */
export const POLICYHOLDER_AGE_BRACKETS: readonly Bracket[] = [
  { upToAge: 25, percent: 15 },
  { upToAge: 64, percent: 0 },
  { upToAge: Number.POSITIVE_INFINITY, percent: 10 },
];

const WHOLE = 100;
const HALF = WHOLE / 2;

/** Percentage of a bracket for an age; an input that is not available adds nothing. */
function adjustment(brackets: readonly Bracket[], age: number | undefined): number {
  if (age === undefined) {
    return 0;
  }
  return brackets.find((bracket) => age <= bracket.upToAge)?.percent ?? 0;
}

/**
 * Final price of a plan from its base price and the ages derived from the person's data
 * (AC-043, AC-044). Rounds to the nearest whole amount, halves up.
 */
export function finalPrice(
  basePrice: number,
  policyholderAge: number | undefined,
  vehicleAge: number | undefined,
): number {
  const percent =
    WHOLE +
    adjustment(VEHICLE_AGE_BRACKETS, vehicleAge) +
    adjustment(POLICYHOLDER_AGE_BRACKETS, policyholderAge);
  return Math.floor((basePrice * percent + HALF) / WHOLE);
}
