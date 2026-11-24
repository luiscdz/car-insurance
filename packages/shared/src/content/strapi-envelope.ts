import { z } from 'zod';

/** Envelope of a Strapi REST collection response: `{ data: [...], meta: {...} }`. */
export function collectionResponseSchema<T extends z.ZodType>(item: T) {
  return z.object({ data: z.array(item) });
}
