---
id: 07-cms-foundation
title: CMS Foundation — Sanity Studio, siteSettings, heroOverlay, showreel, Deploy tool
edition: BABA Portfolio
depends_on: []
source_files:
  - sanity.config.js
  - sanity/schemas/index.js
  - sanity/schemas/siteSettings.js
  - sanity/schemas/heroOverlay.js
  - sanity/schemas/showreel.js
  - sanity/desk/structure.js
  - sanity/tools/DeployTool.jsx
  - src/sanity/client.js
  - src/sanity/loader.js
  - src/utils/fluidScale.js
  - src/pages/Studio.jsx
  - src/App.jsx
  - src/components/ui/HeroSection.jsx
  - src/components/layout/Navigation.jsx
  - src/data/siteConfig.js
  - src/data/cms.json
  - scripts/fetch-cms-content.mjs
  - scripts/seed-cms.mjs
  - scripts/watch-cms.mjs
  - .env.example
  - package.json
  - vercel.json
  - scripts/vercel-build.sh
routes:
  - /admin (Sanity Studio, embedded)
models:
  - sanity:siteSettings (singleton)
  - sanity:heroOverlay (singleton)
  - sanity:showreel (singleton)
  # 4th singleton sanity:heroPhotos is owned by doc 08
test_files:
  - tests/e2e/cms-studio.spec.js
known_issues:
  - "Doc 07 was split from a single monolithic CMS doc on 2026-05-20. heroPhotos and photoProject have their own docs (08, 09). When adding a new schema, also create a new doc."
  - "`src/data/siteConfig.js` STILL has hardcoded fields not yet moved to CMS: `artist.tagline`, `artist.shortBio`, `artist.title`, `contact.email`, `contact.phone`, `contact.location`, `navigation.left/center/right` arrays, `footer.links`. The hero overlay handles contact display; siteConfig values are largely unused by components but kept for shape compatibility."
  - "Sanity does NOT have a built-in webhook debounce. The recommended workflow is to disable the auto-webhook and use the Studio Deploy tool (see Business Rules → Webhook config + Deploy tool)."
  - "Vercel deploy hooks de-duplicate back-to-back triggers if a build is already running. The 200 OK response is the SAME whether queued or ignored, so the Deploy tool can't tell — it uses a 90-second button cool-down to discourage spam."
  - "The Studio bundle is ~6MB raw / ~1.95MB gzipped (measured 2026-05-21). Code-split via React.lazy in App.jsx so the public site bundle stays small. Never import 'sanity' from a non-Studio file."
  - "LATENT (timer sweep, audit 2026-06-12): DeployTool's 90s cooldown setInterval is cleared only from inside the setCooldownLeft updater — switching Studio tools mid-cooldown unmounts the component, the updater never runs, the interval ticks until page reload, and on remount the cooldown lock is silently lost (button re-enabled). Fix shape: keep the id in a ref + clear in an unmount effect; derive remaining cooldown from a timestamp (DeployTool.jsx ~L129)."
---

# 07 — CMS Foundation

## Purpose

Establish Sanity as the project's headless CMS so Basile can edit site-wide
copy, hero overlay content, contact info, social links, navigation styling,
SEO metadata, and the showreel video without involving a developer. This
doc covers the **foundation**: the three site-level singletons, the Studio
mount + Deploy tool, the build-time content pipeline, and the deploy
workflow. Stage 3 (`heroPhotos`) and Stage 4 (`photoProject`) are documented
separately in [08-cms-hero-photos.md](08-cms-hero-photos.md) and
[09-cms-photo-projects.md](09-cms-photo-projects.md).

## Architecture

The site stays a static Vite build. Sanity content is fetched at build
time, written to `src/data/cms.json`, and bundled into the static output.
Publishing in Studio does **not** auto-trigger a rebuild — Basile clicks
**Deploy** in the Studio Deploy tool when he wants the changes live.

