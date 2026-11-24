import { expect, type Page } from '@playwright/test';

/** Nothing on the page scrolls horizontally (AC-029, AC-062). */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Every visible interactive target is at least 24 × 24 CSS pixels (AC-029, AC-062). */
export async function expectTargetsOfAtLeast24px(page: Page): Promise<void> {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('a, button, input, select')]
      .filter((element) => element.offsetParent !== null)
      .map((element) => ({
        element: element.outerHTML.slice(0, 80),
        box: element.getBoundingClientRect(),
      }))
      .filter(({ box }) => box.width < 24 || box.height < 24)
      .map(({ element }) => element),
  );
  expect(small).toEqual([]);
}

/** Runs `check` at each width with the current page, then restores the viewport (AC-092). */
export async function atWidths(
  page: Page,
  widths: readonly number[],
  check: (width: number) => Promise<void>,
): Promise<void> {
  const original = page.viewportSize();
  for (const width of widths) {
    await page.setViewportSize({ width, height: original?.height ?? 800 });
    await check(width);
  }
  if (original) {
    await page.setViewportSize(original);
  }
}
