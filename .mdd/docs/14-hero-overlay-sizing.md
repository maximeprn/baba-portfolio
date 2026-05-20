---
id: 14-hero-overlay-sizing
title: Hero overlay — per-screen sizing + simplified controls
edition: BABA
depends_on: [13-hero-overlay-mobile]
source_files:
  - sanity/schemas/heroOverlay.js
  - src/components/ui/heroOverlayLayout.js
  - src/components/ui/HeroOverlay.jsx
  - src/sanity/loader.js
routes: []
models:
  - heroOverlay
test_files:
  - tests/hero-overlay-sizing.spec.js
  - tests/e2e/hero-overlay-mobile.spec.js
known_issues: []
---

# 14 — Hero overlay: per-screen sizing + simplified controls

## Purpose

Evolves the hero overlay ([13-hero-overlay-mobile](13-hero-overlay-mobile.md))
in three ways, all aimed at making it both more capable **and** easier for a
non-technical editor (Basile) to use:

1. **Per-screen text size** — keep the automatic shrink, *or* turn it off and
   set the size for phone / tablet / computer by hand.
2. **Automatic gap** — the vertical space between two stacked texts is now
   proportional to the text size, so it never looks bloated for one-liners.
   The manual gap setting is removed.
3. **Simpler Studio** — pixel nudge offsets are removed (positions are fixed),
   settings are split into Basics + a collapsed Advanced section, and every
   label and help text is rewritten in plain, non-technical language.

## Architecture

```
heroOverlayLayout.js   pure helpers
  ├─ viewportTier(width)         → 'phone' | 'tablet' | 'desktop'
  ├─ resolveOverlayFontSize(item, tier) → CSS font-size string
  ├─ anchorToStyle(anchor)       → fixed-inset CSS position (no offsets)
  └─ stackRowGapPx(item)         → text-proportional gap

HeroOverlay.jsx        components
  ├─ useViewportTier()           → re-renders the desktop tree on resize
  ├─ HeroOverlayText({item,tier})→ size resolved per tier
  ├─ HeroOverlayMobile           → tier is always 'phone'
  └─ HeroOverlayDesktop          → tier is 'tablet' or 'desktop' (hook)
```

### Breakpoints

| Tier | Width | Overlay layout |
|---|---|---|
| phone | < 768px | mobile auto-safe zones (doc 13) |
| tablet | 768–1023px | desktop free layout |
| desktop | ≥ 1024px | desktop free layout |

768 / 1024 match the project's existing breakpoints (CLAUDE.md). The overlay
*layout* still switches once, at 768px; the *size* can change at all three.

## Data Model

`heroOverlay` singleton — `items[]` of `heroOverlayItem`.

### Fields (after this change)

**Basics (always visible):**

| Field | Studio label | Type | Notes |
|---|---|---|---|
| `text` | Text | string | required |
| `anchor` | Position | string | 6 options (left/right × top/middle/bottom) |
| `size` | Style | string | `body` \| `contact` — casing/tracking only |
| `textSize` | Size | string | `xs…xl` — the computer (base) size |
| `autoShrinkSmallScreens` | Shrink automatically on phone & tablet | boolean | default `true` |
| `phoneSize` | Phone size | string | `xs…xl`, shown only when auto-shrink is **off** |
| `tabletSize` | Tablet size | string | `xs…xl`, shown only when auto-shrink is **off** |

**Advanced (collapsed fieldset):** `link`, `maxWidth`, `stackWithSiblings`
(label "Group with the text above"), `mobileVisible` (label "Show on phones").

**Hidden (retained, not rendered, not shown in Studio):** `offsetX`,
`offsetY`, `stackRowGap`. Kept as `hidden: true` fields purely so existing
documents don't show "unknown field" warnings — the renderer ignores them.

### Backwards compatibility (no migration)

Existing items have `textSize` but no `autoShrinkSmallScreens` / `phoneSize` /
`tabletSize`. `autoShrinkSmallScreens` defaults to `true`, so a missing value
means "auto" — identical to today's behaviour. `offsetX/offsetY/stackRowGap`
values still in documents are simply ignored. No write script needed.

## Business Rules

### Size resolution — `resolveOverlayFontSize(item, tier)`

- **Auto mode** (`autoShrinkSmallScreens !== false`):
  - `desktop` / `tablet` → `fluidScale(basePx)` — the existing clamp ramp.
  - `phone` → `fluidScale(basePx, { mobileRatio: OVERLAY_TEXT_MOBILE_RATIO })`
    (0.75) — the deeper phone shrink from doc 13.
- **Manual mode** (`autoShrinkSmallScreens === false`):
  - `desktop` → `textSize`; `tablet` → `tabletSize`; `phone` → `phoneSize`.
  - Each is a fixed px (no fluid ramp) — a clean step at 768 and 1024.
  - A missing per-screen value falls back to the base `textSize` px.
- `basePx` resolves from `textSize`, with the doc-13 legacy fallback
  (`body → 28`, `contact → 25`).

### Positioning — fixed insets (no offsets)

`anchorToStyle(anchor)` returns position from constants, not CMS values:

- Horizontal inset: `2.5rem` (40px) from the anchored side.
- Top inset: `9rem` (144px) — clears the 80px nav with comfortable room.
- Bottom inset: `2.5rem` (40px).
- Middle anchor: vertically centred.

These reproduce the previous look (bio ≈ 145px top, contact ≈ 40px) without an
editable knob. `rem` is used because these are fixed, root-relative spacings —
consistent with the Tailwind scale and respectful of browser font settings.

### Stacked-text gap — proportional, automatic

The gap between items in a desktop stack is `round(basePx × 0.55)` px —
proportional to the stack's text size (`em`-style: it tracks the *text*, not
the page root). For `md` (25px) that is ~14px: tight enough for two one-liners,
still clearly more than the intra-paragraph line spacing when text wraps. There
is no editable gap field.

### Unchanged from doc 13

Mobile auto-safe zones, the nav-safe top zone, the ResizeObserver auto-shrink
safety net, `mobileVisible`, and the left/right-only anchor set all carry over.

## Dependencies

- **13-hero-overlay-mobile** — mobile auto-safe layout, `SIZE_SCALE`,
  `OVERLAY_TEXT_MOBILE_RATIO`, `resolveTextSizePx`, the `variant` split.

## Known Issues

- Manual mode steps hard at 768px and 1024px (by design — discrete per-screen
  sizes). A browser resize across those points shows a size jump.
- E2E covers auto mode (the live CMS content is all-auto); manual-mode size
  resolution is covered by the pure-logic test instead.
