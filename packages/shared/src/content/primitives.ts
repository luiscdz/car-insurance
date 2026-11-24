import { z } from 'zod';

/** Text that contains at least one character other than white space. */
export const nonBlankTextSchema = z.string().regex(/\S/, 'Text must not be blank');

/** Optional text as Strapi returns it: a string, `null` or absent. */
export const optionalTextSchema = z.string().nullish();

/** Position of an entry among its siblings, as configured in Strapi. */
export const orderSchema = z.number().int();

/** Creation timestamp Strapi adds to every entry; used to break ties between equal orders. */
export const createdAtSchema = z.string().optional();

/** Key of a field or step used in addresses and storage: lower-case words joined by hyphens. */
export const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const keySchema = z.string().regex(KEY_PATTERN, 'Use lower-case words joined by hyphens');
