import { test, expect } from '@playwright/test';

/**
 * Hero overlay — mobile auto-safe layout
 *
 * Verifies the CMS-driven hero overlay (bio + clients + contact) never
 * collides with the nav links and never overlaps itself, on both heroes:
 *   - /        → Films video hero (HeroSection)
 *   - /photos  → Photos slideshow hero (FloatingGalleryHero)
 *
 * The `:visible` filter is essential: each hero renders the overlay twice
 * (a `hidden md:block` desktop copy + a `md:hidden` mobile copy), so the
 * raw `[data-hero-overlay]` selector matches display:none elements too.
 *
 * See .mdd/docs/13-hero-overlay-mobile.md.
 */

const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 14-class
const NAV = 'nav[aria-label="Main navigation"]';
const OVERLAY_ITEM = '[data-hero-overlay]:visible';
const TOP_ZONE = '[data-hero-overlay-zone="top"]:visible';
const BOTTOM_ZONE = '[data-hero-overlay-zone="bottom"]:visible';
const HERO_PATHS = ['/', '/photos'];

/** Pixel overlap of two boxes' vertical extents (0 = no overlap). */
function verticalOverlap(a, b) {
  return Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
}

test.describe('Hero overlay — mobile auto-safe layout', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  for (const path of HERO_PATHS) {
    test(`overlay text never overlaps the nav links on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const items = page.locator(OVERLAY_ITEM);
      await expect(items.first()).toBeVisible();

      const navBox = await page.locator(NAV).boundingBox();
      expect(navBox).not.toBeNull();
      const navBottom = navBox.y + navBox.height;

      const count = await items.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i += 1) {
        const box = await items.nth(i).boundingBox();
        if (!box) continue;
        // Every overlay item must start at or below the nav's bottom edge.
        expect(
          box.y,
          `overlay item #${i} top (${box.y}) should clear the nav bottom (${navBottom})`,
        ).toBeGreaterThanOrEqual(navBottom);
      }
    });

    test(`top and bottom overlay zones do not overlap on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const top = page.locator(TOP_ZONE);
      const bottom = page.locator(BOTTOM_ZONE);
      await expect(top.or(bottom).first()).toBeVisible();

      if ((await top.count()) > 0 && (await bottom.count()) > 0) {
        const topBox = await top.boundingBox();
        const bottomBox = await bottom.boundingBox();
        expect(verticalOverlap(topBox, bottomBox)).toBe(0);
        expect(topBox.y + topBox.height).toBeLessThanOrEqual(bottomBox.y);
      }
    });

    test(`overlay items stay within the screen horizontally on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');

      const items = page.locator(OVERLAY_ITEM);
      await expect(items.first()).toBeVisible();

      const count = await items.count();
      for (let i = 0; i < count; i += 1) {
        const box = await items.nth(i).boundingBox();
        if (!box) continue;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(MOBILE_VIEWPORT.width + 1);
      }
    });
  }

  test('overlay items render at a legible font size', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const first = page.locator(OVERLAY_ITEM).first();
    await expect(first).toBeVisible();

    const fontSizePx = await first.evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    );
    expect(fontSizePx).toBeGreaterThan(10);
    expect(fontSizePx).toBeLessThan(60);
  });
});

test.describe('Hero overlay — desktop nav guard', () => {
  test('overlay text stays clear of the nav on desktop /', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const items = page.locator(OVERLAY_ITEM);
    await expect(items.first()).toBeVisible();

    const navBox = await page.locator(NAV).boundingBox();
    expect(navBox).not.toBeNull();

    const count = await items.count();
    for (let i = 0; i < count; i += 1) {
      const box = await items.nth(i).boundingBox();
      if (!box) continue;
      // Top-anchored items are clamped below the 96px desktop nav-safe line;
      // bottom-anchored items sit far lower. None may reach the nav top.
      expect(box.y).toBeGreaterThan(navBox.y);
    }
  });
});
