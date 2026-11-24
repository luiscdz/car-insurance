export interface YearRange {
  readonly min: number;
  readonly max: number;
}

/** Years from `yearsBefore` before to `yearsAfter` after the current year, inclusive (AC-013). */
export function yearRange(today: Date, yearsBefore: number, yearsAfter: number): YearRange {
  const year = today.getFullYear();
  return { min: year - yearsBefore, max: year + yearsAfter };
}
