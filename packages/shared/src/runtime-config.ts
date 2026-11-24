import { z } from 'zod';

/** Runtime configuration of the web application (`config.json`); it holds no secrets (P4). */
export const runtimeConfigSchema = z.object({
  cmsUrl: z.url({ protocol: /^https?$/ }).transform((url) => url.replace(/\/+$/, '')),
});

export type RuntimeConfig = z.output<typeof runtimeConfigSchema>;
