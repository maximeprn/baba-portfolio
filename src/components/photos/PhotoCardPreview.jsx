/**
 * PhotoCardPreview — compact 2/3-image collage shown in a collapsed
 * FeaturedPhotoCard. Each `<img>` carries `data-photo-idx={originalIndex}`
 * so the FLIP morph in FeaturedPhotoCard can match it to its destination
 * cell in ExpandedPhotoGallery.
 *
 * Data contract (from photoProjects.js):
 *   project.preview.pattern  → index into PATTERNS (0..9)
 *   project.preview.photos   → array of indices into project.photos
 *                              (length must match PATTERNS[pattern].slots.length)
 */

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
];

function PhotoCardPreview({ project, onClick }) {
  const pattern = PATTERNS[project.preview?.pattern ?? 0] || PATTERNS[0];
  const previewIndices = project.preview?.photos || [];

  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: '5 / 4' }}
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
