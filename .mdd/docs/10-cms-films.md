---
id: 10-cms-films
title: CMS — Films (collection with drag-to-reorder)
edition: BABA Portfolio
depends_on:
  - 03-collapsed-film-cards
  - 04-featured-card-fade-on-scroll
  - 07-cms-foundation
status: BUILT — schema + migration ready, awaiting user-side run (2026-05-20)
source_files:
  - sanity/schemas/film.js                # NEW
  - sanity/schemas/index.js               # modify (register film)
  - sanity/desk/structure.js              # modify (add Films list)
  - scripts/upload-films.mjs              # NEW (migration)
  - scripts/fetch-cms-content.mjs         # modify (query films)
  - src/sanity/loader.js                  # modify (export films + helpers)
  - src/pages/Films.jsx                   # modify (switch import)
  - src/data/films.js                     # keep as fallback
  - package.json                          # add cms:upload-films
  - CLAUDE.md                             # update GROQ filter + schema list
test_files:
  - tests/e2e/cms-films-cdn.spec.js       # NEW
known_issues: []
---

# 10 — CMS Films

## Purpose

Move the films data from `src/data/films.js` to a Sanity collection so
Basile can edit titles, descriptions, credits, thumbnails, and the
featured/collapsed flags without touching code. Mirrors the photoProject
pattern (doc 09) — same drag-to-reorder via `@sanity/orderable-document-list`,
same LexoRank requirement, same migration script template.

Videos stay on Vercel Blob (unchanged from the current setup). The CMS
only stores the Vimeo URL + the `/videos/<file>.mp4` path string. The
runtime maps the path through `shortVideo()` (in `src/data/videoShorts.js`)
and Vercel rewrites it to the Blob URL.

## Architecture

```
Studio /admin → 🎬 Films
        │
        │  Basile drags to reorder; edits title/credits/etc.
        ▼
GROQ:  *[_type == "film"] | order(orderRank asc) {
         ..., "thumbnail": thumbnail.asset->url
       }
        ▼
src/data/cms.json (films array)
        ▼
src/sanity/loader.js → films + getFeaturedFilms + getCollapsedFilms
        ▼
src/pages/Films.jsx (drop-in replacement, no rendering changes)
```

## Data Model

### `film` (collection)

#### Content tab

| Field | Type | Notes |
|---|---|---|
| `title` | string (required) | Display name. |
| `slug` | slug (auto from title, required) | Pinned doc ID = `film-<slug>`. |
| `description` | text (3-line) | Project description. |
| `year` | number | 2000–2100, integer. |
| `client` | string | Free text. |
| `category` | string | Free text with predefined suggestions: Commercial, Documentary, Documentary / Sport, Music / Short Film, Fashion / Behind the Scenes. |
| `credits` | array<creditItem> | See below. |
| `featured` | boolean | Affects card variant (featured = autoplaying video preview). |
| `collapsed` | boolean | Affects section (collapsed = "Other Projects" small card at bottom). Both flags are independent — see Business Rules. |

`creditItem` (object):

| Field | Type | Notes |
|---|---|---|
| `side` | enum('left', 'right') | Which credit column the row appears in. |
| `role` | string | "Direction", "Music", etc. |
| `name` | string | Person name. |

#### Media tab

| Field | Type | Notes |
|---|---|---|
| `thumbnail` | image (hotspot) | Uploaded to Sanity CDN. Replaces `/posters/<slug>.jpg`. |
| `videoUrl` | url | Vimeo player URL — `https://player.vimeo.com/video/<id>`. Drives the click-through modal. |
| `videoType` | enum('vimeo', 'mp4') | Currently only `'vimeo'` in use. |
| `videoFile` | string | Path under `/videos/`. Goes through `shortVideo()` runtime mapper + Vercel Blob rewrite. |
| `aspectRatio` | number (default 1.78) | Card aspect-ratio. Auto-derived from thumbnail asset metadata when blank. |

#### Layout (advanced) tab

| Field | Type | Notes |
|---|---|---|
| `imagePosition` | enum('', 'left', 'right') | Per-film left/right override for the featured card layout. Blank = auto. |

#### Hidden

| Field | Type | Notes |
|---|---|---|
| `orderRank` | string | Managed by `@sanity/orderable-document-list`. NEVER edit by hand. |

## Business Rules

1. **Two independent display flags.**
   - `collapsed: false` (default) → renders in the top section. Card variant depends on `featured`:
     - `featured: true` → `FeaturedFilmCard` (autoplaying video preview, large)
     - `featured: false` → `FilmCard` (medium, thumbnail + meta)
   - `collapsed: true` → renders in the "Other Projects" row at the bottom as a `CollapsedFilmCard`.
   - Both flags can be `true` simultaneously: `collapsed` wins (the film appears as a collapsed card).

2. **LexoRank ordering.** Same constraint as doc 09 — orderRank values MUST be real LexoRank strings. Migration script generates them via `LexoRank.middle().genNext()` chains. If they ever break, run `cms:fix-film-ranks` (to be written; mirrors `cms:fix-photo-project-ranks`).

