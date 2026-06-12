# BABA — Basile Deschamps Portfolio

Portfolio website for visual artist Basile Deschamps (film & photography).
React + Vite + Tailwind CSS, deployed on Vercel. Content lives in **Sanity CMS** (project `e9pgmdfm`).

## Setup

```bash
npm install
npm run dev
```

**Note:** This project uses JavaScript/JSX (not TypeScript), overriding global defaults.

## Commands

- `npm run dev` — Start dev server (localhost:5173, auto-opens browser)
- `npm run build` — Production build to `dist/` (runs `cms:fetch` first via `prebuild`)
- `npm run preview` — Preview production build locally
- `npm run lint` — ESLint check (zero warnings policy)
- `npx playwright test` — Run E2E tests
- `npm run cms:fetch` — Pull latest published content from Sanity → `src/data/cms.json` (read-only, no token)
- `npm run cms:watch` — Live-reload local dev when Sanity content changes (run alongside `npm run dev`; WebSocket subscription)
- `npm run cms:seed` — Idempotent seed of the 3 site singletons (siteSettings, heroOverlay, showreel). Run ONCE for a fresh project or to reset. Needs `SANITY_WRITE_TOKEN`.
- `npm run cms:upload-hero-photos` — One-shot: upload every file from `public/img/BABA PHOTOS/` to Sanity + write the `heroPhotos` singleton. Re-runs are cheap (SHA1 dedup). Needs `SANITY_WRITE_TOKEN`. See [.mdd/docs/08-cms-hero-photos.md](.mdd/docs/08-cms-hero-photos.md).
- `npm run cms:upload-photo-projects` — One-shot: read `src/data/photoProjects.js` and create 22 `photoProject` docs in Sanity. Idempotent (pinned doc IDs). Needs `SANITY_WRITE_TOKEN`. See [.mdd/docs/09-cms-photo-projects.md](.mdd/docs/09-cms-photo-projects.md).
- `npm run cms:fix-photo-project-ranks` — Re-assigns every photoProject's `orderRank` to a fresh LexoRank value. Run when drag-to-reorder in Studio is producing flaky results (a sign the ranks aren't LexoRank-compatible). Needs `SANITY_WRITE_TOKEN`.
- `npm run cms:upload-films` — One-shot: read `src/data/films.js` (`FILM_ENTRIES`) and create `film` docs in Sanity. Idempotent (pinned doc IDs = `film-<slug>`). Uploads existing posters from `public/posters/`; films without a poster on disk get a blank thumbnail. Needs `SANITY_WRITE_TOKEN`. See [.mdd/docs/10-cms-films.md](.mdd/docs/10-cms-films.md).
- `npm run cms:fix-film-ranks` — Re-assigns every film's `orderRank` to a fresh LexoRank value. Same fix as for photo projects. Needs `SANITY_WRITE_TOKEN`.
- `npm run cms:migrate-film-featured` — Two-phase rename of the film display flag (`collapsed` → `featured`, 2026-06-12). Default run sets `featured = !collapsed` and keeps `collapsed` (safe while the pre-rename build is live); `-- --prune` deletes `collapsed` — run it ONLY after the featured-aware build is deployed. Idempotent. Needs `SANITY_WRITE_TOKEN`. See [.mdd/docs/10-cms-films.md](.mdd/docs/10-cms-films.md).
- `npm run cms:migrate-blob-to-mux` — One-shot: for every film with a Blob `videoFile` and no `videoMux`, copy the video into Mux (transcoded + ABR HLS) and patch the Sanity doc. Idempotent. Needs `SANITY_WRITE_TOKEN`, `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`. See [.mdd/docs/12-cms-video-uploads-mux.md](.mdd/docs/12-cms-video-uploads-mux.md).
- `npm run studio:deploy` — Deploy a hosted backup studio to `basiledeschamps.sanity.studio`

**When to run each script** — quick reference:

