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
- `npm run cms:fetch` — Pull latest published content from Sanity → `src/data/cms.json`
- `npm run cms:watch` — Live-reload local dev when Sanity content changes (run alongside `npm run dev`)
- `npm run cms:seed` — Seed/reset CMS singletons (needs `SANITY_WRITE_TOKEN`)
- `npm run studio:deploy` — Deploy a hosted backup studio to `basiledeschamps.sanity.studio`

## Architecture

```
src/
├── App.jsx              # Router: /admin/* (Studio, lazy) + /* (public site)
├── main.jsx             # Entry point, wraps app in BrowserRouter
├── components/
│   ├── films/           # FilmCard, FeaturedFilmCard, FilmModal
│   ├── photos/          # ProjectCard, PhotoGrid, FloatingGalleryHero
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
**Studio:** embedded at `/admin` (Sanity Studio v4 React component). Hosted backup at `basiledeschamps.sanity.studio` after `npm run studio:deploy`.
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
| **Delay (seconds)** | `60` (or higher) — coalesces bursts of mutations into one webhook fire. Without this, every migration script run triggers N deploys (one per document); with delay, it's one deploy regardless of N. Tradeoff: regular publishes also wait the delay before deploying — acceptable for a portfolio. |
| Filter (GROQ) | `_type in [<list of every singleton + collection type>]` |
| HTTP method | POST |
| URL | Vercel project deploy hook URL |

**The GROQ filter is mandatory.** Without it, every asset upload — every image you drop into the Studio — creates a `sanity.imageAsset` document mutation, which fires the webhook, which triggers a Vercel rebuild. Uploading 100 photos at once = 100 rebuilds. The filter excludes `sanity.imageAsset` (and any other Sanity-internal type) by listing only the singleton types we care about.

**When adding a new singleton type:** update the GROQ filter in the Sanity webhook UI to include the new `_type`. Forgetting this means publishing the new type silently does nothing in prod (because the webhook ignores it).

Current filter (matches every schema type defined in [sanity/schemas/index.js](sanity/schemas/index.js)):
```groq
_type in ["siteSettings", "heroOverlay", "showreel", "heroPhotos", "photoProject"]
```

### Schema

Four singletons + one collection:
- **`siteSettings`** (singleton) — artist name, SEO, social URLs, footer copyright, nav style + link sizes
- **`heroOverlay`** (singleton) — array of floating text items (bio, clients, phone, email…) with per-item anchor/offsets/size/link
- **`showreel`** (singleton) — Vimeo URL + hero video file path
- **`heroPhotos`** (singleton) — array of uploaded images for the Photos page slideshow
- **`photoProject`** (collection) — one document per photo project. Fields grouped into "Content" (title, slug, description, year, client, category, photos, featured, displayOrder) and "Layout (advanced)" (previewPattern, previewPhotoIndices, imagePosition) so Basile sees the editable content fields by default and can drill into layout knobs when needed.

Field reference: see `sanity/schemas/*.js` for canonical definitions. Singletons are enforced via `sanity/desk/structure.js` + action filters in `sanity.config.js`. The `photoProject` list view is sorted by `displayOrder` ascending.

### Hero overlay model

Each `heroOverlay.items[]` entry is an absolute-positioned text/link block. The renderer ([src/components/ui/HeroSection.jsx](src/components/ui/HeroSection.jsx)) supports:

- **Anchor** — 9 options (`top-left`, `bottom-right`, etc.) sets which corner offsets are measured from.
- **Offset X / Y** — pixels from the anchor side.
- **Max width** — caps the item's width so long text wraps instead of overflowing.
- **Stack with adjacent siblings** — adjacent flagged items at the same anchor merge into one flex-row-wrap container. Items go inline when there's room, wrap to vertical when not. The first flagged item's anchor + offsets define the stack position; later items inherit.
- **Stack row gap** — vertical gap between rows once a stack wraps. Defaults to 24 px (deliberately bigger than line-height so paragraph separation stays visible on mobile).

### Fluid typography

`src/utils/fluidScale.js` exposes a single `fluidScale(basePx, { mobileRatio = 0.85 })` helper. Used for both nav link sizes and hero overlay text. Pattern: `clamp(base × mobileRatio, base/10 vw, base)` — desktop ceiling at the CMS-set value, mobile floor at 85%.

## Key Files

- `src/data/siteConfig.js` — Compatibility shim. Components still `import { siteConfig }` but the values stream from `src/sanity/loader.js`.
- `src/data/films.js` / `src/data/photoProjects.js` — Static content (future Stage 4/5 will move to CMS).
- `src/components/ui/HeroSection.jsx` — Fullscreen sticky video hero. Reads `heroOverlay.items[]` from CMS for the floating text overlay.
- `src/components/films/FilmModal.jsx` — Shared fullscreen Vimeo overlay (used by both film detail and showreel).
- `src/components/ui/PersistentHeroText.jsx` — Split-color artist name overlay (white on video, black on background).
- `tailwind.config.js` — Custom design tokens all backed by CSS variables from `index.css`.

## Design System

- Fonts: `font-header` (Helvetica Now Display), `font-title` (Helvetica Now Display), `font-body` (Helvetica Now Text)
- Colors: All via CSS variables (`--color-background`, `--color-text`, etc.)
- Custom sizes: `text-hero` (140px), `text-subheading`
- Import alias: `@/` maps to `src/` (configured in vite.config.js)

## Gotchas

- Use Flexbox for all component layouts — never use `position: absolute` to place sibling elements (text, images, videos) side by side. Use `flex-row` / `flex-row-reverse` for left/right alternation and `gap` for guaranteed spacing.
- Use `svh` units (not `vh`) for mobile viewport heights — avoids iOS address bar issues.
- Hero video (`/public/videos/hero-teaser.mp4`) is a large file; original content in `content/` is gitignored.
- Bottom-aligned elements use absolute positioning with `bottom-[10vh]` + `left-0 right-0 z-0`.
- Global `prefers-reduced-motion: reduce` in `index.css` disables all animations site-wide.
- Film detail uses modal overlay (FilmModal), not a separate route.
- Photo images must be in `public/photos/` — paths in `photoProjects.js` use `/photos/...`.
- **Playwright tests on `/` and `/photos`** must use `locator.dispatchEvent('click')` instead of `.click()` for elements below the fold. The desktop smooth-scroll system sets `body { overflow: hidden }` and translates the content via CSS transform, so Playwright's actionability check (and even `force: true`) reports "Element is outside of the viewport." `dispatchEvent` fires the React onClick directly without the actionability check. See `tests/e2e/featured-photo-cards.spec.js` for an example.
- The Sanity Studio bundle is huge (~5MB gzipped 1.7MB). It's code-split via `React.lazy` so the public site bundle stays small. Never `import 'sanity'` from a non-Studio file.
- **`/about` and `/contact` routes were removed** in the CMS migration. Contact info now lives in the CMS hero overlay items.
