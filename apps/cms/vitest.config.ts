import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      // Pure logic with a coverage minimum (docs/verification.md).
      include: ['src/api/quote/services/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: { lines: 80 },
    },
  },
});
