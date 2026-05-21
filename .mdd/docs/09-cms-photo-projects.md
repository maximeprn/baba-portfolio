---
id: 09-cms-photo-projects
title: CMS — Photo Projects (collection with drag-to-reorder)
edition: BABA Portfolio
depends_on:
  - 05-featured-photo-cards
  - 06-collapsed-photo-cards
  - 07-cms-foundation
source_files:
  - sanity/schemas/photoProject.js
  - sanity/schemas/index.js
  - sanity/desk/structure.js
  - sanity.config.js
  - scripts/upload-photo-projects.mjs
  - scripts/fix-photo-project-ranks.mjs
  - scripts/fetch-cms-content.mjs
  - src/sanity/loader.js
  - src/pages/Photos.jsx
  - src/data/photoProjects.js  # legacy fallback only
  - package.json
routes: []
models:
  - sanity:photoProject (collection, drag-orderable)
test_files:
  - tests/e2e/cms-photos-cdn.spec.js
known_issues:
  - "@sanity/orderable-document-list uses LexoRank strings for `orderRank`. Initial backfill MUST use real LexoRank values (e.g. via `LexoRank.middle().genNext()`) — zero-padded ints like '00000001' don't compare correctly with LexoRank's `between()` operation and the drag-to-reorder will silently snap items back to their original position. If new docs ever get a non-LexoRank `orderRank`, run `npm run cms:fix-photo-project-ranks` to backfill."
  - "@hello-pangea/dnd (used internally by the orderable plugin) logs 'Droppable: unsupported nested scroll container detected' in dev. Visual drag still works in our setup; the warning is noise."
  - "Mobile-fallback preview fields (previewMobilePattern, previewMobilePhotoIndices, previewMobileBreakpoint, previewAspectRatio, previewMaxHeight) MUST be preserved if this schema is ever rewritten. The original 5 featured projects rely on mobilePattern: 10 + mobileBreakpoint: 1349 + maxHeight: '60vh' so the side-by-side comparison cards collapse to a single full-bleed photo on tablets/phones. See doc 05 for the rendering contract."
  - "After running `cms:upload-photo-projects` or `cms:fix-photo-project-ranks`, MANUALLY click the Studio Deploy tool to push the changes live. The auto-webhook is disabled (see doc 07)."
---

# 09 — CMS Photo Projects

## Purpose

Move the 22 photo projects from a static `src/data/photoProjects.js` data
file to a Sanity collection so Basile can edit titles, descriptions,
categories, photos, the featured flag, and the display order without
touching code. Order is controlled via drag-and-drop in the Studio list
view (provided by `@sanity/orderable-document-list`).

## Architecture

```
Studio /admin → 📷 Photo projects
        │
        │  List view shows all 22 docs sorted by `orderRank` asc.
        │  Drag handle on each row → @sanity/orderable-document-list
        │  patches the doc's orderRank to a fresh LexoRank value
        │  between the two neighbours.
        │
        │  Click a doc → Content tab (title, description, photos…)
        │              + Layout (advanced) tab (preview pattern, mobile fallback)
        ▼
[scripts/fetch-cms-content.mjs] query:
  *[_type == "photoProject"] | order(orderRank asc) {
    ...,
    "photos": photos[]{
      "src": asset->url,
      alt,
      "width":  asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
    }
  }
        │
        │  flattenPhotoProject() converts asset metadata → aspectRatio
        │  and rebuilds the legacy `preview.{pattern,photos,mobilePattern,
        │  mobilePhotos,mobileBreakpoint,aspectRatio,maxHeight}` shape so
        │  Photos.jsx + PhotoCardPreview can consume it unchanged.
        ▼
[src/sanity/loader.js] exports `photoProjects` array + helpers
    (getFeaturedProjects, getNonFeaturedProjects, getProjectBySlug).
    Falls back to LEGACY_PHOTO_PROJECTS if the CMS array is empty.
        │
        ▼
[src/pages/Photos.jsx] imports from the loader.
[src/components/photos/FeaturedPhotoCard.jsx] + [PhotoCardPreview.jsx] +
[ExpandedPhotoGallery.jsx] + [CollapsedPhotoCard.jsx] consume the
legacy shape. No component changes were needed beyond Photos.jsx's
import path.
```

## Data Model

### `photoProject` (collection, NOT singleton)

Fields are grouped into two tabs:

#### Content (default tab — what Basile edits)

| Field | Type | Notes |
|---|---|---|
| `title` | string (required) | Project display name. |
| `slug` | slug (auto from title) | URL-safe identifier. Used as the basis for the pinned doc ID (`photoProject-<slug>`). |
| `description` | text (3-line) | Project description shown in the expanded gallery and the collapsed-card meta. |
| `year` | number | 2000–2100, integer. Displayed in card meta. |
| `client` | string | Free text. |
| `category` | string | Free text with predefined suggestions: Editorial, Commercial, Sport, Fashion, Documentary, Portrait, Personal. |
| `photos` | array<image> | Drag-orderable. Each entry is a Sanity image with `hotspot: true` + optional `alt`. |
| `featured` | boolean | When true, renders as a large `FeaturedPhotoCard`; otherwise as a `CollapsedPhotoCard` in the "Other projects" grid. |

#### Layout (advanced — developer-controlled)