3. **Videos stay on Vercel Blob.** The CMS stores the `/videos/<file>.mp4` path as a string, not a Sanity file asset. Sanity has a 100 MB free-tier file limit; the showreel alone is ~50 MB and films are larger. Blob is cheaper for video.

4. **Thumbnail migration.** `scripts/upload-films.mjs` reads `src/data/films.js`, opens the existing `public/posters/<filename>.jpg` for each film, and uploads it to Sanity. SHA1 dedup keeps re-runs cheap. Films without a poster on disk get a null thumbnail (Basile uploads in Studio).

5. **Webhook GROQ filter update.** Add `film` to the list:
   ```groq
   _type in ["siteSettings", "heroOverlay", "showreel", "heroPhotos", "photoProject", "film"]
   ```

6. **Migration workflow** (same as doc 09):
   - Auto-webhook stays disabled.
   - Run `SANITY_WRITE_TOKEN=… npm run cms:upload-films`.
   - Single Sanity transaction = atomic write.
   - Click Studio **🚀 Deploy** to publish to live.

## Dependencies

- [03-collapsed-film-cards](03-collapsed-film-cards.md) — rendering rules for `CollapsedFilmCard` + section orchestration in `Films.jsx`.
- [04-featured-card-fade-on-scroll](04-featured-card-fade-on-scroll.md) — `FeaturedFilmCard` scroll-tied fade.
- [07-cms-foundation](07-cms-foundation.md) — Studio mount, build pipeline, Deploy tool.

## Build plan (12 steps, ~3 h)

### Phase 5 — Implement (do AFTER compaction)

| # | Step | Files | Effort |
|---|---|---|---|
| 1 | **Schema** | `sanity/schemas/film.js` (NEW), `sanity/schemas/index.js` (register), `sanity/desk/structure.js` (add 🎬 Films entry below 📷 Photo projects) | 25 min |
| 2 | **Fetcher query** | `scripts/fetch-cms-content.mjs` — add films GROQ projection + `flattenFilm()` that maps credits to `{left, right}` + thumbnail asset URL + passes videoFile through unchanged | 20 min |
| 3 | **Loader** | `src/sanity/loader.js` — export `films`, `getFeaturedFilms()`, `getCollapsedFilms()` with fallback to `LEGACY_FILMS` from `src/data/films.js` | 15 min |
| 4 | **Page switch** | `src/pages/Films.jsx` — change import from `../data/films` to `../sanity/loader`. No other code change (loader returns same shape). | 5 min |
| 5 | **Migration script** | `scripts/upload-films.mjs` — read `src/data/films.js`, upload each `public/posters/<slug>.*` to Sanity (skip if missing), build doc with LexoRank-spaced `orderRank`, commit one transaction | 40 min |
| 6 | **Recovery script** | `scripts/fix-film-ranks.mjs` — mirror of `cms:fix-photo-project-ranks` for films | 10 min |
| 7 | **npm scripts** | `package.json` — add `cms:upload-films` + `cms:fix-film-ranks` | 2 min |
| 8 | **GROQ filter doc** | `CLAUDE.md` — update filter line + add scripts to the "when to run" table | 5 min |
| 9 | **Build check** | `npm run build` — clean | 5 min |
| 10 | **E2E test** | `tests/e2e/cms-films-cdn.spec.js` — visit `/`, assert at least one film thumbnail has `cdn.sanity.io` in the src (proves CMS pipeline wired) | 20 min |
| 11 | **Commit + PR** | `feat/cms-stage-5-films` branch, single commit | 10 min |
| 12 | **User runs migration** | `SANITY_WRITE_TOKEN=… npm run cms:upload-films` + clicks Studio Deploy + verifies | 5 min |

Total dev time: **~2 h 30**. Plus 5 min of user-side migration steps.

## Open questions resolved by inspection

- **Credits structure.** Single array of `{side, role, name}` objects. Loader reconstructs `{left: [...], right: [...]}` for back-compat — no component changes needed.
- **collapsed vs featured.** Independent booleans (see Business Rule 1). Both exposed in the Studio with helper text.
- **Video upload.** NOT in scope. Videos stay on Vercel Blob; CMS stores the path string. Sanity's free tier has a 100 MB file limit per asset, well below typical film sizes.

## Known issues

- **`src/data/films.js` now exports `FILM_ENTRIES` (raw) in addition to `films` (mapped).** The migration script imports the raw entries so it can store the original `/videos/<file>.mp4` paths in the CMS (instead of the post-`shortVideo()` Blob URLs). `loader.js` re-applies `shortVideo()` to the CMS data so the runtime still gets the short variant + Blob URL. If `videoShorts.js` or `blobUrls.json` is updated, no re-migration is needed — the mapping is purely a runtime concern.
- **No `lint` check during build.** The repo's eslint config is missing (`.eslintrc.*`), so `npm run lint` fails before evaluating any of the new files. This is pre-existing, unrelated to Stage 5.