```
Basile edits content in Sanity Studio (/admin)
        │
        ▼  Publish in Studio (drafts → published)
        │
        ▼  Click "🚀 Deploy" in the custom Studio tool
        │
        ▼  POST → Vercel Deploy Hook URL
        │
Vercel rebuild runs scripts/vercel-build.sh
        │  ↓
        │  node scripts/fetch-cms-content.mjs   (writes src/data/cms.json)
        │  ↓
        │  vite build                            (bundles cms.json into JS)
        ▼
Live in ~60 seconds.
```

The default Sanity → Vercel auto-webhook is **disabled** in this project's
production setup because:
- Every Publish would trigger a build, even mid-edit (Sanity drafts auto-save).
- Migration scripts (cms:upload-photo-projects etc.) commit 20+ docs in one
  transaction — Sanity fires N webhook events, hitting the Vercel deploy hook
  rate limit (60/hour).
- Vercel doesn't surface "build skipped (already running)" — the deploy hook
  returns 200 whether the trigger was queued or dedup-ignored.

Manual control via the Deploy tool gives a 1:1 click→deploy mapping.

**Where things live:**

```
sanity.config.js              # Studio config, embedded at /admin
sanity/schemas/               # Schema definitions
  ├── index.js                # Schema registry
  ├── siteSettings.js
  ├── heroOverlay.js
  ├── showreel.js
  ├── heroPhotos.js           # → see doc 08
  └── photoProject.js         # → see doc 09
sanity/desk/structure.js      # Singleton enforcement + collection list
sanity/tools/DeployTool.jsx   # 🚀 Deploy tab in Studio sidebar
src/sanity/
  ├── client.js               # Read-only @sanity/client
  └── loader.js               # cms.json → typed accessors w/ fallbacks
src/utils/fluidScale.js       # clamp() helper used by nav + hero text
src/data/cms.json             # Build-time snapshot, committed
scripts/
  ├── fetch-cms-content.mjs   # Build-time fetcher (runs as `prebuild`)
  ├── seed-cms.mjs            # One-shot seed of the 3 singletons
  └── watch-cms.mjs           # Dev-only: refetch on publish via WebSocket
```

## Data Model

Three singleton documents. Singletons are enforced two ways:
1. `sanity/desk/structure.js` pins each to a fixed document ID matching its
   schema name (`siteSettings`, `heroOverlay`, `showreel`) → only one
   document of each can exist.
2. `sanity.config.js` `document.actions` filter strips Delete/Duplicate/
   Unpublish from the Studio UI for these types.

### `siteSettings` (singleton)

Grouped into 6 tabs in the Studio for editorial clarity.

| Group | Field | Type | Notes |
|---|---|---|---|
| Identity | `artistName`, `artistFirstName`, `artistLastName` | string | Used in nav header, SEO titles, footer. |
| SEO | `seoTitle`, `seoDescription`, `seoKeywords` | string / text / array<string> | Bundled into `<Helmet>` per page. |
| SEO | `ogImage` | image | Open Graph share image — resolved to URL via `@sanity/image-url`. |
| SEO | `siteUrl` | url | Production URL. |
| Social | `socialInstagram`, `socialVimeo`, `socialLinkedin`, `socialTwitter`, `socialBehance` | url \| null | `null` = hidden in footer. |
| Nav | `navActiveStyle` | enum('pill', 'bold-larger') | Toggles between two implementations in `Navigation.jsx`. |
| Nav | `navLinkSize` | number (px) | Inactive link size; default 16. Wrapped in `fluidScale()` → responsive ceiling. |
| Nav | `navLinkActiveSize` | number (px) | Active link size; default 18. Same fluidScale treatment. |
| Display | `featuredTitleHoverEffect` | enum('invert', 'grow') | Radio: `invert` = "Highlight (black background)", `grow` = "Grow (bigger + bolder)". How a featured film/photo section title reacts on hover. Default `invert`. |
| Display | `featuredTitleHoverWholeSection` | boolean | When on, hovering anywhere on a featured card section highlights its title; when off, only the title text itself triggers the hover. Default true. |
| Footer | `footerCopyright` | string | Year is prepended at render time. |
| Footer | `footerShowSocial` | boolean | Hide social icons in footer. |

### `heroOverlay` (singleton)

Drives the floating text items rendered on top of both heroes (Films `/`
and Photos `/photos`). The rendering component is `HeroBioOverlay` in
[src/components/ui/HeroOverlay.jsx](../../src/components/ui/HeroOverlay.jsx).

