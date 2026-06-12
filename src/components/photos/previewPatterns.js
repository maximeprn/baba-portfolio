/**
 * Preview collage patterns — shared single source of truth.
 *
 * Consumed by:
 *   - PhotoCardPreview.jsx (renders the slots)
 *   - sanity/schemas/photoProject.js (Studio dropdown options + cross-field
 *     validation: indices length must equal the pattern's slot count)
 *
 * Pure data, no React — safe to import into the Studio schema bundle.
 *
 * Slot rectangles are non-overlapping by construction — every pair of slots
 * in a pattern either has a horizontal or vertical gap between them. The
 * minimum gap between any two adjacent slots is 2% of the container's
 * shortest side (a small but visible "they belong together" rhythm).
 */

export const PATTERNS = [
  // 0
  { name: '3 photos · horizontal cascade', slots: [
    { left: '0%',   top: '15%', width: '32%', height: '60%' },
    { left: '34%',  top: '0%',  width: '32%', height: '70%' },
    { left: '68%',  top: '25%', width: '32%', height: '60%' },
  ] },
  // 1
  { name: '2 photos · large left + small right', slots: [
    { left: '0%',   top: '5%',  width: '60%', height: '85%' },
    { left: '64%',  top: '20%', width: '36%', height: '55%' },
  ] },
  // 2
  { name: '3 photos · two up + offset bottom', slots: [
    { left: '0%',   top: '0%',  width: '48%', height: '58%' },
    { left: '52%',  top: '8%',  width: '48%', height: '50%' },
    { left: '20%',  top: '64%', width: '60%', height: '36%' },
  ] },
  // 3
  { name: '2 photos · side by side, slight stagger', slots: [
    { left: '0%',   top: '5%',  width: '46%', height: '85%' },
    { left: '52%',  top: '15%', width: '46%', height: '75%' },
  ] },
  // 4
  { name: '3 photos · asymmetric L', slots: [
    { left: '0%',   top: '0%',  width: '54%', height: '60%' },
    { left: '58%',  top: '0%',  width: '42%', height: '40%' },
    { left: '40%',  top: '62%', width: '60%', height: '38%' },
  ] },
  // 5
  { name: '2 photos · diagonal', slots: [
    { left: '0%',   top: '20%', width: '60%', height: '75%' },
    { left: '64%',  top: '0%',  width: '36%', height: '60%' },
  ] },
  // 6
  { name: '3 photos · horizontal triad', slots: [
    { left: '0%',   top: '0%',  width: '32%', height: '88%' },
    { left: '34%',  top: '12%', width: '32%', height: '70%' },
    { left: '68%',  top: '4%',  width: '32%', height: '85%' },
  ] },
  // 7
  { name: '2 photos · stacked offset', slots: [
    { left: '5%',   top: '0%',  width: '55%', height: '47%' },
    { left: '40%',  top: '50%', width: '55%', height: '50%' },
  ] },
  // 8
  { name: '3 photos · staircase', slots: [
    { left: '0%',   top: '0%',  width: '38%', height: '38%' },
    { left: '34%',  top: '40%', width: '36%', height: '30%' },
    { left: '62%',  top: '72%', width: '38%', height: '28%' },
  ] },
  // 9
  { name: '3 photos · wide stack', slots: [
    { left: '0%',   top: '0%',  width: '62%', height: '34%' },
    { left: '38%',  top: '36%', width: '62%', height: '30%' },
    { left: '12%',  top: '68%', width: '62%', height: '32%' },
  ] },
  // 10
  { name: '1 photo · single full-bleed', slots: [
    { left: '0%',   top: '0%',  width: '100%', height: '100%' },
  ] },
  // ───────────────────────────────────────────────────────────
  // 11..15 — side-by-side big/small layouts for the 2-image
  // comparison page (/photos-2). Invariants:
  //   - Big slot ≈ 60% width, Small slot ≈ 30% width.
  //   - The two slots always share horizontal space — they are
  //     never one fully above the other. Vertical offsets vary
  //     (top / mid / bottom alignment) so each card looks unique.
  //   - Heights never reach 100% — there's breathing room above
  //     and/or below each image.
  // ───────────────────────────────────────────────────────────
  // 11
  { name: '2 photos · big left top + small right lower', slots: [
    { left: '0%',   top: '0%',   width: '60%', height: '82%' },
    { left: '66%',  top: '46%',  width: '30%', height: '50%' },
  ] },
  // 12
  { name: '2 photos · small left top + big right bottom', slots: [
    { left: '2%',   top: '6%',   width: '28%', height: '44%' },
    { left: '36%',  top: '14%',  width: '60%', height: '86%' },
  ] },
  // 13
  { name: '2 photos · big left bottom + small right top', slots: [
    { left: '0%',   top: '14%',  width: '62%', height: '86%' },
    { left: '70%',  top: '0%',   width: '28%', height: '42%' },
  ] },
  // 14
  { name: '2 photos · small left middle + big right top', slots: [
    { left: '4%',   top: '30%',  width: '26%', height: '44%' },
    { left: '34%',  top: '0%',   width: '60%', height: '82%' },
  ] },
  // 15
  { name: '2 photos · big left middle + small right lower', slots: [
    { left: '0%',   top: '8%',   width: '60%', height: '84%' },
    { left: '66%',  top: '58%',  width: '30%', height: '40%' },
  ] },
];

export default PATTERNS;
