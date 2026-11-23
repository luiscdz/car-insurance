import AxeBuilder from '@axe-core/playwright';
import { test as base, expect } from '@playwright/test';

/** WCAG 2.2 AA rule tags checked on every scanned page (docs/design.md). */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

type Fixtures = {
  /** Runs an axe scan of the current page and fails the test on any violation. */
  expectNoAxeViolations: () => Promise<void>;
};

export const test = base.extend<Fixtures>({
  expectNoAxeViolations: async ({ page }, use) => {
    await use(async () => {
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(results.violations).toEqual([]);
    });
  },
});

export { expect };
