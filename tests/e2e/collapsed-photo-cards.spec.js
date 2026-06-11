import { test, expect } from '@playwright/test';

/**
 * Collapsed Photo Cards (Other Projects) — smoke test
 *
 * Added by the 2026-06-12 MDD audit: the collapsed bands and the cross-type
 * single-expand handoff (the headline behavior of docs 05 + 06) previously
 * had zero coverage.
 *
 * Covers, on /photos:
 *   - the Other Projects grid renders collapsed bands
 *   - clicking a band expands it into the full-width gallery (col-span breakout)
 *   - clicking the expanded band again collapses it
 *   - CROSS-TYPE single-expand: opening a collapsed band collapses an
 *     expanded FEATURED card (one expandedProjectId across both card types)
 *
 * Uses dispatchEvent('click') throughout — the desktop smooth-scroll sets
 * body overflow:hidden and translates content via CSS transform, so
 * Playwright's actionability check reports below-the-fold elements as
 * outside the viewport. See .mdd/docs/06-collapsed-photo-cards.md.
 */

const COLLAPSED_CARD = 'article[data-collapsed-photo-card]';
const FEATURED_CARD = 'article[data-featured-photo-card]';
const EXPANDED_GALLERY = '[data-fpc-gallery]';

test.describe('Collapsed Photo Cards (Other Projects)', () => {
  test('the Other Projects grid renders collapsed bands', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const bands = page.locator(COLLAPSED_CARD);
    await expect(bands.first()).toBeAttached();

    const count = await bands.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Every band starts collapsed.
    for (let i = 0; i < Math.min(count, 3); i += 1) {
      await expect(bands.nth(i)).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('clicking a band expands it into the gallery, clicking again collapses it', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const band = page.locator(COLLAPSED_CARD).first();
    await expect(band).toHaveAttribute('aria-expanded', 'false');

    await band.dispatchEvent('click');
    await page.waitForTimeout(1500); // 1200ms open shutter + buffer

    await expect(band).toHaveAttribute('aria-expanded', 'true');
    await expect(band.locator(EXPANDED_GALLERY)).toBeVisible();

    // Expanded card breaks out of the grid to full width (col-span breakout).
    const spansFullRow = await band.evaluate((el) =>
      el.className.includes('col-span-2'),
    );
    expect(spansFullRow).toBe(true);

    // Click the expanded band again → collapses.
    await band.dispatchEvent('click');
    await page.waitForTimeout(1100); // 600ms close + buffer

    await expect(band).toHaveAttribute('aria-expanded', 'false');
  });

  test('cross-type single-expand: opening a band collapses an expanded featured card', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const featured = page.locator(FEATURED_CARD).first();
    const band = page.locator(COLLAPSED_CARD).first();
    await expect(featured).toBeVisible();
    await expect(band).toBeAttached();

    // 1. Expand a featured card.
    await featured.dispatchEvent('click');
    await page.waitForTimeout(1500);
    await expect(featured).toHaveAttribute('aria-expanded', 'true');

    // 2. Open an Other Projects band — the featured card must collapse
    //    (shared expandedProjectId / closeSignals across both card types).
    await band.dispatchEvent('click');
    await page.waitForTimeout(2000); // open + deferred sibling collapse settle

    await expect(band).toHaveAttribute('aria-expanded', 'true');
    await expect(featured).toHaveAttribute('aria-expanded', 'false');
  });

  test('cross-type single-expand: opening a featured card collapses an expanded band', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const featured = page.locator(FEATURED_CARD).first();
    const band = page.locator(COLLAPSED_CARD).first();
    await expect(band).toBeAttached();

    // 1. Expand a band.
    await band.dispatchEvent('click');
    await page.waitForTimeout(1500);
    await expect(band).toHaveAttribute('aria-expanded', 'true');

    // 2. Open a featured card — the band must collapse.
    await featured.dispatchEvent('click');
    await page.waitForTimeout(2000);

    await expect(featured).toHaveAttribute('aria-expanded', 'true');
    await expect(band).toHaveAttribute('aria-expanded', 'false');
  });
});
