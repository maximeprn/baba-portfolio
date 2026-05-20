import { test, expect } from '@playwright/test';

/**
 * Hero overlay — mobile auto-safe layout + per-screen sizing
 *
 * Verifies the CMS-driven hero overlay (bio + clients + contact) never
 * collides with the nav links or itself, and that text scales per viewport
 * tier (phone / tablet / desktop), on both heroes:
 *   - /        → Films video hero (HeroSection)
 *   - /photos  → Photos slideshow hero (FloatingGalleryHero)
 *
 * The `:visible` filter is essential: each hero renders the overlay twice
 * (a `hidden md:block` desktop copy + a `md:hidden` mobile copy), so the
 * raw `[data-hero-overlay]` selector matches display:none elements too.
 *
 * See .mdd/docs/14-hero-overlay-sizing.md and 13-hero-overlay-mobile.md.
 */

const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 14-class
const TABLET_VIEWPORT = { width: 834, height: 1112 }; // iPad-class
const DESKTOP_VIEWPORT = { width: 1280, height: 900 };
const NAV = 'nav[aria-label="Main navigation"]';
const OVERLAY_ITEM = '[data-hero-overlay]:visible';
const TOP_ZONE = '[data-hero-overlay-zone="top"]:visible';
const BOTTOM_ZONE = '[data-hero-overlay-zone="bottom"]:visible';
const HERO_PATHS = ['/', '/photos'];

/** Pixel overlap of two boxes' vertical extents (0 = no overlap). */
function verticalOverlap(a, b) {
  return Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
}

/** Computed font-size (px) of the first visible overlay item on a page. */
async function firstOverlayFontPx(page, path = '/') {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  const first = page.locator(OVERLAY_ITEM).first();
  await expect(first).toBeVisible();
  return first.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
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
    const fontSizePx = await firstOverlayFontPx(page, '/');
    expect(fontSizePx).toBeGreaterThan(10);
    expect(fontSizePx).toBeLessThan(60);
  });
});

test.describe('Hero overlay — desktop layout', () => {
  test('overlay text stays clear of the nav on desktop /', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
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
      // Top items sit at the fixed 9rem inset; bottom items far lower.
      expect(box.y).toBeGreaterThan(navBox.y);
    }
  });

  test('the gap between stacked bio + client texts is tight, not bloated', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const items = page.locator(OVERLAY_ITEM);
    await expect(items.first()).toBeVisible();

    const bio = await items.nth(0).boundingBox();
    const clients = await items.nth(1).boundingBox();
    const gap = clients.y - (bio.y + bio.height);
    // Proportional gap (~14px for md) — was a fixed 40px before.
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(gap).toBeLessThan(28);
  });
});

test.describe('Hero overlay — per-screen sizing', () => {
  // All live overlay items are in auto mode, so text grows with the
  // viewport: phone < tablet ≤ desktop.

  test('text is smaller on phone than on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    const desktopPx = await firstOverlayFontPx(page, '/');

    await page.setViewportSize(MOBILE_VIEWPORT);
    const phonePx = await firstOverlayFontPx(page, '/');

    expect(phonePx).toBeGreaterThan(0);
    expect(phonePx).toBeLessThan(desktopPx);
  });

  test('tablet text sits between phone and desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    const desktopPx = await firstOverlayFontPx(page, '/');

    await page.setViewportSize(MOBILE_VIEWPORT);
    const phonePx = await firstOverlayFontPx(page, '/');

    await page.setViewportSize(TABLET_VIEWPORT);
    const tabletPx = await firstOverlayFontPx(page, '/');

    expect(tabletPx).toBeGreaterThanOrEqual(phonePx);
    expect(tabletPx).toBeLessThanOrEqual(desktopPx);
  });
});
