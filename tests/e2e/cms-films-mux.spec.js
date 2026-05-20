/**
 * CMS — Films Mux playback smoke test (Stage 6).
 *
 * Verifies that featured film cards on the homepage stream from Mux's CDN
 * (and not the legacy Vercel Blob path) once the migration has run.
 *
 * Heuristic: after the homepage scrolls past the hero, at least one network
 * request should hit stream.mux.com (HLS playlist) OR image.mux.com (poster).
 *
 * This test is intentionally lenient — it passes if EITHER signal appears,
 * so legacy films still on Blob don't make it red. Once every film is on
 * Mux, tighten by counting.
 */

import { test, expect } from '@playwright/test';

test.describe('CMS films Mux playback (Stage 6)', () => {
  test('homepage requests at least one Mux asset (HLS or poster)', async ({ page }) => {
    const muxRequests = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('stream.mux.com') || url.includes('image.mux.com')) {
        muxRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Let the in-view effect fire on the first featured card.
    await page.waitForTimeout(2000);

    expect(muxRequests.length).toBeGreaterThanOrEqual(1);
  });
});
