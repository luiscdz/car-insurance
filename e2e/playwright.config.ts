import { defineConfig, devices } from '@playwright/test';

/**
 * Tests run against the full stack started with `docker compose up` and its seed data.
 * E2E_BASE_URL points at the web application (default: the Compose `web` service).
 */
const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';

/** AC-007 changes published content, so it runs alone after every other test. */
const CONTENT_CHANGES = /content-changes\.spec\.ts/;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile',
      testIgnore: CONTENT_CHANGES,
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } },
    },
    {
      name: 'desktop',
      testIgnore: CONTENT_CHANGES,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'content-changes',
      testMatch: CONTENT_CHANGES,
      dependencies: ['mobile', 'desktop'],
      fullyParallel: false,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
});
