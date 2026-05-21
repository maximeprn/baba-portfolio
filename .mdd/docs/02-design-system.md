---
id: 02-design-system
title: BABA Portfolio Design System
edition: BABA
depends_on: []
source_files:
  - src/styles/index.css
  - tailwind.config.js
  - src/utils/fluidScale.js  # shared clamp() helper for nav links + hero overlay text
  - src/data/siteConfig.js   # compatibility shim — most fields stream from src/sanity/loader.js (see doc 07)
  - public/fonts/
test_files: []
known_issues:
  - "src/data/siteConfig.js is no longer the source of truth — it's a compatibility shim around src/sanity/loader.js (see doc 07). A few fields are still hardcoded there: artist.tagline, artist.shortBio, artist.title, contact.{email,phone,location}, navigation arrays. Components import siteConfig with no awareness of the CMS shift."
  - "Fluid typography helper at src/utils/fluidScale.js — added 2026-05-19 (PR #11 era). Used by Navigation.jsx (nav link sizes) and HeroSection.jsx (hero overlay text sizes + positional offsets). Pattern: clamp(base × mobileRatio, base/10 vw, base). mobileRatio = 0.85 for text, 0.4 for hero overlay offsets."
---

# 02 — BABA Portfolio Design System

> Design language for Basile Deschamps' portfolio (sports photographer & filmmaker, Paris).
> Tagline: **"Reinventing the Frame"**.

## Purpose

Codify the visual + interaction language of the BABA portfolio so it can be fed to design tooling (Claude Design, Figma libraries, generative design assistants) and reused across future surfaces (CMS, press kit, mobile app). The aesthetic is **editorial minimalism**: monochrome, oversized type, cinematic full-bleed media, deliberate motion.

## Brand

- **Subject:** Basile Deschamps — Sports Photographer & Filmmaker, Paris, France
- **Tagline:** Reinventing the Frame
- **Bio:** Sports photographer and filmmaker exploring the poetry of athletic movement
- **Voice:** Sparse, poetic, confident. Few words; lets imagery do the work. No marketing fluff, no exclamation marks. Capitalize titles in **ALL CAPS** with wide letter-spacing.
- **Mood references:** Editorial fashion magazines, Wim Wenders cinematography, brutalist web design, agency portfolios from the late-2010s reduction era.

## Color Tokens

All colors are CSS variables in `src/styles/index.css:99-121`. Strict monochrome — no chromatic accents.

| Token | Variable | Hex | Tailwind | Usage |
|-------|----------|-----|----------|-------|
| Background | `--color-background` | `#ffffff` | `bg-background` | Page background, cards |
| Text | `--color-text` | `#000000` | `text-primary` | Body, headings, hero name |
| Muted | `--color-text-muted` | `#666666` | `text-muted` | Captions, credits, secondary text |
| Accent | `--color-accent` | `#333333` | `text-accent` / `hover:text-accent` | Hover states, active link |
| Border | `--color-border` | `#000000` | `border-border` | Dividers, hairlines |

**Rules:**
- Never introduce a chromatic color outside imagery. Do not add brand reds/blues.
- Inverse (white-on-black) is allowed only when text overlays imagery (see PersistentHeroText, FloatingGalleryHero brightness-adaptive overlay).
- Hover state: drop opacity to ~50% OR shift color from `text-primary` → `text-accent` (`#333`). Never use a 3rd hue.

## Typography

### Families

Files in `public/fonts/`. All declared in `index.css:34-82` with `font-display: swap`.

| Token | Variable | Family | Weights |
|-------|----------|--------|---------|
| Header | `--font-header` | Helvetica Now Display | 400, 500, 700 |
| Title | `--font-title` | Helvetica Now Display | 400, 500, 700 |
| Body | `--font-body` | Helvetica Now Text | 400, 500, 700 |

Fallback chain: `'Helvetica Neue', 'Helvetica', 'Arial', sans-serif`.

