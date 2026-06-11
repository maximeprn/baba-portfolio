import { test, expect } from '@playwright/test';

/**
 * Card subtitle — adaptive dot separators (pure-logic tests)
 *
 * Exercises the framework-free `filledParts` helper behind <CardSubtitle>
 * directly, with no browser — same pattern as hero-overlay-sizing.spec.js.
 *
 * The component renders one separator between consecutive filled parts, so
 * the dot count is `filledParts(parts).length - 1` (floored at 0). These
 * tests pin every fill combination plus the trim/number edge cases the
 * 2026-06-12 audit flagged as regression-prone (e.g. a "simplified" truthy
 * filter would wrongly drop a numeric 0).
 *
 * See .mdd/docs/17-card-subtitle-separators.md.
 */

import { filledParts } from '../src/components/ui/cardSubtitleParts.js';

test.describe('filledParts — fill combinations (year, client, category)', () => {
  test('all three filled → 3 parts (2 dots)', () => {
    expect(filledParts([2024, 'Nike', 'Commercial'])).toEqual([2024, 'Nike', 'Commercial']);
  });

  test('each two-filled combination → 2 parts (1 dot)', () => {
    expect(filledParts([2024, 'Nike', null])).toEqual([2024, 'Nike']);
    expect(filledParts([2024, null, 'Commercial'])).toEqual([2024, 'Commercial']);
    expect(filledParts([null, 'Nike', 'Commercial'])).toEqual(['Nike', 'Commercial']);
  });

  test('each one-filled combination → 1 part (0 dots)', () => {
    expect(filledParts([2024, null, null])).toEqual([2024]);
    expect(filledParts([null, 'Nike', null])).toEqual(['Nike']);
    expect(filledParts([null, null, 'Commercial'])).toEqual(['Commercial']);
  });

  test('none filled → empty (component renders null)', () => {
    expect(filledParts([null, null, null])).toEqual([]);
    expect(filledParts([])).toEqual([]);
  });
});

test.describe('filledParts — empty-value semantics', () => {
  test('undefined and null are both dropped', () => {
    expect(filledParts([undefined, 'Nike', null])).toEqual(['Nike']);
  });

  test('empty strings are dropped', () => {
    expect(filledParts(['', 'Nike', ''])).toEqual(['Nike']);
  });

  test('whitespace-only strings count as empty (trimmed first)', () => {
    expect(filledParts(['   ', 'Nike', '\t\n'])).toEqual(['Nike']);
  });

  test('strings are trimmed in the output', () => {
    expect(filledParts(['  Nike  ', ' Commercial'])).toEqual(['Nike', 'Commercial']);
  });
});

test.describe('filledParts — number handling', () => {
  test('numeric years pass through untrimmed', () => {
    expect(filledParts([2024])).toEqual([2024]);
  });

  test('a numeric 0 is a real value, not an empty one', () => {
    // Guards against "simplifying" the filter to Boolean(part), which
    // would silently drop 0.
    expect(filledParts([0, 'Nike'])).toEqual([0, 'Nike']);
  });
});

test.describe('separator count contract', () => {
  test('N filled parts → N−1 separators, floored at 0', () => {
    const dots = (parts) => Math.max(0, filledParts(parts).length - 1);
    expect(dots([2024, 'Nike', 'Commercial'])).toBe(2);
    expect(dots([2024, null, 'Commercial'])).toBe(1);
    expect(dots([2024, null, null])).toBe(0);
    expect(dots([null, null, null])).toBe(0);
  });
});
