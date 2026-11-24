import { z } from 'zod';
import { nonBlankTextSchema } from './primitives.js';

/** A published terms and conditions entry of a country, as plain text (AC-074). */
export const termsEntrySchema = z.object({
  text: nonBlankTextSchema,
});

/**
 * The published terms of a country: exactly one entry with a non-blank text (AC-077). No entry,
 * several entries or a blank text are invalid content.
 */
export const termsSchema = z
  .array(termsEntrySchema)
  .length(1)
  .transform(([entry]) => entry as TermsEntry);

export type TermsEntry = z.output<typeof termsEntrySchema>;
export type Terms = z.output<typeof termsSchema>;
