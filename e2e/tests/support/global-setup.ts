import { ensureAdminCredentials } from './strapi-admin.js';

/**
 * Runs once before the workers start. The specs that change content (AC-007, AC-036, AC-039,
 * AC-058) share one test-only Strapi administrator: its credentials are taken from the environment
 * or, on a fresh stack, registered with random values and handed to the workers through
 * `process.env`. They stay in Node and never reach the browser (P4).
 */
export default async function globalSetup(): Promise<void> {
  await ensureAdminCredentials();
}
