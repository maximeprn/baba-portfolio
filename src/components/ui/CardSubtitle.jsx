/**
 * CardSubtitle — metadata line shown on film & photo cards
 * (e.g. "2024 • Nike • Commercial").
 *
 * Renders only the fields that are actually filled in the CMS and places a
 * dot separator *between* them — never leading, trailing, or doubled. So:
 *   3 fields → 2 dots, 2 fields → 1 dot, 1 field → no dots, 0 fields → null.
 *
 * `separator` is the node inserted between consecutive parts:
 *   - collapsed cards pass the plain string "  •  " — kept as text so the
 *     parent's `whitespace-pre-wrap` renders the padding spaces verbatim
 *   - featured / expanded headers pass <span className="mx-3">•</span>
 *
 * The component renders just the inline content; the caller owns the
 * wrapping element and its typography classes.
 */

import { Fragment } from 'react';
import { filledParts } from './cardSubtitleParts';

export default function CardSubtitle({ parts, separator }) {
  // Drop empty / missing fields — pure logic lives in cardSubtitleParts.js
  // so it can be unit-tested (tests/card-subtitle.spec.js).
  const filled = filledParts(parts);

  if (filled.length === 0) return null;

  return filled.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && separator}
      {part}
    </Fragment>
  ));
}