Other font folders exist in `/public/fonts/` (`AmericanTypewriter`, `Helvetica Now Micro`, `StepsMono`) but are **not active** — kept for experimentation. Treat them as ineligible unless explicitly adopted.

### Scale

Defined in `index.css` (`--text-*` custom properties). The site root font
size is **18px** — a +12.5% global type scale (see
[16-global-type-scale](16-global-type-scale.md)); the px column is the
rendered size at that root.

| Token | rem | px | Usage |
|-------|-----|-----|-------|
| `--text-xs` | 0.75rem | 13.5 | Small labels |
| `--text-sm` | 0.875rem | 15.75 | Captions, credits |
| `--text-base` | 1rem | 18 | Body text default |
| `--text-lg` | 1.125rem | 20.25 | Slightly larger body, project titles |
| `--text-xl` | 1.25rem | 22.5 | Subheadings |
| `--text-2xl` | 1.5rem | 27 | Section headings |
| `--text-3xl` | 1.875rem | 33.75 | Page titles |
| `--text-4xl` | 2.25rem | 40.5 | Large headings |
| `--text-subheading` | 1.25rem | 22.5 | "REINVENTING THE FRAME" tagline |
| `--text-hero` | 8.75rem | **157.5** | _Retired._ Originally for the BASILE DESCHAMPS hero wordmark; the hero was redesigned (commit `0e6bcbb`) to a bio + contact overlay. Token still defined in `index.css` but no longer consumed. Slated for removal. |

### Letter-spacing & weight

- All-caps titles use **`tracking-wide` (0.15em)** or **`tracking-wider` (0.2em)**.
- Hero name (`text-hero`) is rendered at weight 700, line-height 1.
- Body line-height: 1.6. Headings: 1.2.

### The hero expression

The site has no logomark, badge, or icon. The canonical brand expression is the **`HeroBioOverlay`** rendered on top of the full-bleed hero media (showreel video on `/`, flashing photo slideshow on `/photos`). It places two elements over the imagery, both in white Helvetica Now Display:

- **Top-left** — bio statement + selected clients, on two lines. Desktop uses 28px with `whitespace-nowrap` (the long client list intentionally bleeds past the right edge of the viewport on narrower screens — read as a marquee, not a wrap). Mobile scales to `text-lg` and is allowed to wrap.
- **Bottom-left** — phone number + email, in tracked uppercase Helvetica Now Display. Desktop is 25px in a horizontal row; mobile stacks vertically at `text-base`.

`HeroBioOverlay` is exported from `src/components/ui/HeroSection.jsx` and reused unchanged by `FloatingGalleryHero.jsx`. Treat **this overlay** — bio over imagery — as the canonical brand expression. Any new hero surface should reuse it, not introduce a separate wordmark.

> Historical note: the original hero used a 140px **BASILE DESCHAMPS** wordmark via a `PersistentHeroText.jsx` component (split-color over imagery vs background, masked with clip-path). That component still exists in the repo as of 2026-05-05 but is no longer imported anywhere; treat it as retired pending deletion. The `--text-hero` (140px) token is similarly unused.

## Spacing & Layout

### Spacing scale (`index.css`)

In rem, so it grows with the 18px type scale (see
[16-global-type-scale](16-global-type-scale.md)); px is at the 18px root.

| Token | rem | px |
|-------|-----|-----|
| `--spacing-xs` | 0.25 | 4.5 |
| `--spacing-sm` | 0.5 | 9 |
| `--spacing-md` | 1 | 18 |
| `--spacing-lg` | 1.5 | 27 |
| `--spacing-xl` | 2 | 36 |
| `--spacing-2xl` | 3 | 54 |
| `--spacing-3xl` | 4 | 72 |
| `--spacing-section` | 5 | 90 |
| `--spacing-content` | 2.5 | 45 |

### Layout constants

