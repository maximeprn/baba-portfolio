/**
 * CMS — Films pipeline (Stage 5) smoke test.
 *
 * Verifies the homepage is reading film data from the CMS (Stage 5) and not
 * the legacy `src/data/films.js` fallback. We assert at least one film card
 * has a thumbnail URL pointing at the Sanity CDN.
 *
 * If the CMS fetch failed or the loader fell back to legacy data, the
 * thumbnail src would be `/posters/<slug>.jpg` — a hard signal that
 * something is wrong (CMS empty, film missing thumbnail in Studio, etc.).
 *
 * Also asserts the page renders without runtime errors.
 */

import { test, expect } from '@playwright/test';

const SANITY_CDN_HOST = 'cdn.sanity.io';

test.describe('CMS films pipeline (Stage 5)', () => {
  test('homepage thumbnails come from the Sanity CDN', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Collapsed cards always render the thumbnail; FeaturedFilmCard also
    // renders one as the video poster. We look for any <img> on the page
    // whose src is on the Sanity CDN — at least one film must have a
    // thumbnail there if the migration ran.
    await expect
      .poll(
        async () => {
          const srcs = await page.locator('img').evaluateAll((nodes) =>
            nodes.map((n) => n.getAttribute('src')).filter(Boolean),
          );
          return srcs.some((s) => s.includes(SANITY_CDN_HOST));
        },
        {
          timeout: 15_000,
          message: 'No <img> with cdn.sanity.io src was ever rendered on /',
        },
      )
      .toBe(true);

    // And no runtime errors during the homepage mount.
    expect(errors.map((e) => e.message)).toEqual([]);
  });

  test('homepage renders featured film cards (data from CMS loader)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Featured films render with className="film-card …" via FeaturedFilmCard.
    // If the loader returned an empty array (CMS fetch broken AND legacy
    // fallback also empty), there'd be zero of these.
    const filmCards = page.locator('.film-card');
    await expect(filmCards.first()).toBeVisible({ timeout: 10_000 });

    const count = await filmCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