| Situation | Command |
|---|---|
| Fresh clone, first-time setup | `cms:seed` → `cms:upload-hero-photos` → `cms:upload-photo-projects` → `cms:upload-films` |
| Sanity content changed, want it locally | `cms:fetch` (or `cms:watch` for live reload) |
| Drag-to-reorder behaving weirdly (photos) | `cms:fix-photo-project-ranks` |
| Drag-to-reorder behaving weirdly (films) | `cms:fix-film-ranks` |
| Adding a new photo to the slideshow | Upload in Studio via `/admin → 🖼️ Hero photos` (no script needed) |
| Adding a new photo project | Create in Studio via `/admin → 📷 Photo projects` (no script needed) |
| Adding a new film | Create in Studio via `/admin → 🎬 Films` (no script needed) |
| Bulk re-import from legacy `photoProjects.js` | `cms:upload-photo-projects` (overwrites Sanity docs — manual edits lost) |
| Bulk re-import from legacy `films.js` | `cms:upload-films` (overwrites Sanity docs — manual edits lost) |
| Film flag rename, phase 1 (one time) | `cms:migrate-film-featured` (sets `featured`, keeps `collapsed`) |
| Film flag rename, phase 2 (after the new build is live) | `cms:migrate-film-featured -- --prune` (deletes `collapsed`) |
| Migrate legacy Blob videos into Mux (one time) | `cms:migrate-blob-to-mux` |
| Adding/updating a film's preview video | Upload in Studio via `/admin → 🎬 Films → Media → Preview video (Mux)` |

Before running any `cms:upload-*` or `cms:fix-*` script: leave the Sanity auto-webhook disabled (default) so the N mutations don't fire N Vercel builds. After the script finishes, click the Studio **🚀 Deploy** tool to publish the changes.

## Architecture

```
src/
├── App.jsx              # Router: /admin/* (Studio, lazy) + /* (public site)
├── main.jsx             # Entry point, wraps app in BrowserRouter
├── components/
│   ├── films/           # CollapsedFilmCard, FeaturedFilmCard, FilmModal
│   ├── photos/          # FeaturedPhotoCard, CollapsedPhotoCard, PhotoCardPreview, ExpandedPhotoGallery, FloatingGalleryHero
│   ├── layout/          # Navigation, Layout, Footer
│   └── ui/              # HeroSection, PersistentHeroText, Divider, Lightbox
├── data/
│   ├── siteConfig.js    # Legacy-shape wrapper around CMS data (used by components)
│   ├── cms.json         # Last build-time snapshot of CMS content (tracked in git)
│   ├── films.js         # Portfolio films (Stage 5 — not yet CMS-driven)
│   └── photoProjects.js # Portfolio photos (Stage 4 — not yet CMS-driven)
├── sanity/
│   ├── client.js        # @sanity/client (read-only)
│   └── loader.js        # Imports cms.json, exposes typed accessors + fallbacks
├── pages/               # Films, Photos, Studio
└── utils/
    └── fluidScale.js    # Shared clamp() helper for fluid typography

sanity/
├── schemas/             # siteSettings, heroOverlay, showreel
└── desk/structure.js    # Pinned singleton document IDs

scripts/
├── fetch-cms-content.mjs  # Build-time CMS fetch (runs before vite build)
├── watch-cms.mjs          # Dev-time WebSocket subscription to refetch on publish
├── seed-cms.mjs           # Idempotent seed of the three singletons
└── upload-videos-to-blob.mjs  # Vercel Blob upload for hero/film videos
```

## CMS