Pinned in **px** (not rem) so the page canvas stays a fixed width while
the type scale grows — see [16-global-type-scale](16-global-type-scale.md).

| Token | Value | Note |
|-------|-------|------|
| `--max-width-container` | 1440px | Top-level page container |
| `--max-width-content` | 730px | Hero image / text column |
| `--nav-height` | 80px | Sticky top nav |

### Breakpoints

- **Mobile:** ≤ 767px (no scroll-driven animations)
- **Tablet/Desktop:** ≥ 768px (smooth scroll, scroll-linked transforms enabled)
- **Large desktop:** ≥ 1024px (different initial scale on hero animation)
- **XL desktop:** ≥ 1280px / 1536px (film-card gap increases)

### Viewport units

Always use **`svh`** (small viewport height) not `vh` for mobile heights — avoids iOS address-bar jumps. The desktop hero adds an intentional `+150px` to its height (`100svh - 5rem + 150px`) to enable scroll-to-reveal of the next section.

## Motion

### Transition tokens (`index.css:200-202`)

| Token | Value |
|-------|-------|
| `--transition-fast` | 150ms ease |
| `--transition-normal` | 300ms ease |
| `--transition-slow` | 500ms ease |

### Easing

- **Default:** `ease` (used by all token transitions above).
- **Custom:** `cubic-bezier(0.4, 0, 0.2, 1)` — applied to the `CollapsedFilmCard` shutter (1200ms open / 600ms close, see the `OPEN_TRANSITION` / `CLOSE_TRANSITION` constants at the top of the file). This is the signature easing for any future "reveal/expand" surfaces.

### Animations (`tailwind.config.js:100-114`)

- `fade-in` (0.6s ease-out): opacity 0 → 1, translateY -10px → 0
- `fade-up` (0.6s ease-out): opacity 0 → 1, translateY 20px → 0

### Component motion specifics

- **CollapsedFilmCard shutter** — height open: 1200ms `cubic-bezier(0.4, 0, 0.2, 1)` (deliberate reveal); height close: **600ms** same curve (intentionally 2× faster than open — snappy dismissal); the collapsed-text overlay slides in over the last 500ms of the close so it lands exactly when the height transition ends; collapsed-state hover `opacity`: 150ms (reuses `--transition-fast`).
- **Photo slideshow (Photos hero)** — random **500–2000ms** intervals between hard-cut frames. No transition between frames.
- **Hero scale/translate** — scroll-linked transforms keyed to `scrollY / window.innerHeight` ratios; never fixed pixel thresholds.

### Scroll behavior

- Desktop: custom **Lenis-style smooth scroll** via `SmoothScrollContext.jsx` — RAF easing, scroll position shared via `addScrollListener`.
- Mobile: native scroll, **no scroll-linked motion** of any kind.

### Reduced motion

`@media (prefers-reduced-motion: reduce)` (`index.css:475-484`) forces `animation-duration: 0.01ms` and `transition-duration: 0.01ms` site-wide. The slideshow degrades to a single static photo.

## Components

### Layout
- **Navigation** (`Navigation.jsx`) — sticky top nav, three columns (left/center/right) populated from `siteConfig.navigation`. Active route is differentiated by larger size + opacity.
- **Layout** (`Layout.jsx`) — wraps Navigation + content + Footer.
- **Footer** (`Footer.jsx`) — copyright + social links.

### UI primitives
- **HeroSection** — full-bleed sticky showreel video hero with mute toggle. Renders `HeroBioOverlay` on top. Separate mobile/desktop render paths. Used on the Films homepage (`/`).
- **HeroBioOverlay** — exported from `HeroSection.jsx`. Top-left bio + selected clients, bottom-left phone + email. The canonical brand expression — see *Typography > The hero expression*. Reused by `FloatingGalleryHero` so the Photos hero matches the Films hero.
- **TitleSection** — section title block.
- **Divider** — 1px hairline (`--color-border`).
- **Lightbox** — fullscreen photo viewer with body-overflow lock + arrow-key navigation. Used by `PhotoProject` only.
- **PersistentHeroText** _(retired)_ — split-color BASILE DESCHAMPS overlay using clip-path masks. File still in `src/components/ui/PersistentHeroText.jsx` but no consumers as of 2026-05-05.

