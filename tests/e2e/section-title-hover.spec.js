import { test, expect } from '@playwright/test';

/**
 * Featured Section — Whole-Section Hover + Click
 *
 * The featured film/photo section title's B&W invert (surfaced as the
 * `data-title-hovered` attribute on the card <article>) activates while
 * the pointer is anywhere within the section — thumbnail, title, text,
 * or padding — and clears once the pointer leaves the card. The film
 * section is also click-to-open across its whole area.
 *
 * Driven by bubbling mouseover/mouseout/click listeners, so the tests
 * dispatch those events directly. Playwright's dispatchEvent bubbles by
 * default and skips the actionability check — which also sidesteps the
 * smooth-scroll viewport quirk documented in CLAUDE.md.
 *
 * Covers the default (toggle-on) whole-section hover. The toggle-off
 * mode (siteSettings.featuredTitleHoverWholeSection = false) is
 * build-time config and is verified manually.
 *
 * Spec: .mdd/docs/15-section-title-hover-zones.md
 */

const FILM_CARD = 'article[data-featured-film-card]';
const PHOTO_CARD = 'article[data-featured-photo-card]';

test.describe('Whole-section title hover — Films (/)', () => {
  test('a featured film card renders and starts un-inverted', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator(FILM_CARD).first();
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-title-hovered', 'false');
  });

  test('hovering the video thumbnail inverts the title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator(FILM_CARD).first();
    await expect(card).toBeVisible();

    // The thumbnail is a non-text area — under whole-section hover it
    // still inverts the title.
    await card.locator('video').first().dispatchEvent('mouseover');
    await expect(card).toHaveAttribute('data-title-hovered', 'true');
  });

  test('hovering the section padding (white space) inverts the title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator(FILM_CARD).first();
    await expect(card).toBeVisible();

    // Dispatch on the <article> itself — its box includes the card's
    // white top/bottom padding, which is part of the section.
    await card.dispatchEvent('mouseover');
    await expect(card).toHaveAttribute('data-title-hovered', 'true');
  });

  test('leaving the section clears the title invert', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator(FILM_CARD).first();
    await expect(card).toBeVisible();

    await card.locator('video').first().dispatchEvent('mouseover');
    await expect(card).toHaveAttribute('data-title-hovered', 'true');

    // mouseout with no relatedTarget = the pointer left the section.
    await card.dispatchEvent('mouseout');
    await expect(card).toHaveAttribute('data-title-hovered', 'false');
  });
});

test.describe('Whole-section title hover — Photos (/photos)', () => {
  test('a featured photo card renders and starts un-inverted', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator(PHOTO_CARD).first();
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-title-hovered', 'false');
  });

  test('hovering the photo collage inverts the title', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator(PHOTO_CARD).first();
    await expect(card).toBeVisible();

    // A collage image — a non-text area — still inverts the title.
    await card.locator('img').first().dispatchEvent('mouseover');
    await expect(card).toHaveAttribute('data-title-hovered', 'true');
  });

  test('hovering the title text inverts the title', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator(PHOTO_CARD).first();
    await expect(card).toBeVisible();

    await card.locator('h3').first().dispatchEvent('mouseover');
    await expect(card).toHaveAttribute('data-title-hovered', 'true');
  });

  test('leaving the section clears the title invert', async ({ page }) => {
    await page.goto('/photos');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator(PHOTO_CARD).first();
    await expect(card).toBeVisible();

    await card.locator('h3').first().dispatchEvent('mouseover');
    await expect(card).toHaveAttribute('data-title-hovered', 'true');

    await card.dispatchEvent('mouseout');
    await expect(card).toHaveAttribute('data-title-hovered', 'false');
  });
});

test.describe('Whole-section click-to-open — Films (/)', () => {
  test('clicking the section padding opens the film modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator(FILM_CARD).first();
    await expect(card).toBeVisible();

    // Click the <article> itself — the white padding zone, which used to
    // be inert (only the title + video opened the modal).
    await card.dispatchEvent('click');

    const modal = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(modal).toBeVisible();
  });
});
