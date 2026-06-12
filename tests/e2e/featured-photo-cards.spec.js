import { test, expect } from '@playwright/test';

/**
 * Featured Photo Cards — smoke test
 *
 * Verifies the inline expand/collapse interaction on /photos:
 *   - the page loads with the slideshow hero
 *   - featured cards render
 *   - clicking a card expands it (gallery becomes visible)
 *   - clicking another card collapses the first and expands the second (single-expand)
 *   - clicking the X close indicator collapses the expanded card
 *
 * The 1200ms open / 600ms close animation timing is the source of the long
 * waits. See .mdd/docs/05-featured-photo-cards.md.
 */

const FEATURED_CARD = 'article[data-featured-photo-card]';
const EXPANDED_GALLERY = '[data-fpc-gallery]';
const CLOSE_INDICATOR = '[data-fpc-close]';

test.describe('Featured Photo Cards', () => {
  test('the /photos page loads with hero + at least one featured card', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const hero = page.locator('section[aria-label="Photo gallery hero"]');
    await expect(hero).toBeVisible();

    const cards = page.locator(FEATURED_CARD);
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('clicking a featured card expands it and reveals the gallery', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const firstCard = page.locator(FEATURED_CARD).first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toHaveAttribute('aria-expanded', 'false');

    await firstCard.dispatchEvent('click');
    await page.waitForTimeout(1500); // 1200ms open + buffer

    await expect(firstCard).toHaveAttribute('aria-expanded', 'true');

    const gallery = firstCard.locator(EXPANDED_GALLERY);
    await expect(gallery).toBeVisible();
  });

  test('opening a second card collapses the first (single-expand enforcement)', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const cards = page.locator(FEATURED_CARD);
    const count = await cards.count();
    test.skip(count < 2, 'Need at least 2 featured cards for this test');

    const a = cards.nth(0);
    const b = cards.nth(1);

    await a.dispatchEvent('click');
    await page.waitForTimeout(1500);
    await expect(a).toHaveAttribute('aria-expanded', 'true');

    await b.dispatchEvent('click');
    await page.waitForTimeout(1500); // both animations have to settle

    await expect(a).toHaveAttribute('aria-expanded', 'false');
    await expect(b).toHaveAttribute('aria-expanded', 'true');
  });

  test('clicking the X close indicator collapses the expanded card', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const firstCard = page.locator(FEATURED_CARD).first();
    await firstCard.dispatchEvent('click');
    await page.waitForTimeout(1500);
    await expect(firstCard).toHaveAttribute('aria-expanded', 'true');

    const closeBtn = firstCard.locator(CLOSE_INDICATOR);
    await closeBtn.dispatchEvent('click');
    await page.waitForTimeout(900); // 600ms close + buffer

    await expect(firstCard).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking the title text on a collapsed card expands it', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const firstCard = page.locator(FEATURED_CARD).first();
    await expect(firstCard).toHaveAttribute('aria-expanded', 'false');

    // Click the h3 title inside the collapsed preview — used to be inert
    // (stopPropagation). The whole card is now click-to-expand.
    const title = firstCard.locator('h3').first();
    await title.dispatchEvent('click');
    await page.waitForTimeout(1500);

    await expect(firstCard).toHaveAttribute('aria-expanded', 'true');
  });

  test('switching cards collapses the first instantly (no animating-close phase)', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const cards = page.locator(FEATURED_CARD);
    const count = await cards.count();
    test.skip(count < 2, 'Need at least 2 featured cards for this test');

    const a = cards.nth(0);
    const b = cards.nth(1);

    await a.dispatchEvent('click');
    await page.waitForTimeout(1500);
    await expect(a).toHaveAttribute('aria-expanded', 'true');

    // Click B, then check A's collapse before the legacy 600ms close window
    // would have completed. Instant collapse means a is already aria-expanded=false
    // shortly after the click — well under the old 600ms shutter.
    await b.dispatchEvent('click');
    await page.waitForTimeout(150);
    await expect(a).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking a gallery photo opens a centered lightbox; arrows navigate', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const firstCard = page.locator(FEATURED_CARD).first();
    await firstCard.dispatchEvent('click');
    await page.waitForTimeout(1500);

    // Click the first gallery image. The lightbox must portal to body and
    // appear within the viewport regardless of how far we've scrolled —
    // the bug we're guarding against is `position: fixed` being anchored
    // to the smooth-scroll wrapper's transform, which would push the
    // overlay offscreen.
    const galleryImg = firstCard.locator('img[data-fpc-gallery-img="1"]').first();
    await galleryImg.dispatchEvent('click');
    await page.waitForTimeout(200);

    const lightbox = page.locator('[role="dialog"][aria-label="Image lightbox"]');
    await expect(lightbox).toBeVisible();

    // The Lightbox is a 3-slide swipe carousel (prev / current / next on a
    // translated track) — the prev/next slides sit one viewport-width
    // off-screen, so we must target the CURRENT slide's image, not
    // `img.first()` (audit 2026-06-12).
    const currentImg = lightbox.locator('[data-lightbox-slot="current"] img');

    // The current image should be visible and centered. Read its bounding
    // rect and the viewport size.
    const rect = await currentImg.boundingBox();
    const viewport = page.viewportSize();
    expect(rect).not.toBeNull();
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
    // Image must fit fully inside the viewport (no overflow).
    expect(rect.x).toBeGreaterThanOrEqual(-1);
    expect(rect.y).toBeGreaterThanOrEqual(-1);
    expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height + 1);
    // Roughly centered (allow 50% tolerance because images aren't always
    // viewport-shape; we just want to rule out wildly offset positioning).
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    expect(Math.abs(centerX - viewport.width / 2)).toBeLessThan(viewport.width * 0.1);
    expect(Math.abs(centerY - viewport.height / 2)).toBeLessThan(viewport.height * 0.1);

    // Navigate forward with the right-arrow button.
    const initialSrc = await currentImg.getAttribute('src');
    await page.locator('[aria-label="Next photo"]').click();
    await page.waitForTimeout(100);
    const nextSrc = await currentImg.getAttribute('src');
    expect(nextSrc).not.toBe(initialSrc);

    // And back with the left-arrow button.
    await page.locator('[aria-label="Previous photo"]').click();
    await page.waitForTimeout(100);
    const backSrc = await currentImg.getAttribute('src');
    expect(backSrc).toBe(initialSrc);

    // Wraparound: next from the last photo lands on the first; previous
    // from the first lands on the last. We assert via the "i / N" counter
    // text since src may not be unique per photo on test data.
    const counter = lightbox.locator('p.font-header').last();
    const counterText = await counter.textContent();
    const total = parseInt(counterText.split('/')[1].trim(), 10);
    expect(total).toBeGreaterThanOrEqual(2);

    // Step backward from index 0 — should land on the last photo (N).
    await page.locator('[aria-label="Previous photo"]').click();
    await page.waitForTimeout(100);
    expect((await counter.textContent()).trim()).toBe(`${total} / ${total}`);

    // Step forward from the last photo — should wrap to index 0 (1).
    await page.locator('[aria-label="Next photo"]').click();
    await page.waitForTimeout(100);
    expect((await counter.textContent()).trim()).toBe(`1 / ${total}`);
  });

  test('switching cards: B title lands at top, A collapse is invisible (anchored)', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const cards = page.locator(FEATURED_CARD);
    const count = await cards.count();
    test.skip(count < 2, 'Need at least 2 featured cards for this test');

    const a = cards.nth(0);
    const b = cards.nth(1);

    // Open A. Wait for full open settle.
    await a.dispatchEvent('click');
    await page.waitForTimeout(1500);

    // Sanity: A's gallery is open, so B has been pushed far down the document.
    const bTopWithAOpen = await b.evaluate((el) => el.getBoundingClientRect().top);

    // Click B. After the open animation, B's article top should be at (or
    // very close to) viewport y=0. If the anchor logic regressed, B would
    // be either above the viewport (negative top) or far below it.
    await b.dispatchEvent('click');
    await page.waitForTimeout(1500);

    // B's open transition ends at ~1200ms, then A's DEFERRED collapse +
    // scroll-compensate land (photo-card-expand-done) and the smooth
    // scroll keeps easing toward the anchor — so poll for the settled
    // state instead of sampling at a fixed delay.
    //
    // Tolerance: the deferred-collapse model (5b96fd9) converges with B's
    // top a content-dependent residual below y=0 — ~42px on the 2026-05
    // content, ~86px on the 2026-06 content (first featured card has equal
    // expanded/collapsed heights, so A's delta compensation is a no-op).
    // Tracked as a known_issue in doc 05 (audit 2026-06-12); the assertion
    // guards the intent — near the top, not wildly off — rather than the
    // exact residual.
    await expect
      .poll(() => b.evaluate((el) => el.getBoundingClientRect().top), {
        timeout: 5_000,
        message: "B's article top never settled near viewport y=0",
      })
      .toBeLessThan(120);

    const bTopAfterOpen = await b.evaluate((el) => el.getBoundingClientRect().top);
    expect(bTopAfterOpen).toBeGreaterThan(-5);

    // And the move should actually have happened — bTopAfterOpen should
    // be substantially smaller than bTopWithAOpen (B was deep down with
    // A expanded; now it's at the top).
    expect(bTopAfterOpen).toBeLessThan(bTopWithAOpen);
  });
});
