/**
 * PhotoCardPreview — compact 2/3-image collage shown in a collapsed
 * FeaturedPhotoCard. Each `<img>` carries `data-photo-idx={originalIndex}`
 * so the FLIP morph in FeaturedPhotoCard can match it to its destination
 * cell in ExpandedPhotoGallery.
 *
 * Data contract (from photoProjects.js):
 *   project.preview.pattern      → index into PATTERNS
 *   project.preview.photos       → array of indices into project.photos
 *                                  (length must match the pattern's slot count)
 *   project.preview.aspectRatio  → CSS aspect-ratio override (default '5 / 4')
 *   project.preview.maxHeight    → optional CSS max-height cap (e.g. '60vh')
 *   project.preview.mobilePattern→ optional pattern index used below the breakpoint
 *   project.preview.mobilePhotos → matching photos array for the mobile pattern
 *   project.preview.mobileBreakpoint → max-width in px below which the mobile
 *                                       overrides apply (default 767)
 */

import { useEffect, useState } from 'react';

// Slot rectangles are non-overlapping by construction — every pair of slots
// in a pattern either has a horizontal or vertical gap between them. The
// minimum gap between any two adjacent slots is 2% of the container's
// shortest side (a small but visible "they belong together" rhythm).
const PATTERNS = [
  // 0 — 3-slot horizontal cascade
  { slots: [
    { left: '0%',   top: '15%', width: '32%', height: '60%' },
    { left: '34%',  top: '0%',  width: '32%', height: '70%' },
    { left: '68%',  top: '25%', width: '32%', height: '60%' },
  ] },
  // 1 — 2-slot left-large + right-small
  { slots: [
    { left: '0%',   top: '5%',  width: '60%', height: '85%' },
    { left: '64%',  top: '20%', width: '36%', height: '55%' },
  ] },
  // 2 — 3-slot offset bottom
  { slots: [
    { left: '0%',   top: '0%',  width: '48%', height: '58%' },
    { left: '52%',  top: '8%',  width: '48%', height: '50%' },
    { left: '20%',  top: '64%', width: '60%', height: '36%' },
  ] },
  // 3 — 2-slot side-by-side, slight stagger
  { slots: [
    { left: '0%',   top: '5%',  width: '46%', height: '85%' },
    { left: '52%',  top: '15%', width: '46%', height: '75%' },
  ] },
  // 4 — 3-slot asymmetric L
  { slots: [
    { left: '0%',   top: '0%',  width: '54%', height: '60%' },
    { left: '58%',  top: '0%',  width: '42%', height: '40%' },
    { left: '40%',  top: '62%', width: '60%', height: '38%' },
  ] },
  // 5 — 2-slot diagonal
  { slots: [
    { left: '0%',   top: '20%', width: '60%', height: '75%' },
    { left: '64%',  top: '0%',  width: '36%', height: '60%' },
  ] },
  // 6 — 3-slot horizontal triad
  { slots: [
    { left: '0%',   top: '0%',  width: '32%', height: '88%' },
    { left: '34%',  top: '12%', width: '32%', height: '70%' },
    { left: '68%',  top: '4%',  width: '32%', height: '85%' },
  ] },
  // 7 — 2-slot stacked-offset
  { slots: [
    { left: '5%',   top: '0%',  width: '55%', height: '47%' },
    { left: '40%',  top: '50%', width: '55%', height: '50%' },
  ] },
  // 8 — 3-slot staircase
  { slots: [
    { left: '0%',   top: '0%',  width: '38%', height: '38%' },
    { left: '34%',  top: '40%', width: '36%', height: '30%' },
    { left: '62%',  top: '72%', width: '38%', height: '28%' },
  ] },
  // 9 — 3-slot wide stack
  { slots: [
    { left: '0%',   top: '0%',  width: '62%', height: '34%' },
    { left: '38%',  top: '36%', width: '62%', height: '30%' },
    { left: '12%',  top: '68%', width: '62%', height: '32%' },
  ] },
  // 10 — single full-bleed slot
  { slots: [
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
  // 11 — Big-LEFT top-aligned + small-RIGHT lower
  { slots: [
    { left: '0%',   top: '0%',   width: '60%', height: '82%' },
    { left: '66%',  top: '46%',  width: '30%', height: '50%' },
  ] },
  // 12 — Small-LEFT top + Big-RIGHT bottom-aligned
  { slots: [
    { left: '2%',   top: '6%',   width: '28%', height: '44%' },
    { left: '36%',  top: '14%',  width: '60%', height: '86%' },
  ] },
  // 13 — Big-LEFT bottom-aligned + small-RIGHT top
  { slots: [
    { left: '0%',   top: '14%',  width: '62%', height: '86%' },
    { left: '70%',  top: '0%',   width: '28%', height: '42%' },
  ] },
  // 14 — Small-LEFT middle + Big-RIGHT top-aligned
  { slots: [
    { left: '4%',   top: '30%',  width: '26%', height: '44%' },
    { left: '34%',  top: '0%',   width: '60%', height: '82%' },
  ] },
  // 15 — Big-LEFT middle-ish + small-RIGHT lower
  { slots: [
    { left: '0%',   top: '8%',   width: '60%', height: '84%' },
    { left: '66%',  top: '58%',  width: '30%', height: '40%' },
  ] },
];

function PhotoCardPreview({ project, onClick }) {
  // Mobile fallback: a project's preview can declare `mobilePattern` +
  // `mobilePhotos` to swap to a simpler layout below `mobileBreakpoint`
  // (e.g. one full-bleed image instead of two side-by-side miniatures).
  // Default breakpoint is 767px (Tailwind md −1).
  const breakpoint = project.preview?.mobileBreakpoint ?? 767;
  const mediaQuery = `(max-width: ${breakpoint}px)`;
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(mediaQuery).matches,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mql = window.matchMedia(mediaQuery);
    setIsMobile(mql.matches);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mediaQuery]);

  const useMobileOverride =
    isMobile && project.preview?.mobilePattern != null;
  const patternIdx = useMobileOverride
    ? project.preview.mobilePattern
    : project.preview?.pattern ?? 0;
  const pattern = PATTERNS[patternIdx] || PATTERNS[0];
  const previewIndices = useMobileOverride
    ? project.preview.mobilePhotos || []
    : project.preview?.photos || [];

  // Container aspect ratio:
  // 1. Honour an explicit `project.preview.aspectRatio` if provided.
  // 2. Otherwise derive it from the project's primary photo so the card
  //    "shapes itself like" the lead image — and weight by the largest
  //    slot's WxH so that the big slot ends up displaying the photo at
  //    its natural aspect (no object-cover crop on the hero image).
  // 3. Fall back to 5/4 if the data has no aspect info.
  const explicitAspect = project.preview?.aspectRatio;
  const photoAspect = project.photos?.[0]?.aspectRatio;
  let aspect;
  if (explicitAspect) {
    aspect = explicitAspect;
  } else if (photoAspect != null) {
    const bigSlot = pattern.slots.reduce((biggest, slot) => {
      const area      = parseFloat(slot.width) * parseFloat(slot.height);
      const bestArea  = parseFloat(biggest.width) * parseFloat(biggest.height);
      return area > bestArea ? slot : biggest;
    }, pattern.slots[0]);
    const w = parseFloat(bigSlot.width);
    const h = parseFloat(bigSlot.height);
    aspect = w > 0 && h > 0 ? (photoAspect * h) / w : photoAspect;
  } else {
    aspect = '5 / 4';
  }
  const maxHeight = project.preview?.maxHeight;

  return (
    <div
      className="relative w-full"
      style={{
        aspectRatio: aspect,
        ...(maxHeight ? { maxHeight } : {}),
      }}
      onClick={onClick}
    >
      {pattern.slots.map((slot, i) => {
        const photoIdx = previewIndices[i];
        if (photoIdx == null) return null;
        const photo = project.photos[photoIdx];
        if (!photo) return null;
        return (
          <img
            key={`${project.id}-prev-${photoIdx}`}
            src={photo.src}
            alt=""
            data-photo-idx={photoIdx}
            data-fpc-preview="1"
            loading="eager"
            decoding="async"
            className="absolute object-cover pointer-events-none select-none"
            style={{
              left: slot.left,
              top: slot.top,
              width: slot.width,
              height: slot.height,
            }}
          />
        );
      })}
    </div>
  );
}

export default PhotoCardPreview;
export { PATTERNS };