> **The `heroOverlayItem` shape has evolved.** Positioning moved from per-item
> pixel offsets to fixed insets, and sizing moved to a named per-screen scale.
> See [13-hero-overlay-mobile](13-hero-overlay-mobile.md) and
> [14-hero-overlay-sizing](14-hero-overlay-sizing.md) for the canonical model —
> the table below reflects the **current** schema.

| Field | Type | Notes |
|---|---|---|
| `items` | array<`heroOverlayItem`> | Ordered list of floating items. |

`heroOverlayItem` (object):

| Field | Type | Notes |
|---|---|---|
| `text` | string (required) | The visible string. |
| `anchor` | enum<6 anchors> | `top-left` / `top-right` / `middle-left` / `middle-right` / `bottom-left` / `bottom-right`. No center anchors — overlay text is never centered. Drives a fixed-inset position; there are no offsets. |
| `size` | enum('body', 'contact') | "Style" in Studio. Casing/tracking only: `body` = normal, `contact` = uppercase + wide tracking. |
| `textSize` | enum('xs','sm','md','lg','xl') | Named computer/base size scale → 18/22/25/28/34px. |
| `autoShrinkSmallScreens` | boolean (default true) | On → phone/tablet sizes derive automatically via `fluidScale`. Off → editor sets `phoneSize`/`tabletSize` explicitly. |
| `phoneSize` / `tabletSize` | enum('xs'…'xl') | Shown only when auto-shrink is off. |
| `link` | object \| null | `{ type: 'none' \| 'email' \| 'phone' \| 'url', value: string }`. Phone → `tel:` (non-digits stripped); email → `mailto:`; url → `target="_blank" rel="noopener noreferrer"`. |
| `maxWidth` | number (px) \| null | Caps the item's width so long text wraps. ~720 for bio/sentence items. |
| `mobileVisible` | boolean (default true) | When false, the item is hidden on phones. |
| `stackWithSiblings` | boolean (default false) | Adjacent flagged items with the SAME anchor merge into one `flex-row flex-wrap` container. The row gap is proportional to the text size (no editable gap field). |
| `offsetX` / `offsetY` / `stackRowGap` | (retired) | Kept `hidden: true` in the schema only so older documents don't show "unknown field" warnings. The renderer ignores them. |

### `showreel` (singleton)

| Field | Type | Notes |
|---|---|---|
| `vimeoUrl` | url | Vimeo link used in the click-through modal. |
| `videoMux` | `mux.video` | Hero background video — drag-and-drop into Studio, Mux transcodes to ABR HLS. See [doc 12](12-cms-video-uploads-mux.md). |
| `videoFile` | string (read-only) | Legacy Vercel Blob path. Transitional fallback used only when `videoMux` is empty. |
| `posterImage` | image \| null | Optional poster-frame override. Blank → a frame Mux picks automatically. |

## API Endpoints

No runtime HTTP endpoints. Three categories of "URL surface":

**Routes added by this stage:**
- `/admin/*` — embedded Sanity Studio (lazy-loaded React component). Public route; Studio enforces Google OAuth on its own.

**Routes removed:**
- `/about` — page deleted, contact info now lives in CMS hero overlay items.
- `/contact` — page deleted.

**Studio tools (sidebar tabs in `/admin`):**
- Default panes (siteSettings / heroOverlay / showreel + heroPhotos / photoProject from docs 08, 09).
- 🚀 **Deploy** (custom — `sanity/tools/DeployTool.jsx`). POSTs to the Vercel deploy hook from `VITE_VERCEL_DEPLOY_HOOK_URL`. 90-second cool-down on the button after each click to avoid Vercel's silent dedupe.

**Sanity HTTP endpoints called from the build:**
- `https://<projectId>.api.sanity.io/v2024-12-01/data/query/production?query=…` — one GROQ projection covering all 6 doc types (4 singletons + `photoProject` + `film`), with dereferenced image + Mux assets.

## Business Rules

### Build pipeline

