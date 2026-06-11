import { test, expect } from '@playwright/test';

/**
 * FilmModal — Vimeo overlay load-watchdog regression tests.
 *
 * Bug (fixed 2026-06-12): the modal armed a 20s "still not loaded" watchdog
 * that was only cleared on unmount — never on iframe load. Exactly 20s after
 * opening, the "Video failed to load" overlay painted over the still-playing
 * player (audio kept going underneath).
 *
 * These tests use Playwright's fake clock to cross the 20s boundary without
 * really waiting:
 *   - loaded player + 21s later → NO error overlay (the regression)
 *   - iframe that can never load + 21s later → error overlay (the watchdog
 *     must still catch genuine failures)
 *
 * clock.install() fakes rAF too, so after actions that rely on a rAF tick
 * (the modal's open transition) we advance the clock a little.
 */

const FILM_CARD = 'article[data-featured-film-card]';
const MODAL = '[role="dialog"][aria-modal="true"]';
const ERROR_TEXT = 'Video failed to load';

test.describe('FilmModal load watchdog', () => {
  test('no false "Video failed to load" after the player has loaded', async ({ page }) => {
    // Fake timers must be installed before any page script captures them.
    await page.clock.install();

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.clock.runFor(500); // let boot-time rAF/timers tick

    const card = page.locator(FILM_CARD).first();
    await expect(card).toBeVisible();
    await card.dispatchEvent('click');
    await page.clock.runFor(200); // modal's open rAF (isVisible + focus)

    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();

    // Wait for the real network iframe load: onLoad hides the spinner.
    const spinner = modal.locator('.animate-spin');
    await expect(spinner).toBeHidden({ timeout: 15_000 });
    await expect(modal.locator('iframe[src*="player.vimeo.com"]')).toBeVisible();
    await expect(modal.getByText(ERROR_TEXT)).toBeHidden();

    // Cross the 20s watchdog boundary. Pre-fix this flipped loadError(true)
    // and covered the playing video.
    await page.clock.runFor(21_000);

    await expect(modal.getByText(ERROR_TEXT)).toBeHidden();
    await expect(modal.locator('iframe[src*="player.vimeo.com"]')).toBeVisible();
  });

  test('genuine load failure still shows the error after 20s (watchdog intact)', async ({ page }) => {
    await page.clock.install();

    // Black-hole the Vimeo player so the iframe can never fire onLoad.
    // NOTE: route.abort() is NOT a faithful simulation — Chromium still
    // fires the iframe element's `load` event for an aborted/error subframe
    // navigation, which (correctly) clears the watchdog. A hung request —
    // a handler that never resolves — is what a genuine "never loads"
    // failure looks like to the parent document.
    await page.route('**://player.vimeo.com/**', () => {
      /* never fulfill, never abort — the request hangs forever */
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.clock.runFor(500);

    const card = page.locator(FILM_CARD).first();
    await expect(card).toBeVisible();
    await card.dispatchEvent('click');
    await page.clock.runFor(200);

    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();

    // Before the watchdog fires there is no error yet…
    await expect(modal.getByText(ERROR_TEXT)).toBeHidden();

    // …and after 21 fake seconds the watchdog must surface it.
    await page.clock.runFor(21_000);
    await expect(modal.getByText(ERROR_TEXT)).toBeVisible();

    // The error state still offers a way out.
    await modal.getByRole('button', { name: 'Close' }).first().click();
    await expect(modal).toBeHidden();
  });
});
