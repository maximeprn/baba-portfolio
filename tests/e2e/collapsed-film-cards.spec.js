import { test, expect } from '@playwright/test';

/**
 * Collapsed Film Cards — "Other Projects" smoke test
 *
 * Verifies the inline expand/collapse interaction of the Films-page
 * "Other Projects" bands (CollapsedFilmCard):
 *   - the homepage renders the collapsed bands
 *   - clicking a band expands it (aria-expanded → true)
 *   - clicking the expanded card again collapses it (aria-expanded → false)
 *   - the cards are INDEPENDENT — opening a second band leaves the first
 *     one open (no single-expand, unlike the Photos page)
 *
 * Assertions are deterministic — they only read `aria-expanded`, never
 * scroll position — so they are immune to the smooth-scroll ease timing
 * that makes pixel-position tests flaky. The long waits cover the
 * 1200 ms open / 600 ms close shutter timing.
 *
 * `dispatchEvent('click')` (not `.click()`) is mandatory on `/` — the
 * desktop smooth-scroll defeats Playwright's actionability check for
 * elements below the fold. See .mdd/docs/03-collapsed-film-cards.md.
 */

const COLLAPSED_CARD = 'article[data-collapsed-film-card]';

test.describe('Collapsed Film Cards — Other Projects', () => {
  test('the homepage renders at least one collapsed "Other Projects" band', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const bands = page.locator(COLLAPSED_CARD);
    await expect(bands.first()).toBeAttached();

    const count = await bands.count();
    expect(count).toBeGreaterThanOrEqual(1);

    await expect(bands.first()).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking a collapsed band expands it, clicking again collapses it', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const band = page.locator(COLLAPSED_CARD).first();
    await expect(band).toHaveAttribute('aria-expanded', 'false');

    // Expand — 1200 ms open shutter + buffer.
    await band.dispatchEvent('click');
    await page.waitForTimeout(1600);
    await expect(band).toHaveAttribute('aria-expanded', 'true');

    // Collapse by clicking the expanded card — 600 ms close shutter + buffer.
    await band.dispatchEvent('click');
    await page.waitForTimeout(1000);
    await expect(band).toHaveAttribute('aria-expanded', 'false');
  });

  test('opening a second band leaves the first one open (no single-expand)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const bands = page.locator(COLLAPSED_CARD);
    const count = await bands.count();
    test.skip(count < 2, 'Need at least 2 collapsed bands for this test');

    const a = bands.nth(0);
    const b = bands.nth(1);

    await a.dispatchEvent('click');
    await page.waitForTimeout(1600);
    await expect(a).toHaveAttribute('aria-expanded', 'true');

    // Film cards are independent — opening B must NOT collapse A.
    await b.dispatchEvent('click');
    await page.waitForTimeout(1600);

    await expect(a).toHaveAttribute('aria-expanded', 'true');
    await expect(b).toHaveAttribute('aria-expanded', 'true');
  });
});
