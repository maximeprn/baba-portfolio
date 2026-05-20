import { test, expect } from '@playwright/test';

/**
 * Hero overlay — per-screen sizing (pure-logic tests)
 *
 * Exercises the framework-free helpers in heroOverlayLayout.js directly,
 * with no browser. Covers the size resolution that is hard to reach via E2E
 * (manual mode needs CMS data the live site doesn't have).
 *
 * See .mdd/docs/14-hero-overlay-sizing.md.
 */

import {
  anchorToStyle,
  resolveOverlayFontSize,
  resolveTextSizePx,
  sizeKeyToPx,
  SIZE_SCALE,
  stackRowGapPx,
  viewportTier,
} from '../src/components/ui/heroOverlayLayout.js';

test.describe('viewportTier', () => {
  test('classifies widths into phone / tablet / desktop', () => {
    expect(viewportTier(320)).toBe('phone');
    expect(viewportTier(767)).toBe('phone');
    expect(viewportTier(768)).toBe('tablet');
    expect(viewportTier(1023)).toBe('tablet');
    expect(viewportTier(1024)).toBe('desktop');
    expect(viewportTier(1920)).toBe('desktop');
  });
});

test.describe('sizeKeyToPx', () => {
  test('maps known size keys to px', () => {
    expect(sizeKeyToPx('xs', 99)).toBe(SIZE_SCALE.xs);
    expect(sizeKeyToPx('xl', 99)).toBe(SIZE_SCALE.xl);
  });

  test('falls back when the key is missing or unknown', () => {
    expect(sizeKeyToPx(undefined, 42)).toBe(42);
    expect(sizeKeyToPx('huge', 42)).toBe(42);
  });
});

test.describe('resolveTextSizePx', () => {
  test('uses textSize when set', () => {
    expect(resolveTextSizePx({ textSize: 'sm' })).toBe(SIZE_SCALE.sm);
  });

  test('legacy fallback preserves the original look', () => {
    expect(resolveTextSizePx({ size: 'body' })).toBe(SIZE_SCALE.lg);
    expect(resolveTextSizePx({ size: 'contact' })).toBe(SIZE_SCALE.md);
  });
});

test.describe('resolveOverlayFontSize — auto mode', () => {
  const item = { textSize: 'md' }; // autoShrinkSmallScreens defaults on

  test('desktop and tablet use the fluid clamp', () => {
    expect(resolveOverlayFontSize(item, 'desktop')).toContain('clamp(');
    expect(resolveOverlayFontSize(item, 'tablet')).toContain('clamp(');
  });

  test('phone has a lower clamp floor than desktop (shrinks harder)', () => {
    const phoneFloor = parseFloat(
      resolveOverlayFontSize(item, 'phone').match(/clamp\(([\d.]+)px/)[1],
    );
    const desktopFloor = parseFloat(
      resolveOverlayFontSize(item, 'desktop').match(/clamp\(([\d.]+)px/)[1],
    );
    expect(phoneFloor).toBeLessThan(desktopFloor);
  });
});

test.describe('resolveOverlayFontSize — manual mode', () => {
  const item = {
    textSize: 'lg', // desktop = 28
    autoShrinkSmallScreens: false,
    tabletSize: 'md', // 25
    phoneSize: 'xs', // 18
  };

  test('returns a fixed px per screen', () => {
    expect(resolveOverlayFontSize(item, 'desktop')).toBe(`${SIZE_SCALE.lg}px`);
    expect(resolveOverlayFontSize(item, 'tablet')).toBe(`${SIZE_SCALE.md}px`);
    expect(resolveOverlayFontSize(item, 'phone')).toBe(`${SIZE_SCALE.xs}px`);
  });

  test('a missing per-screen size falls back to the base size', () => {
    const partial = { textSize: 'lg', autoShrinkSmallScreens: false };
    expect(resolveOverlayFontSize(partial, 'phone')).toBe(`${SIZE_SCALE.lg}px`);
    expect(resolveOverlayFontSize(partial, 'tablet')).toBe(`${SIZE_SCALE.lg}px`);
  });
});

test.describe('stackRowGapPx', () => {
  test('is proportional to the text size and far smaller than the old 40px', () => {
    const gap = stackRowGapPx({ textSize: 'md' });
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(20);
  });

  test('bigger text yields a bigger gap', () => {
    expect(stackRowGapPx({ textSize: 'xl' })).toBeGreaterThan(
      stackRowGapPx({ textSize: 'xs' }),
    );
  });
});

test.describe('anchorToStyle', () => {
  test('top-left uses fixed rem insets, no offsets', () => {
    const s = anchorToStyle('top-left');
    expect(s.top).toBe('9rem');
    expect(s.left).toBe('2.5rem');
    expect(s.bottom).toBeUndefined();
    expect(s.right).toBeUndefined();
  });

  test('bottom-right anchors to the opposite edges', () => {
    const s = anchorToStyle('bottom-right');
    expect(s.bottom).toBe('2.5rem');
    expect(s.right).toBe('2.5rem');
  });

  test('middle anchor centres vertically', () => {
    const s = anchorToStyle('middle-left');
    expect(s.top).toBe('50%');
    expect(s.transform).toContain('translateY(-50%)');
  });
});
