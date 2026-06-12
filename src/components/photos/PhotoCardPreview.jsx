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
// Slot geometry lives in previewPatterns.js — shared with the Sanity schema
// (sanity/schemas/photoProject.js) for dropdown labels + slot-count
// validation. Re-exported below so existing imports keep working.
import { PATTERNS } from './previewPatterns';

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