1. **`prebuild` runs `scripts/fetch-cms-content.mjs`** (also in
   `scripts/vercel-build.sh`). It runs one GROQ projection that pulls all
   schema-types in one round-trip and writes `src/data/cms.json`.
2. **Fail-soft.** If Sanity is unreachable or the dataset is empty, the
   fetcher keeps the existing committed `cms.json` and exits 0. The build
   continues with the last-good snapshot.
3. **`src/data/cms.json` IS committed.** The fetcher overwrites it every
   build. Local edits to it are pointless (`cms:watch` overwrites them on
   every Publish).

### Studio + Deploy tool

4. **Singletons enforced** via `documentId(name)` in
   `sanity/desk/structure.js` + action filtering in `sanity.config.js`.
   Basile can't delete or duplicate the three site singletons.
5. **Studio is code-split.** `src/App.jsx` lazy-loads `src/pages/Studio.jsx`
   so the ~6 MB raw / ~1.95 MB gzipped (measured 2026-05-21) Studio bundle
   doesn't ship with the public site.
6. **Deploy tool reads `VITE_VERCEL_DEPLOY_HOOK_URL`** at build time
   (Vite inlines `VITE_*` vars). The URL ends up in the public Studio JS
   — acceptable risk for a portfolio (worst case: anyone with the URL can
   trigger redeploys at the 60/hour Vercel rate limit).
7. **Deploy tool cool-down: 90 s.** After each click the button locks and
   shows a countdown. Prevents Basile from spamming the button while a
   build is still running (Vercel silently dedupes those clicks and the
   UI can't tell them from queued ones).

### Hero overlay rendering

8. **Anchor → CSS positioning.** Each `anchor` maps to a **fixed inset** —
   `2.5rem` from the horizontal edge, `9rem` top (clears the nav), `2.5rem`
   bottom; middle anchors centre vertically. There are no per-item offsets.
   Per-screen text size is resolved by `resolveOverlayFontSize(item, tier)`.
   Full detail in [doc 14](14-hero-overlay-sizing.md); mobile auto-safe zones
   in [doc 13](13-hero-overlay-mobile.md).
9. **Stack rules.** Adjacent items with `stackWithSiblings: true` AND the
   same `anchor` merge into one `flex-row flex-wrap` container. The row gap is
   proportional to the text size (`stackRowGapPx`, ≈0.55× the base px) — there
   is no editable gap field.
10. **Link types.** `email` → `mailto:`. `phone` → `tel:` with non-digits
    stripped from the value. `url` → external link with
    `target="_blank" rel="noopener noreferrer"`. Phone-typed items also
    get `uppercase` for visual matching with the original design.

### Webhook config + Deploy tool (operations)

11. **Auto-webhook is disabled in production.** See `CLAUDE.md` →
    "Sanity webhook config" for the toggle path. The Studio Deploy tool
    is the only path that triggers deploys.
12. **Webhook GROQ filter** — if you ever re-enable the auto-webhook,
    the filter MUST list every schema type so `sanity.imageAsset`
    uploads don't trigger N rebuilds:
    ```groq
    _type in ["siteSettings", "heroOverlay", "showreel", "heroPhotos", "photoProject", "film"]
    ```
13. **Manual migration script flow** (when running `cms:upload-*` or
    `cms:fix-*`): the script writes a single Sanity transaction with N
    `createOrReplace` calls. Sanity fires N webhook events. With the
    auto-webhook disabled, none reach Vercel. Run the migration, then
    click Deploy in Studio once.

### Auth + ownership

14. **Maxime owns the Sanity project** (`e9pgmdfm`). Basile is invited as
    `Editor`. Studio login is Google OAuth via Sanity.

## Dependencies

- None. This is the foundation that docs 08 and 09 build on.

## Known Issues

See frontmatter for the up-to-date list. Highlights:

- Some `siteConfig.js` fields are still hardcoded (tagline, shortBio,
  contact info, navigation labels). Doc 07's predecessor planned to move
  them but never did. The hero overlay handles contact display, so the
  hardcoded values are largely dead — but the gap exists.
- The Sanity → Vercel deploy hook flow has a built-in race (dedupe) and
  no debounce. The Deploy tool's 90 s cool-down is the workaround.
