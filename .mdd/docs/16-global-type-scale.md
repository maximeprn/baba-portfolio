---
id: 16-global-type-scale
title: Global Type & Spacing Scale (+12.5%)
edition: BABA Portfolio
depends_on:
  - 02-design-system
  - 14-hero-overlay-sizing
source_files:
  - src/styles/index.css
  - src/components/ui/heroOverlayLayout.js
  - src/components/ui/TitleSection.jsx
routes: []
models: []
test_files: []
known_issues: []
---

# 16 — Global Type & Spacing Scale (+12.5%)

## Purpose

Make every text size and every spacing value on the site ~12.5% larger
(×1.125, "one step up") — so the site reads bigger and more generous,
with bigger text *and* proportionally bigger gaps so nothing looks
cramped. Navigation **text** is the one exception (it keeps its own
CMS-controlled sizes); navigation spacing scales with everything else.

## Architecture

The site's type and spacing are almost entirely **rem-based** (Tailwind's
`text-*` and spacing utilities, plus the `--text-*` / `--spacing-*`
custom properties in `index.css`). rem is relative to the root font size,
so a single lever scales them all:

```
  html { font-size: 16px → 18px }     ← +12.5%, one lever
       │
       ├─ every Tailwind text-* / p-* / m-* / gap-* / w-* / h-* (rem)   ×1.125
       ├─ every --text-* and --spacing-* custom property (rem)          ×1.125
       └─ rem insets (e.g. the hero overlay's fixed-inset positions)    ×1.125
```

What does **not** follow the rem root, and is handled separately:

| Thing | Unit | Treatment |
|---|---|---|
| Page max-widths (`--max-width-container` / `--max-width-content`, `--nav-height`) | was rem | **Pinned to px** — so the canvas stays a fixed width and the scale-up reads as "bigger type", not "zoomed page". |
| Hero overlay text (`SIZE_SCALE`, `heroOverlayLayout.js`) | px | Base values ×`TYPE_SCALE` (1.125) in code. |
| `TitleSection` heading (`text-[34px]`) | px (arbitrary) | Bumped to `text-[38.25px]`. |
| Nav link text (`fluidScale(navLinkSize)`) | px | Untouched — naturally unaffected by the rem root. |
| Viewport units (`svh` / `vw` / `vh`), fixed px, `tracking-[…px]` | — | Untouched by design. |

## Data Model

N/A — a pure CSS / layout-token change, no CMS and no persistence.

## API Endpoints

N/A.

## Business Rules

- **Scale factor:** ×1.125 (the `16 → 18px` root, "one step up"). The
  hero overlay's `TYPE_SCALE` constant carries the same 1.125.
- **What grows:** all rem-based text and spacing site-wide — body, card
  titles / metadata / descriptions and the gaps between them, section
  headings, footer, collapsed bands, hero overlay text, etc.
- **Canvas stays fixed:** `--max-width-container` (1440px),
  `--max-width-content` (730px) and `--nav-height` (80px) are pinned to
  px. Without this the +12.5% would scale the layout box too and the net
  effect would be a uniform zoom rather than visibly bigger type.
- **Nav text excluded:** nav links are sized by `fluidScale()` on the
  CMS `navLinkSize` / `navLinkActiveSize` px values — px-based, so the
  rem-root bump does not touch them. Nav *spacing* (`h-20`, `gap-*`,
  `px-*` — all rem) does scale ×1.125, by design.
- **Line-height stays proportional:** Tailwind's rem line-heights scale
  with the root; unitless ones (`leading-none`, body `1.6`) are ratios,
  unaffected. Letter-spacing in px (`tracking-[1.8px]`) is left as-is.
- **Retired code untouched:** `PersistentHeroText.jsx` (the `text-[9vw]`
  wordmark) is dead code — imported nowhere — so it was not scaled.

## Dependencies

- **02-design-system** — owns the `--text-*` / `--spacing-*` scale and
  layout-constant tables; updated to the 18px-root values.
- **14-hero-overlay-sizing** — `SIZE_SCALE` lives there; its base values
  now carry the ×1.125 `TYPE_SCALE`.

## Verification

Manual:
1. `npm run dev`. Text across the whole site (cards, body, footer, hero
   overlay, section titles) is visibly ~12.5% larger, and the gaps
   between card title / subtitle / description grow with it (no cramping).
2. Nav link text is unchanged in size.
3. The content column is the same width as before — the change reads as
   bigger type, not a zoom.

Automated:
- No new tests — this is a global visual scale. The existing E2E suite
  (`section-title-hover`, `collapsed-film-cards`, `featured-photo-cards`,
  `homepage`) must stay green: the behaviors it checks (hover, click,
  expand/collapse, scroll) are size-independent.

## Known Issues

(empty for new feature — to be populated by future audits)
