/** An entry positioned by its configured order, with Strapi's creation time as the tie breaker. */
export interface Ordered {
  readonly order: number;
  readonly createdAt?: string | undefined;
}

/** Ascending configured order; equal orders keep ascending creation order (AC-004). */
export function compareByOrder(a: Ordered, b: Ordered): number {
  if (a.order !== b.order) {
    return a.order - b.order;
  }
  const aCreated = a.createdAt ?? '';
  const bCreated = b.createdAt ?? '';
  if (aCreated === bCreated) {
    return 0;
  }
  return aCreated < bCreated ? -1 : 1;
}

/** Returns a new array sorted with {@link compareByOrder}; the sort is stable. */
export function sortByOrder<T extends Ordered>(items: readonly T[]): T[] {
  return [...items].sort(compareByOrder);
}