**Sanity project:** `e9pgmdfm`, dataset `production`.
**Studio:** embedded at `/admin` (Sanity Studio v4 React component). Hosted backup at `basiledeschamps.sanity.studio` after `npm run studio:deploy`. Plugins: `sanity-plugin-mux-input` (video), `sanity-plugin-media` (searchable/taggable asset browser — its internal `media.tag` doc type must NOT be added to the webhook GROQ filter), Vision (dev-only — stripped from production builds so editors don't see the GROQ playground).
**Auth:** Google OAuth via Sanity. Editors invited from the [project dashboard](https://www.sanity.io/manage/project/e9pgmdfm).

### Build-time content pipeline

```
Publish in Studio
  → Sanity webhook → Vercel deploy hook
  → vercel-build.sh runs scripts/fetch-cms-content.mjs
  → src/data/cms.json updated
  → Vite bundles cms.json into the static build
```

`src/data/cms.json` is **committed** so the build never fails when Sanity is unreachable. The fetcher overwrites it on every build; if Sanity is down, the build continues with the last good snapshot.

### Sanity webhook config (CRITICAL — read before adding new content types)

The Sanity webhook lives at [Sanity Manage → API → Webhooks](https://www.sanity.io/manage/project/e9pgmdfm/api/webhooks). It must be configured exactly as below — getting any of this wrong burns Vercel build minutes.

| Field | Value |
|---|---|
| Dataset | `production` |
| Trigger events | `Create`, `Update`, `Delete` |
| **Drafts** toggle | ☐ **UNCHECKED** — drafts auto-save on every keystroke; checking this floods Vercel |
| **Versions** toggle | ☐ **UNCHECKED** — applies to releases / scheduled docs we don't use |
| Filter (GROQ) | `_type in [<list of every singleton + collection type>]` |
| HTTP method | POST |
| URL | Vercel project deploy hook URL |

**Sanity does NOT have a built-in webhook debounce.** Every document mutation fires its own webhook event. This is fine for normal one-off publishes, but a migration script that touches N documents triggers N webhook events → N Vercel deploys, which can hit the Vercel deploy hook 60/hour rate limit.

### Deploy workflow — manual via Studio tool (recommended)

The Studio includes a custom **Deploy** tool ([sanity/tools/DeployTool.jsx](sanity/tools/DeployTool.jsx)) that triggers the Vercel deploy hook on demand. This is the preferred workflow:

1. **Disable the auto-webhook** in Sanity Manage → API → Webhooks → toggle off
2. Edit + Publish content in Studio as much as you want (no deploys triggered)
3. When ready: open the Studio **🚀 Deploy** tab → click **Deploy now** → one Vercel build runs

Configuration: set `VITE_VERCEL_DEPLOY_HOOK_URL` in `.env` for local dev and in Vercel env vars for production. The Studio bundle bakes the URL in.

Security note: the deploy hook URL ends up in the public Studio bundle (everyone who hits `/admin` downloads it). Acceptable for a portfolio — worst case is an attacker triggers redeploys of the same code at the 60/hour rate limit. If this becomes a problem, swap to a Vercel Function intermediary that checks a session cookie before forwarding.

### Migration scripts — manual webhook toggle

Migration scripts (`cms:upload-photo-projects`, `cms:upload-hero-photos`, `cms:upload-films`, `cms:fix-photo-project-ranks`, `cms:fix-film-ranks`, `cms:seed`) batch all their mutations into a single Sanity transaction so the data write is atomic. But Sanity still fires N webhook events (one per document). If the auto-webhook is enabled, that's N Vercel deploys.

Workflow:
1. Sanity Manage → toggle webhook **disabled** (if not already)
2. Run the migration script
3. Studio → Deploy tab → **Deploy now** (one deploy picks up all the new content)

**The GROQ filter is mandatory.** Without it, every asset upload — every image you drop into the Studio — creates a `sanity.imageAsset` document mutation, which fires the webhook, which triggers a Vercel rebuild. Uploading 100 photos at once = 100 rebuilds. The filter excludes `sanity.imageAsset` (and any other Sanity-internal type) by listing only the singleton types we care about.

**When adding a new singleton type:** update the GROQ filter in the Sanity webhook UI to include the new `_type`. Forgetting this means publishing the new type silently does nothing in prod (because the webhook ignores it).

Current filter (matches every schema type defined in [sanity/schemas/index.js](sanity/schemas/index.js)):
```groq
_type in ["siteSettings", "heroOverlay", "showreel", "heroPhotos", "photoProject", "film"]
```

### Schema

Four singletons + two collections:
- **`siteSettings`** (singleton) — artist name, SEO, social URLs, footer copyright, nav style + link sizes, Display group (featured-section title-hover effect + scope)
- **`heroOverlay`** (singleton) — array of floating text items (bio, clients, phone, email…). Per item: anchor (fixed-inset position — no offsets), text style + size (with optional per-screen phone/tablet sizes), link, grouping, mobile-visibility. Fields split Basics / Advanced with plain-language labels. Mobile auto-arranges into nav-safe zones (see Hero overlay model below)
- **`showreel`** (singleton) — Vimeo URL + hero video file path
- **`heroPhotos`** (singleton) — array of uploaded images for the Photos page slideshow
- **`photoProject`** (collection) — one document per photo project. Fields grouped into "Content" (title, slug, description, year, client, category, photos, visible, featured) and "Layout (advanced)" (previewPattern, previewPhotoIndices) so Basile sees the editable content fields by default and can drill into layout knobs when needed. `visible: false` hides the project from the public Photos page without unpublishing the document.
- **`film`** (collection) — one document per film. Single-tab layout: identity → story → credits → video (Mux preview + Vimeo modal URL) → display (visible + featured) → advanced overrides (thumbnail, aspect ratio). `featured: true` → large homepage card; `false` → "Other Projects" row (same vocabulary as photoProject; renamed from the inverted `collapsed` on 2026-06-12 — see [.mdd/docs/10-cms-films.md](.mdd/docs/10-cms-films.md) for the two-phase migration). Cards on the homepage alternate left/right by row index — no per-document or per-site alignment knob. Autoplaying preview video is stored in Mux via `sanity-plugin-mux-input` — drag-and-drop in Studio, Mux transcodes to ABR HLS and serves via its own CDN (does NOT consume Vercel Fast Data Transfer). Aspect ratio and thumbnail default to Mux's auto-probed values; the schema fields are overrides you set only when you want to force a different shape or a specific poster frame. `credits` is a flat array of `{side, role, name}` rows; the runtime rebuilds the `{left:[], right:[]}` shape expected by components.

Field reference: see `sanity/schemas/*.js` for canonical definitions. Singletons are enforced via `sanity/desk/structure.js` + action filters in `sanity.config.js`. Both collections (`photoProject`, `film`) use `@sanity/orderable-document-list` and are sorted by `orderRank` ascending.

### Hero overlay model

`heroOverlay.items[]` is rendered by [HeroOverlay.jsx](src/components/ui/HeroOverlay.jsx) (pure helpers in [heroOverlayLayout.js](src/components/ui/heroOverlayLayout.js)). `HeroBioOverlay` takes a `variant` prop — each hero (Films `HeroSection`, Photos `FloatingGalleryHero`) renders it twice, once inside its `hidden md:block` wrapper and once inside its `md:hidden` wrapper.

**Positioning** — desktop (`variant="desktop"`, ≥768px) places each item from its `anchor` (6 options: left/right × top/middle/bottom — never centered) via **fixed rem insets** (`2.5rem` edges, `9rem` top so it clears the nav, `2.5rem` bottom). There are **no per-item offsets** — `offsetX`/`offsetY` are retired (kept `hidden` in the schema only so older docs don't show orphan-field warnings). Mobile (`variant="mobile"`, <768px) uses the automatic nav-safe top/bottom zones from doc 13 (`ResizeObserver` auto-shrink, floored 0.6); the vertical half of `anchor` picks the zone.

**Size — per viewport tier** (`viewportTier()`: phone <768 / tablet 768–1024 / desktop ≥1024). `size` ("Style" in Studio) = `body`/`contact` (casing/tracking only). `textSize` = named scale `xs…xl` → base 18/22/25/28/34px, each ×1.125 (the global type scale — see [.mdd/docs/16](.mdd/docs/16-global-type-scale.md)) — the computer/base size. `autoShrinkSmallScreens` (default true): **on** → phone & tablet derive via `fluidScale` (phone uses `OVERLAY_TEXT_MOBILE_RATIO` 0.75); **off** → editor sets explicit `phoneSize`/`tabletSize`. All resolved by `resolveOverlayFontSize(item, tier)`. Legacy items without `textSize` fall back style-aware (`body`→28, `contact`→25) — migration-free.

**Grouping + gap** — `stackWithSiblings` items at the same anchor merge into one flex-wrap container; the row gap is **proportional to the text size** (`stackRowGapPx`, ≈0.55× — `em`-style, not a fixed/editable value). `mobileVisible: false` hides an item from phones.

**Studio** — item fields split into Basics + a collapsed "Advanced" fieldset, plain-language labels/descriptions for a non-technical editor. See [.mdd/docs/14-hero-overlay-sizing.md](.mdd/docs/14-hero-overlay-sizing.md) and [13](.mdd/docs/13-hero-overlay-mobile.md).

### Fluid typography

`src/utils/fluidScale.js` exposes a single `fluidScale(basePx, { mobileRatio = 0.85 })` helper. Used for both nav link sizes and hero overlay text. Pattern: `clamp(base × mobileRatio, base/10 vw, base)` — desktop ceiling at the CMS-set value, mobile floor at `mobileRatio`. Nav links use the 0.85 default; hero overlay text passes `OVERLAY_TEXT_MOBILE_RATIO` (0.75) for a stronger mobile/desktop size contrast.

## Key Files

- `src/data/siteConfig.js` — Compatibility shim. Components still `import { siteConfig }` but the values stream from `src/sanity/loader.js`.
- `src/data/films.js` / `src/data/photoProjects.js` — Legacy fallback data. Both are now CMS-driven (Stages 4 + 5); these stay in the repo as a safety net the loader falls back to if `cms.json` is empty.
- `src/components/ui/HeroSection.jsx` — Fullscreen video hero. **Not sticky** — commit `3d1dec4` dropped the sticky pin so the hero + nav scroll away together (HeroSection.jsx:150-156 documents why). Renders `<HeroBioOverlay>` for the CMS-driven floating text overlay. The hero showreel mutes itself when a film modal opens (HeroSection.jsx:114-120 + `muteHero()` in Films.jsx).
- `src/components/ui/HeroOverlay.jsx` — Shared hero text overlay (`HeroBioOverlay`), used by both heroes. Desktop = free positioning; mobile = automatic nav-safe zones. Layout maths in `heroOverlayLayout.js`.
- `src/components/films/FilmModal.jsx` — Shared fullscreen Vimeo overlay (used by both film detail and showreel).
- `src/components/ui/PersistentHeroText.jsx` — Split-color artist name overlay (white on video, black on background).
- `tailwind.config.js` — Custom design tokens all backed by CSS variables from `index.css`.

## Design System

- Fonts: `font-header` (Helvetica Now Display), `font-title` (Helvetica Now Display), `font-body` (Helvetica Now Text)
- Colors: All via CSS variables (`--color-background`, `--color-text`, etc.)
- Custom sizes: `text-hero`, `text-subheading`
- Type scale: root font-size is **18px** — a global +12.5% type & spacing scale (see [.mdd/docs/16](.mdd/docs/16-global-type-scale.md)). Layout max-widths are pinned in px so the page canvas stays fixed.
- Import alias: `@/` maps to `src/` (configured in vite.config.js)

## Gotchas

- Use Flexbox for all component layouts — never use `position: absolute` to place sibling elements (text, images, videos) side by side. Use `flex-row` / `flex-row-reverse` for left/right alternation and `gap` for guaranteed spacing.
- Use `svh` units (not `vh`) for mobile viewport heights — avoids iOS address bar issues.
- The hero prefers the Mux showreel stream (`siteConfig.showreel.muxStreamUrl`); the local fallback (`/videos/Showreel 2021.mp4`) is a large file. Original content in `content/` is gitignored.
- Bottom-aligned elements use absolute positioning with `bottom-[10vh]` + `left-0 right-0 z-0`.
- Global `prefers-reduced-motion: reduce` in `index.css` disables all animations site-wide.
- Film detail uses modal overlay (FilmModal), not a separate route.
- Photo images are uploaded in Sanity Studio and served from the Sanity CDN (`asset->url` flattened into `cms.json`). `public/photos/` + the `/photos/...` paths in `photoProjects.js` are the legacy fallback only.
- **Playwright tests on `/` and `/photos`** must use `locator.dispatchEvent('click')` instead of `.click()` for elements below the fold. The desktop smooth-scroll system sets `body { overflow: hidden }` and translates the content via CSS transform, so Playwright's actionability check (and even `force: true`) reports "Element is outside of the viewport." `dispatchEvent` fires the React onClick directly without the actionability check. See `tests/e2e/featured-photo-cards.spec.js` for an example.
- The Sanity Studio bundle is huge (~6MB raw / ~1.95MB gzipped, measured 2026-05-21). It's code-split via `React.lazy` so the public site bundle stays small. Never `import 'sanity'` from a non-Studio file.
- **`/about` and `/contact` routes were removed** in the CMS migration. Contact info now lives in the CMS hero overlay items.
