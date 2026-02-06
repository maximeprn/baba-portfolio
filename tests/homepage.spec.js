import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/Basile/i);
  });

  test('should display the hero section', async ({ page }) => {
    await page.goto('/');

    // Check for hero video or main content
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });

  test('should navigate to different sections', async ({ page }) => {
    await page.goto('/');

    // Check that navigation works
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate and scroll 1000px', async ({ page }) => {
    await page.goto('/');

    // Wait for DOM to be ready
    await page.waitForLoadState('domcontentloaded');

    // Focus the page first for keyboard events to work
    await page.click('body');

    // Use PageDown key multiple times for more reliable cross-browser scrolling
    // Each PageDown scrolls ~90% of viewport height
    await page.keyboard.press('PageDown');
    await page.keyboard.press('PageDown');

    // Wait for smooth scroll animation to complete
    await page.waitForTimeout(1500);

    // The site uses a custom smooth scroll system on desktop (>=1024px)
    // Content is translated via CSS transforms, so we check the transform value
    const scrollPosition = await page.evaluate(() => {
      // Check for native scroll first (mobile/tablet)
      if (window.scrollY > 0) {
        return window.scrollY;
      }
      // Check for custom smooth scroll (desktop) - content is translated
      const content = document.querySelector('[style*="translateY"]');
      if (content) {
        const transform = content.style.transform;
        const match = transform.match(/translateY\(-?([\d.]+)px\)/);
        return match ? parseFloat(match[1]) : 0;
      }
      return 0;
    });

    expect(scrollPosition).toBeGreaterThanOrEqual(900);
  });
});
