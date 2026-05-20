/**
 * Map of full-length `/videos/*.mp4` paths to their shortened sibling files
 * (typically ~30 s teaser cuts). The autoplaying preview tiles in
 * FeaturedFilmCard and the HeroSection background prefer the short
 * variant to spare bandwidth; the original full version is still reached
 * via the Vimeo modal, which uses `videoUrl` (not `videoFile`).
 *
 * `shortVideo()` then runs the result through the Vercel Blob manifest
 * (src/data/blobUrls.json, populated by scripts/upload-videos-to-blob.mjs)
 * so prod + dev both stream from Blob — no Git LFS fetch needed at
 * build time, no local mp4s needed at runtime. If the manifest is empty
 * or missing an entry, the original `/videos/*.mp4` path is returned
 * unchanged so files staged in `public/videos/` still work locally.
 *
 * Keys preserve the exact original filenames; values preserve the exact
 * filenames that exist on disk — including a few quirks the user-supplied
 * shorts have: `Bastille - Maison Mara- short.mp4` is missing a space
 * before the dash, `Decathlon Co-Creation Olympic Games Campaign- short.mp4`
 * is the same, and `Kamikwazi - Locked Down  - short.mp4` has two spaces.
 * Match disk reality verbatim instead of computing the suffix from a
 * regex, because the file system is the source of truth and the public/
 * directory isn't part of the Vite module graph (no glob to verify with).
 *
 * Films/clips without a short variant (e.g. `Sacai SS25.mp4`) are omitted
 * — `shortVideo()` falls through to the original path so the original
 * full video is served.
 */

import blobUrls from './blobUrls.json' with { type: 'json' };

const VIDEO_SHORTS = {
  "/videos/ASSOS Feno Suit - Director's Cut.mp4":
    "/videos/ASSOS Feno Suit - Director's Cut - short.mp4",
  "/videos/Badre - a short documentary by DISTANCE.mp4":
    "/videos/Badre - a short documentary by DISTANCE - short.mp4",
  "/videos/Bastille - Maison Mara.mp4":
    "/videos/Bastille - Maison Mara- short.mp4",
  "/videos/Decathlon Co-Creation Olympic Games Campaign.mp4":
    "/videos/Decathlon Co-Creation Olympic Games Campaign- short.mp4",
  "/videos/DIVERSIONS EP by Antoine Bourachot - Teaser.mp4":
    "/videos/DIVERSIONS EP by Antoine Bourachot - Teaser - short.mp4",
  "/videos/Hommage - Late 16' Collection.mp4":
    "/videos/Hommage - Late 16' Collection - short.mp4",
  "/videos/Hommage Clothing - Back to 1992.mp4":
    "/videos/Hommage Clothing - Back to 1992 - short.mp4",
  "/videos/Hommage Clothing - Back to 1992 1.mp4":
    "/videos/Hommage Clothing - Back to 1992 1 - short.mp4",
  "/videos/Kamikwazi - Locked Down.mp4":
    "/videos/Kamikwazi - Locked Down  - short.mp4",
  "/videos/Le CN D - camping 2023.mp4":
    "/videos/Le CN D - camping 2023 - short.mp4",
  "/videos/Quentin Malriq - An athlete portrait by DISTANCE.mp4":
    "/videos/Quentin Malriq - An athlete portrait by DISTANCE - short.mp4",
  "/videos/Salomon Trail Running (Spec ad).mp4":
    "/videos/Salomon Trail Running (Spec ad) - short.mp4",
  "/videos/Showreel 2021.mp4":
    "/videos/Showreel 2021 - short.mp4",
  "/videos/Veja Condor 3.mp4":
    "/videos/Veja Condor 3 - short.mp4",
};

export function shortVideo(path) {
  const short = VIDEO_SHORTS[path] ?? path;
  // Prefer the Vercel Blob URL when the manifest has it; fall back to
  // the original /videos/... path so files staged in public/videos/
  // still resolve during local dev before the manifest is populated.
  return blobUrls[short] ?? short;
}

export default VIDEO_SHORTS;
