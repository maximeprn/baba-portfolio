---
id: 13-hero-overlay-mobile
title: Hero overlay — mobile auto-safe layout + named text sizes
edition: BABA
depends_on: [07-cms-foundation]
source_files:
  - src/components/ui/heroOverlayLayout.js
  - src/components/ui/HeroOverlay.jsx
  - src/components/ui/HeroSection.jsx
  - src/components/photos/FloatingGalleryHero.jsx
  - sanity/schemas/heroOverlay.js
  - src/sanity/loader.js
routes: []
models:
  - heroOverlay
test_files:
  - tests/e2e/hero-overlay-mobile.spec.js
known_issues: []
---

# 13 — Hero overlay — mobile auto-safe layout + named text sizes

## Purpose

The CMS-driven hero overlay (bio + client list + contact details, floating on
top of the Films video hero and the Photos slideshow hero) currently lets
Basile place text by raw pixel offsets. On phones those offsets are crushed to
40% of their desktop value, which drags top-anchored text **up into the nav
links**. There is also no real size control — `size` only offers two presets
mapped to hardcoded pixels.

This feature replaces the mobile behaviour with an **automatic, unbreakable
layout** and gives Basile a **named size picker**. On phones he never positions
anything by hand: the overlay arranges itself into a nav-safe top zone and a
bottom zone that physically cannot collide with the nav or with each other.

## Architecture

The overlay renderer is extracted out of the 466-line `HeroSection.jsx` into
its own module so each file stays under the 300-line quality gate and the
positioning maths is isolated:

```
src/components/ui/
├── heroOverlayLayout.js   # pure helpers + constants (no React)
└── HeroOverlay.jsx        # React components, exports HeroBioOverlay
```

`HeroBioOverlay` is consumed by both heroes. Each hero already renders it
**twice** — once inside its `hidden md:block` desktop wrapper, once inside its
`md:hidden` mobile wrapper — so the layout is selected by an explicit
`variant` prop rather than a runtime media query:

```
HeroSection.jsx (Films) ─┐
                         ├─ <HeroBioOverlay variant="desktop" />  → free anchor + offsets
FloatingGalleryHero.jsx ─┘   <HeroBioOverlay variant="mobile" />   → auto top/bottom zones
```

- **Desktop variant** — unchanged free positioning (anchor + offsetX/offsetY +
  stacks), with one addition: top-anchored items are clamped below a nav-safe
  line via CSS `max()`, so a small `offsetY` can never reach the nav.
- **Mobile variant** — ignores offsets/anchors-X/stacks entirely. Items are
  split into a **top zone** (anchored below the nav-safe line) and a **bottom
  zone** (anchored above the bottom edge), each a left-aligned flex column.
  A `ResizeObserver` measures both zones and auto-shrinks them with a CSS
  transform if their combined height would not fit.

## Data Model

`heroOverlay` singleton — `items[]` of `heroOverlayItem`. Changed fields:

| Field | Change | Notes |
|---|---|---|
| `size` | **Retitled** "Text style" | Key unchanged (no rename → no migration). Still `body` \| `contact`. Now controls **styling only** (casing + tracking), not pixels. |
| `textSize` | **New** | `xs` \| `sm` \| `md` \| `lg` \| `xl`. The named size picker. `initialValue: 'md'`. |
| `offsetX` / `offsetY` | Description updated | Marked **desktop-only** — ignored by the mobile layout. |
| `anchor` | Description updated | On mobile only the vertical half (Top/Middle/Bottom) is used; Middle joins the top zone. |
| `stackWithSiblings` / `stackRowGap` | Description updated | Marked **desktop-only**. |
| `mobileVisible` | Unchanged | The one mobile knob Basile keeps — hides an item from phones. |

### Named size scale

`SIZE_SCALE` (in `heroOverlayLayout.js`) maps each named size to a
desktop-ceiling pixel value, fed through `fluidScale()` so it scales down on
narrow viewports exactly like the nav links:

| Name | px | Note |
|---|---|---|
| `xs` | 18 | |
| `sm` | 22 | |
| `md` | 25 | matches the legacy `contact` preset |
| `lg` | 28 | matches the legacy `body` preset |
| `xl` | 34 | |

### Backwards compatibility (no migration)

Existing documents have `size: 'body' | 'contact'` and **no** `textSize`. The
field key `size` is deliberately **not renamed**, so existing data stays valid.
`resolveTextSizePx()` falls back for legacy items: `body → lg (28px)`,
`contact → md (25px)` — pixel-identical to today. `textSize` simply shows
empty in Studio until Basile picks a value; the site renders unchanged
meanwhile. No write script, no `SANITY_WRITE_TOKEN` needed.

## Business Rules

### Mobile auto-safe layout

- **Nav safe zone** — the top zone starts at `MOBILE_NAV_SAFE_PX` (104px = the
  80px `h-20` nav + 24px breathing room). No overlay text can render above it.
- **Zone assignment** — items with a `top-*` or `middle-*` anchor go to the top
  zone; `bottom-*` items go to the bottom zone. Document order is preserved.
- **Edge padding** — both zones inset `MOBILE_EDGE_PAD_PX` (16px) from the left
  and right screen edges; the bottom zone insets `MOBILE_BOTTOM_PAD_PX` (32px)
  from the bottom.
- **Alignment** — always left-aligned on mobile (the established design), one
  item per line. `stackWithSiblings` is desktop-only and has no mobile effect.
- **Auto-shrink** — if `topHeight + bottomHeight + MOBILE_MIN_ZONE_GAP_PX`
  exceeds the available height, both zones are scaled down with a CSS
  `transform` (origin top-left / bottom-left) until they fit, floored at
  `MOBILE_MIN_FIT_SCALE` (0.6) for readability. `offsetHeight` is used for
  measurement (transform-independent) so there is no measure/scale loop.
- **Hidden items** — `mobileVisible: false` items are excluded before zoning
  and measurement.
- **Hit-testing** — the mobile container is `pointer-events-none` so taps reach
  the video; only interactive links re-enable `pointer-events-auto`.

### Desktop layout

- Free anchor + offset positioning is unchanged.
- Top-anchored items (single and stacks) get `top: max(96px, <offset>)` so a
  low `offsetY` cannot push text under the nav. Purely additive — existing
  content (offsetY 145+) is unaffected.

### Size

- `textSize` (named) wins when set. Legacy items fall back style-aware
  (`body → lg`, `contact → md`).
- Mobile size is auto-derived: overlay text renders at `OVERLAY_TEXT_MOBILE_RATIO`
  (0.75) of its desktop size on phones — a deeper shrink than the nav's 0.85, so
  the mobile/desktop contrast is pronounced (`md` → ~19px on phones). Auto-shrink
  trims further if needed. No separate mobile size field.

## Dependencies

- **07-cms-foundation** — the `heroOverlay` singleton, build-time `cms.json`
  pipeline, and the `loader.js` fallback chain.

## Known Issues

- Auto-shrink is floored at `0.6`. With an extreme amount of text on an
  unusually short screen the zones could still meet after hitting the floor;
  Basile should trim with the "Show on mobile" toggle. Expected content (two
  short paragraphs + two contact lines) never triggers shrink on real phones.
- The bottom zone is full-width and left-aligned; the Films hero mute button
  sits bottom-right (`z-20`, above the overlay). A very long contact string on
  a very narrow phone could visually pass under the mute button — the button
  stays clickable regardless.
