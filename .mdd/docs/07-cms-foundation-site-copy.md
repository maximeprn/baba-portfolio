---
id: 07-cms-foundation-site-copy
title: CMS Foundation + Site Copy Migration (Stage 1 of 6)
edition: BABA Portfolio
depends_on: []
source_files:
  - sanity.config.js
  - sanity/schemas/index.js
  - sanity/schemas/siteSettings.js
  - sanity/schemas/heroOverlay.js
  - sanity/schemas/showreel.js
  - sanity/desk/structure.js
  - src/sanity/client.js
  - src/sanity/loader.js
  - src/pages/Studio.jsx
  - src/App.jsx
  - src/components/ui/HeroSection.jsx
  - src/data/siteConfig.js
  - src/data/cms.json
  - scripts/fetch-cms-content.mjs
  - .env.example
  - package.json
routes:
  - /admin (Sanity Studio, embedded)
models:
  - sanity:siteSettings (singleton)
  - sanity:heroOverlay (singleton)
  - sanity:showreel (singleton)
test_files:
  - tests/e2e/cms-studio-loads.spec.js
  - tests/e2e/cms-hero-overlay.spec.js
  - tests/e2e/cms-site-copy.spec.js
  - tests/e2e/removed-pages-404.spec.js
known_issues: []
---

# 07 — CMS Foundation + Site Copy Migration

## Purpose

Establish Sanity as the project's headless CMS so Basile can edit site-wide copy, hero overlay content, contact info, social links, and SEO metadata without involving a developer. This is Stage 1 of a 6-stage CMS rollout. Future stages will migrate films, photos, hero media, and polish.

## Architecture

The site remains a static Vite build. Sanity content is fetched at build time, written to `src/data/cms.json`, and bundled into the static output. Publishing in the Studio fires a Sanity webhook that hits a Vercel deploy hook, triggering a rebuild.

```
Basile edits content in Sanity Studio
        │
        ├─ embedded at  basiledeschamps.com/admin   (primary)
        └─ hosted  at   basiledeschamps.sanity.studio (backup)
        ▼
   Click "Publish"
        ▼
Sanity webhook → Vercel deploy hook
        ▼
Vercel rebuild runs `scripts/fetch-cms-content.mjs`
        ▼
Content baked into static bundle. Live in ~30 seconds.
```

**Why build-time fetch (not runtime):**
- Site stays static — fast, cheap, simple.
- No API/auth complexity at the client.
- Last successful fetch is committed to `src/data/cms.json`, so the build never fails when Sanity is briefly unreachable.

**Where things live:**
```
/sanity.config.js          # Sanity Studio config (embeds at /admin)
/sanity/schemas/           # Schema definitions
/sanity/desk/structure.js  # Custom singletons UI
/src/sanity/               # Runtime client + loader for the site
/src/data/cms.json         # Build-time content snapshot (tracked in git)
/scripts/fetch-cms-content.mjs  # Runs before vite build
```

## Data Model

Three singleton documents in Sanity. Singletons are enforced via custom desk structure so Basile can't accidentally create duplicates.

### `siteSettings` (singleton)

| Field | Type | Default | Notes |
|---|---|---|---|
| `artistName` | string | "Basile Deschamps" | |
| `artistFirstName` | string | "Basile" | |
| `artistLastName` | string | "Deschamps" | |
| `seoTitle` | string | "Basile Deschamps \| Film & Photography" | Browser tab title |
| `seoDescription` | text | (current value) | Meta description |
| `seoKeywords` | array<string> | (current values) | |
| `ogImage` | image (Sanity asset) | (uploaded) | Open Graph share image |
| `siteUrl` | url | "https://basiledeschamps.com" | |
| `socialInstagram` | url \| null | (current) | |
| `socialVimeo` | url \| null | (current) | |
| `socialLinkedin` | url \| null | null | |
| `socialTwitter` | url \| null | null | |
| `socialBehance` | url \| null | null | |
| `navActiveStyle` | enum('pill', 'bold-larger') | 'bold-larger' | |
| `footerCopyright` | string | (current) | Year is still appended in render |
| `footerShowSocial` | boolean | true | |

**Hidden from Basile (Stage 1):** none — all of these are content/copy.

### `heroOverlay` (singleton)

| Field | Type | Notes |
|---|---|---|
| `items` | array<`heroOverlayItem`> | Ordered list, rendered absolutely on top of the hero |

`heroOverlayItem` object:

