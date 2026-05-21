---
id: 10-cms-films
title: CMS — Films (collection with drag-to-reorder)
edition: BABA Portfolio
depends_on:
  - 03-collapsed-film-cards
  - 04-featured-card-fade-on-scroll
  - 07-cms-foundation
status: SHIPPED — films are CMS-driven (17 films live in cms.json, 2026-05-21)
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
  - tests/e2e/cms-films-cdn.spec.js
  - tests/e2e/cms-films-mux.spec.js
known_issues: []
---

# 10 — CMS Films

> **Schema evolved since first writing.** The preview video moved from a
> Vercel Blob path string to a Mux asset — see [12-cms-video-uploads-mux](12-cms-video-uploads-mux.md).
> The `featured` and `imagePosition` fields were also removed (the homepage now
> alternates film cards left/right by row index). The Data Model + Business
> Rules below reflect the **current** schema.

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

Single-tab layout (no `groups`), ordered in the natural flow of authoring via
`fieldsets`: Identity → Story → Credits → Video → Display → Advanced overrides
(collapsed by default). Canonical definition: [sanity/schemas/film.js](../../sanity/schemas/film.js).

#### Identity

| Field | Type | Notes |
|---|---|---|
| `title` | string (required) | Display name. |
| `slug` | slug (auto from title, required) | Pinned doc ID = `film-<slug>`. |

#### Story (fieldset)

| Field | Type | Notes |
|---|---|---|
| `description` | text (3-line) | Project description. |
| `year` | number | 2000–2100, integer. |
| `client` | string | Free text. |
| `category` | string | Free text with predefined suggestions (Commercial, Documentary, Documentary / Sport, Fashion Film, Music Video, …). |

#### Credits

| Field | Type | Notes |
|---|---|---|
| `credits` | array<creditItem> | Flat array; the fetcher rebuilds the `{left,right}` shape. See below. |

`creditItem` (object):

| Field | Type | Notes |
|---|---|---|
| `side` | enum('left', 'right') | Which credit column the row appears in. |
| `role` | string (required) | "Direction", "Music", etc. |
| `name` | string (required) | Person name. |

#### Video (fieldset)

| Field | Type | Notes |
|---|---|---|
| `videoMux` | `mux.video` | Autoplaying preview shown on the homepage card. Drag-and-drop upload; Mux transcodes to ABR HLS. See [doc 12](12-cms-video-uploads-mux.md). |
| `videoUrl` | url | Vimeo URL — drives the click-through `FilmModal`. Any Vimeo link works; the site normalises it to the embeddable player. |

#### Display (fieldset)

| Field | Type | Notes |
|---|---|---|
| `visible` | boolean (default true) | Toggle off to hide the film from the homepage without unpublishing the document. |
| `collapsed` | boolean (default false) | Move the film to the "Other Projects" row at the bottom (small `CollapsedFilmCard`, click to expand). |

#### Advanced overrides (fieldset, collapsed by default)

| Field | Type | Notes |
|---|---|---|
| `thumbnail` | image (hotspot) | Optional custom poster. Blank → a frame Mux picks automatically. |
| `aspectRatio` | number (positive) | Optional override. Blank → Mux's probed aspect ratio, falling back to 1.78. |

#### Hidden

| Field | Type | Notes |
|---|---|---|
| `orderRank` | string | Managed by `@sanity/orderable-document-list`. NEVER edit by hand. |

**Removed fields** (present in earlier drafts of this doc, no longer in the
schema): `featured` — cards now alternate left/right by row index, there is no
featured/non-featured distinction; `videoType` / `videoFile` — superseded by
`videoMux` (doc 12); `imagePosition` — no per-film alignment knob.

## Business Rules

1. **One display flag drives placement.** There is no `featured` flag — film
   cards on the homepage alternate left/right purely by row index.
   - `collapsed: false` (default) → renders in the top section as a
     `FeaturedFilmCard` (autoplaying Mux preview, large).
   - `collapsed: true` → renders in the "Other Projects" row at the bottom as a
     `CollapsedFilmCard` (small, click to expand).
   - `visible: false` removes the film from the homepage entirely without
     unpublishing the document. The loader filters on `visible !== false`.

2. **LexoRank ordering.** Same constraint as doc 09 — orderRank values MUST be real LexoRank strings. The migration script generates them via `LexoRank.middle().genNext()` chains. If they ever break, run `cms:fix-film-ranks` (`scripts/fix-film-ranks.mjs`, mirrors `cms:fix-photo-project-ranks`).

3. **Preview video is a Mux asset.** The autoplaying preview lives in Mux via the `videoMux` (`mux.video`) field, uploaded by drag-and-drop in Studio — see [doc 12](12-cms-video-uploads-mux.md). Mux serves the ABR HLS stream from its own CDN (no Vercel Fast Data Transfer consumed). The Vimeo `videoUrl` is separate and only drives the click-through `FilmModal`.

4. **Thumbnail migration.** `scripts/upload-films.mjs` reads `src/data/films.js`, opens the existing `public/posters/<filename>.jpg` for each film, and uploads it to Sanity. SHA1 dedup keeps re-runs cheap. Films without a poster on disk get a null thumbnail (Basile uploads in Studio). The script does NOT migrate preview videos — attach `videoMux` in Studio, or run `cms:migrate-blob-to-mux` for legacy Blob videos.

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
| 3 | **Loader** | `src/sanity/loader.js` — export `films`, `getNonCollapsedFilms()`, `getCollapsedFilms()`, `getFilmBySlug()` with fallback to `LEGACY_FILMS` from `src/data/films.js` | 15 min |
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

- **Credits structure.** Single array of `{side, role, name}` objects. The fetcher reconstructs `{left: [...], right: [...]}` for back-compat — no component changes needed.
- **Display placement.** A single `collapsed` boolean plus a `visible` boolean (see Business Rule 1). No `featured` flag — homepage cards alternate left/right by row index.
- **Preview video.** Stored in Mux via the `videoMux` field — see [doc 12](12-cms-video-uploads-mux.md). The earlier plan to keep videos on Vercel Blob (path string in the CMS) was superseded.

## Known issues

- **`src/data/films.js` is legacy fallback only.** It exports `FILM_ENTRIES` (raw) and `films` (mapped). `loader.js` falls back to `films` when `cms.json` has no film data. `scripts/upload-films.mjs` imports `FILM_ENTRIES` for a bulk re-import; it writes only schema fields (no `videoFile`/`videoType`/`featured`/`imagePosition`) — preview videos are attached separately in Studio via `videoMux`.