### Films
- **FilmCard** — alternating left/right text + 16:9 video (uses CSS `flex-row` / `flex-row-reverse`, never absolute positioning).
- **FeaturedFilmCard** — same as FilmCard but with prominent video, autoplay-on-visible.
- **CollapsedFilmCard** — single-row band that shutter-expands on click into a full `FeaturedFilmCard`; closes via a small X indicator at the bottom (revealed on hover) or by clicking the expanded card's whitespace. Hover state inverts to a black band with white text. Only one card may be expanded at a time. Full spec: `.mdd/docs/03-collapsed-film-cards.md`.
- **FilmModal** — fullscreen Vimeo iframe overlay with focus trap + Escape handler. Used by both film detail and showreel.

### Photos
- **FloatingGalleryHero** — flashing photo slideshow + adaptive black/white name overlay.
- **PhotoGrid** — masonry-ish grid with hover scale (`group-hover:scale-105`).
- **ProjectCard** — single project tile.

## Iconography

No icon library. UI relies on **type, hairlines, and imagery**. The few action affordances (close X, play arrow, gallery arrows) are inline SVG defined per-component. If icons are added later, prefer 1px stroke, no fills, monochrome.

## Accessibility

- WCAG 2.1 Level AA target.
- Focus trap on modal (`FilmModal.jsx:40-65`).
- `prefers-reduced-motion` honored globally.
- All-caps titles include letter-spacing for legibility.
- `aria-label` on icon-only buttons; alt text on all imagery.
- 44px minimum tap target on mobile (gap to fix in HeroSection mobile nav per audit M13).

## Conventions (rules of the codebase)

These are not visual tokens but they constrain how new design ideas should be implemented:

1. **Flex over absolute.** Never use `position: absolute` to place sibling text/image/video. Use `flex-row` / `flex-row-reverse` + `gap`.
2. **CSS variables for tokens.** All colors/fonts/sizes flow through `:root` vars. Tailwind classes reference them. Never hardcode a hex in a component.
3. **`svh` not `vh`.** Mobile heights use small viewport height units.
4. **Content in `siteConfig.js`.** Artist info, social links, nav, SEO — never hardcode in components.
5. **JSX, not TS.** This project uses JS/JSX (overrides global TypeScript default).
6. **No file > 300 LOC, no function > 50 LOC.** Split when exceeded.
7. **Smooth scroll only on desktop.** Mobile uses native scroll; do not animate against `window.scrollY` on mobile.

## Assets

### Fonts (active)

- `/public/fonts/HelveticaNow/HelveticaNowDisplay-{Regular,Medium,Bold}.otf`
- `/public/fonts/Helvetica Now Text/HelveticaNowText-{Regular,Medium,Bold}.otf`

### Imagery

- `/public/img/BABA PHOTOS/` — full photo portfolio (~116 .jpeg files)
- `/public/img/*.png` — curated stills used in featured cards (boxer, cyclist, judo, etc.)
- `/public/videos/Showreel 2021.mp4` — hero showreel

### Logo / wordmark

No logomark file and no wordmark. The brand identity on the homepage is the live `HeroBioOverlay` (bio + clients + contact) rendered over the showreel video / photo slideshow — see *Typography > The hero expression*. There is no favicon checked in. The `siteConfig.seo.ogImage` path (`/images/og-image.jpg`) is referenced but the asset is not present — known gap (audit 2026-05-05 H02-1).

## Dependencies

None — this is the source-of-truth design doc. All other features depend on it implicitly via Tailwind tokens.
