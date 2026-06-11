/**
 * CMS — Films pipeline (Stage 5) smoke test.
 *
 * Verifies the homepage is reading film data from the CMS (Stage 5) and not
 * the legacy `src/data/films.js` fallback.
 *
 * Post-Mux reality (audit 2026-06-12): a film's poster is
 * `thumbnail || muxPosterUrl` — i.e. the Sanity CDN (`cdn.sanity.io`) when an
 * editor uploaded an explicit thumbnail, otherwise Mux's auto-probed poster
 * (`image.mux.com`). It is set as the featured card's `<video poster>` /
 * background-image, NOT as an `<img>` (and collapsed cards keep their body
 * unmounted while collapsed). So we assert at least one film card's video
 * poster points at either CDN.
 *
 * If the CMS fetch failed and the loader fell back to legacy data, the
 * poster would be `/posters/<slug>.jpg` — a hard signal that something is
 * wrong (CMS empty, film missing media in Studio, etc.).
 *
 * Also asserts the page renders without runtime errors.
 */

import { test, expect } from '@playwright/test';

const CMS_CDN_HOSTS = ['cdn.sanity.io', 'image.mux.com'];

test.describe('CMS films pipeline (Stage 5)', () => {
  test('homepage film posters come from the Sanity or Mux CDN', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Collect every candidate poster URL rendered by film cards: <video
    // poster> attributes plus any <img> src (covers films with explicit
    // Sanity thumbnails).
    const collectPosterUrls = () =>
      page.evaluate(() => {
        const urls = [];
        document.querySelectorAll('video').forEach((v) => {
          if (v.poster) urls.push(v.poster);
        });
        document.querySelectorAll('img').forEach((i) => {
          if (i.src) urls.push(i.src);
        });
        return urls;
      });

    await expect
      .poll(
        async () => {
          const urls = await collectPosterUrls();
          return urls.some((u) => CMS_CDN_HOSTS.some((host) => u.includes(host)));
        },
        {
          timeout: 15_000,
          message: 'No film poster/img on a CMS CDN (cdn.sanity.io / image.mux.com) was ever rendered on /',
        },
      )
      .toBe(true);

    // Belt-and-braces: no card should be using the legacy fallback's
    // `/posters/<slug>.jpg` paths.
    const urls = await collectPosterUrls();
    const legacy = urls.filter((u) => u.includes('/posters/'));
    expect(legacy).toEqual([]);

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
