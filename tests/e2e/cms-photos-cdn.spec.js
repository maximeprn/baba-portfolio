/**
 * CMS — Photos page slideshow + project cards smoke test.
 *
 * Verifies the public site is actually reading photo data from the CMS
 * (Stage 3 + 4) and not the legacy fallback. We do that by asserting
 * the first <img> on /photos has its src on the Sanity CDN.
 *
 * If the CMS fetch failed or the loader fell back to the legacy data
 * file, the src would be `/img/BABA%20PHOTOS/...` — a hard signal that
 * something is wrong (CMS empty, wrong project ID, etc.).
 *
 * Also asserts the page renders without runtime errors.
 */

import { test, expect } from '@playwright/test';

const SANITY_CDN_HOST = 'cdn.sanity.io';

test.describe('CMS photos pipeline (Stages 3 + 4)', () => {
  test('/photos slideshow serves images from the Sanity CDN', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));

    await page.goto('/photos');
    // The slideshow starts with a preloaded image. Wait for one img to settle.
    await page.waitForLoadState('domcontentloaded');

    // The FloatingGalleryHero's <img> in the desktop block.
    const heroImg = page.locator('img[alt="Photography portfolio"]').first();
    await expect(heroImg).toBeVisible({ timeout: 10_000 });

    // The src can take a moment to swap from empty → first photo. Poll.
    await expect
      .poll(async () => heroImg.getAttribute('src'), {
        timeout: 10_000,
        message: 'heroImg never received a src',
      })
      .toMatch(/cdn\.sanity\.io/);

    const src = await heroImg.getAttribute('src');
    expect(src).toContain(SANITY_CDN_HOST);
    // Sanity CDN URLs include the project ID in the path.
    expect(src).toMatch(/cdn\.sanity\.io\/images\/e9pgmdfm\//);

    expect(errors.map((e) => e.message)).toEqual([]);
  });

  test('featured photo project cards exist (data from CMS loader)', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    // Featured photo cards have data-photo-idx on their preview images.
    // If the loader returned an empty array (CMS fetch broken AND fallback
    // also empty), there'd be zero of these.
    const previewImgs = page.locator('img[data-fpc-preview="1"]');
    await expect(previewImgs.first()).toBeVisible({ timeout: 10_000 });

    const count = await previewImgs.count();
    expect(count).toBeGreaterThanOrEqual(2); // each featured card has 2-3 preview slots
  });
});