| Field | Type | Notes |
|---|---|---|
| `previewPattern` | number (0–15) | Layout index into `PhotoCardPreview.PATTERNS`. The pattern's slot count must equal `previewPhotoIndices.length`. |
| `previewPhotoIndices` | array<number> | Which photos (by index into the `photos` array) appear in the compact-card collage. |
| `previewMobilePattern` | number (0–15) | Pattern to use below `previewMobileBreakpoint`. Typical: `10` (single full-bleed slot) so featured cards collapse to one photo on narrow screens. |
| `previewMobilePhotoIndices` | array<number> | Photo indices for the mobile pattern. |
| `previewMobileBreakpoint` | number (px) | Max-width below which the mobile pattern applies. The original 5 featured projects used `1349` so the side-by-side comparison collapsed on tablets too. |
| `previewAspectRatio` | string | Optional CSS aspect-ratio override (e.g. `"5 / 4"`). Leave blank to derive from the lead photo + biggest slot. |
| `previewMaxHeight` | string | Optional CSS max-height cap (e.g. `"60vh"`). |

#### Hidden field

| Field | Type | Notes |
|---|---|---|
| `orderRank` | string | Managed by `@sanity/orderable-document-list`. NEVER edit by hand. See LexoRank constraint below. |

## API Endpoints

No HTTP endpoints. The build-time fetcher does one GROQ projection (see
Architecture section).

## Business Rules

### Ordering (drag-to-reorder)

1. **Studio list view sorts by `orderRank` asc** via
   `orderableDocumentListDeskItem({ type: 'photoProject', S, context })`.
2. **Drag-to-reorder.** The plugin patches the dragged doc's `orderRank`
   to a `LexoRank.between(prev, next)` value when released. Subsequent
   sorts read the new value.
3. **LexoRank is mandatory.** Initial backfills MUST use real LexoRank
   strings — `LexoRank.middle()` + `genNext()` chains, or whatever the
   plugin's "Reset Order" generates. Zero-padded ints (e.g. `"00000001"`)
   are NOT compatible with LexoRank's `between()` operation; dragging
   produces ranks that don't actually fall between the neighbours and
   the item snaps back.
4. **Recovery script.** If `orderRank` ever ends up in a non-LexoRank
   format (corrupted import, manual edit), run
   `SANITY_WRITE_TOKEN=… npm run cms:fix-photo-project-ranks` — it
   re-assigns LexoRank values starting from `middle()` for every doc,
   preserving the current visible order.
5. **No `displayOrder` field.** A previous design had a manual integer
   `displayOrder` field for ordering; it was removed when drag-to-reorder
   landed. Don't re-introduce it without removing `orderRank`.

### Photos

6. **Image upload via Studio.** Basile drags photos into the `photos`
   array field. Hotspot is enabled so he can specify the crop focal point
   per image.
7. **Asset SHA1 dedup.** When the upload script runs, Sanity de-duplicates
   on SHA1 → re-uploading the same file is cheap.
8. **`aspectRatio` is computed at fetch time** from
   `asset->metadata.dimensions` (width / height). Components consume
   the legacy `{ src, alt, aspectRatio }` shape.

### Featured / non-featured rendering

9. **`featured: true`** → renders as `FeaturedPhotoCard` (compact preview
   collage on one side, meta text on the other; FLIP-morph expand into
   `ExpandedPhotoGallery`). See doc 05.
10. **`featured: false`** → renders as `CollapsedPhotoCard` in the "Other
    projects" grid below the featured list. See doc 06.

### Layout (advanced) fallbacks

11. **Mobile fallback.** When viewport width < `previewMobileBreakpoint`,
    `PhotoCardPreview` swaps from `previewPattern`/`previewPhotoIndices`
    to `previewMobilePattern`/`previewMobilePhotoIndices`. The original
    5 featured projects use:
    - `previewMobilePattern: 10` (single full-bleed slot)
    - `previewMobilePhotoIndices: [0]`
    - `previewMobileBreakpoint: 1349` (collapses on tablets too)
    - `previewMaxHeight: '60vh'`
12. **No per-project image position.** Featured-card left/right placement is
    computed at render time by index in the featured array — it alternates
    automatically. An `imagePosition` override field existed in an earlier
    draft and was removed; do not re-add it without a rendering contract.

### Migration

13. **One-shot migration script.** `scripts/upload-photo-projects.mjs`
    reads `src/data/photoProjects.js` and recreates each project as a
    Sanity doc. Pinned IDs (`photoProject-<slug>`) make it idempotent.
    Photos are uploaded once each (SHA1 dedup with the heroPhotos
    upload from doc 08).
14. **Webhook discipline.** All write scripts in `cms:*` use a single
    Sanity `client.transaction()` so the data write is atomic. Sanity
    still fires N webhook events (one per doc), so the recommended
    workflow is to leave the auto-webhook disabled and click the Studio
    Deploy tool once after the script finishes.

### Fallback path

15. **`src/sanity/loader.js`** returns `LEGACY_PHOTO_PROJECTS` (from
    `src/data/photoProjects.js`) when `cms.json.photoProjects` is empty
    or missing. Same pattern as heroPhotos (doc 08). Components see no
    difference.

## Dependencies

- [05-featured-photo-cards](05-featured-photo-cards.md) — rendering
  rules for featured cards. This doc is just about where the data lives.
- [06-collapsed-photo-cards](06-collapsed-photo-cards.md) — rendering
  rules for non-featured (collapsed) cards.
- [07-cms-foundation](07-cms-foundation.md) — Studio mount, singleton
  enforcement pattern, build pipeline, Deploy tool, webhook config.

## Known Issues

See frontmatter.