| Field | Type | Required | Notes |
|---|---|---|---|
| `text` | string | yes | What displays |
| `anchor` | enum<9 corners> | yes | `top-left` / `top-center` / `top-right` / `middle-left` / `middle-center` / `middle-right` / `bottom-left` / `bottom-center` / `bottom-right` |
| `offsetX` | number (px) | no, default 0 | Horizontal offset from the anchor, towards the inside of the hero |
| `offsetY` | number (px) | no, default 0 | Vertical offset from the anchor, towards the inside of the hero |
| `size` | enum('body', 'contact') | yes, default 'body' | `body` = bio styling (text-lg md:text-[28px]); `contact` = uppercase tracking-wide (text-base md:text-[25px]) |
| `link` | object \| null | no | `{ type: 'email' \| 'phone' \| 'url', value: string }` |
| `mobileVisible` | boolean | no, default true | Hide item on screens < 768px if false |

Seed content (matches current hardcoded values):
1. `{ text: "Basile Deschamps is a film director and photographer based in Paris.", anchor: 'top-left', offsetX: 32, offsetY: 100, size: 'body' }`
2. `{ text: "Selected clients include Salomon, Parel Studios, Lorette Colé Duprat, On, Asics, Pag, Specialized, Veja.", anchor: 'top-left', offsetX: 32, offsetY: 145, size: 'body' }`
3. `{ text: "+33 (0)6 17 91 79 89", anchor: 'bottom-left', offsetX: 32, offsetY: 40, size: 'contact', link: { type: 'phone', value: '+33617917989' } }`
4. `{ text: "basiledeschamps3@gmail.com", anchor: 'bottom-left', offsetX: 240, offsetY: 40, size: 'contact', link: { type: 'email', value: 'basiledeschamps3@gmail.com' } }`

### `showreel` (singleton)

| Field | Type | Notes |
|---|---|---|
| `vimeoUrl` | url | Player URL ("https://player.vimeo.com/video/989542038") |
| `videoFile` | string | Path under `/videos/` ("/videos/Showreel 2021.mp4"). Still passes through `shortVideo()` mapper. |
| `posterImage` | image \| null | Currently unused; reserved for fallback |

## API Endpoints

No runtime HTTP endpoints. CMS data is fetched at build time.

**Routes added:**
- `/admin/*` — serves embedded Sanity Studio. Public route, but Studio itself enforces Google OAuth.

**Routes removed:**
- `/about` — page deleted
- `/contact` — page deleted

**Build script:**
- `scripts/fetch-cms-content.mjs` — runs `npx sanity dataset export` equivalent via `@sanity/client`. Fetches the 3 singletons + downloads `ogImage` asset URL. Writes `src/data/cms.json`. Fails loudly only on first run; subsequent failures fall back to the existing committed snapshot.

## Business Rules

1. **Singletons must be enforced** — Sanity's desk structure must prevent Basile from creating duplicate `siteSettings`, `heroOverlay`, or `showreel` documents.
2. **Last-good snapshot** — `src/data/cms.json` is committed. Build script writes over it. Build never fails because Sanity is unreachable; instead it warns and uses the committed snapshot.
3. **Hero overlay rendering rules:**
   - Items render absolutely within the hero container.
   - `anchor` resolves to CSS positioning (e.g., `top-left` → `top:0; left:0;`).
   - `offsetX`/`offsetY` are applied as additional inset on the anchor sides.
   - `link.type='email'` renders `<a href="mailto:{value}">`.
   - `link.type='phone'` renders `<a href="tel:{value}">` (sanitize: strip spaces, parens, dashes).
   - `link.type='url'` renders `<a href={value} target="_blank" rel="noopener noreferrer">`.
   - `size='body'`: `font-header font-medium leading-tight tracking-[-0.01em] text-lg md:text-[28px]`.
   - `size='contact'`: `font-header font-medium tracking-[0.15em] text-base md:text-[25px]`, uppercase for phone numbers only (detect: `link.type === 'phone'`).
   - `mobileVisible=false` adds `hidden md:block`.
4. **Image handling** — `ogImage` is uploaded into Sanity's asset CDN. The build script resolves it to a public URL stored in `cms.json`.
5. **Auth model** — Maxime (you) is owner of the Sanity project. Basile is invited as `editor`. Studio auth uses Google OAuth.
6. **Webhook setup (manual, one-time)**:
   - Create Vercel Deploy Hook in Project Settings → Git → Deploy Hooks (name: "Sanity publish").
   - Add Sanity Webhook in Sanity Manage → API → Webhooks: dataset=production, trigger on create/update/delete of any of the 3 singletons, calls Vercel URL.
7. **Page cleanup**: `src/pages/About.jsx`, `src/pages/Contact.jsx`, and their `<Route>` declarations in `src/App.jsx` are deleted. `siteConfig.js` comment references to the About page are removed.

## Dependencies

None — this stage establishes the foundation. Future stages depend on this one.

## Known Issues

(populated during implementation)
