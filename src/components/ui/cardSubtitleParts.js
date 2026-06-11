/**
 * cardSubtitleParts — pure helper behind <CardSubtitle>.
 *
 * Framework-free so it can be unit-tested directly
 * (tests/card-subtitle.spec.js), same pattern as heroOverlayLayout.js.
 */

/**
 * Drop empty / missing subtitle fields. Strings are trimmed first so a
 * whitespace-only CMS value counts as empty; numbers (year) pass through —
 * including a numeric 0, which is a real value, not an empty one.
 *
 * The caller renders one separator between consecutive results, so
 * N filled parts → N−1 separators (never leading, trailing, or doubled).
 *
 * @param {Array<string|number|null|undefined>} parts
 * @returns {Array<string|number>}
 */
export function filledParts(parts) {
  return parts
    .map((part) => (typeof part === 'string' ? part.trim() : part))
    .filter((part) => part != null && part !== '');
}
