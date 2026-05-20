/**
 * Card alignment helper.
 *
 * The "Card alignment" setting in siteSettings (`cardAlignment`) controls
 * whether the image/video on featured cards (films + photo projects)
 * alternates left/right by row, or stays on a single side everywhere.
 *
 * Per-document overrides were removed in favour of this single global
 * knob — editors don't have to maintain a manual L/R/L/R pattern, and
 * reordering cards in Studio doesn't break the rhythm.
 *
 * Usage:
 *   import { mediaSideFor } from '@/utils/cardAlignment';
 *   const side = mediaSideFor(index, siteSettings.cardAlignment);
 *   // side === 'left' | 'right'
 */

export function mediaSideFor(index, alignment = 'alternate') {
  if (alignment === 'all-left') return 'left';
  if (alignment === 'all-right') return 'right';
  // 'alternate' (default): even rows go left, odd rows go right.
  return index % 2 === 0 ? 'left' : 'right';
}
