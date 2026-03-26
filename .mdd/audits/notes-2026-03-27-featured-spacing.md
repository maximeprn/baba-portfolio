# Audit Notes — Featured Film Card Spacing
**Date:** 2026-03-27

### FeaturedFilmCard.jsx

**Files read:** src/components/films/FeaturedFilmCard.jsx, src/styles/index.css, tailwind.config.js

**Layout structure (mobile < 1024px):**
- Article: `px-4` (16px each side)
- Flex stacks vertically (`flex-col`)
- Video: full width
- Text: full width minus 32px total padding
- Text div has no own horizontal padding on mobile

**Layout structure (desktop ≥ 1024px):**
- Article: `lg:px-0` (no outer padding)
- Flex goes horizontal (`lg:flex-row` / `lg:flex-row-reverse`)
- Video: 55% width (from CSS custom prop `--video-width`)
- Text: remaining 45%
- Text div: `lg:px-[8rem]` = **128px padding each side = 256px total**

**Calculated text content widths at breakpoints:**

| Viewport | Video (55%) | Text col (45%) | Text padding | **Usable text width** |
|----------|-------------|----------------|--------------|----------------------|
| 1024px   | 563px       | 461px          | 256px        | **205px** ← too narrow |
| 1280px   | 704px       | 576px          | 256px        | **320px** ← still tight |
| 1440px   | 792px       | 648px          | 256px        | **392px** ← acceptable |
| 1920px   | 1056px      | 864px          | 256px        | **608px** ← good |

**Finding:** At the `lg` breakpoint (1024px), text has only 205px of usable width. Paragraph text at `text-xs`/`text-sm` crammed into 205px yields ~4-5 words per line, which is unreadable.

**Additional finding (mobile/tablet 768-1024px):**
- Stacked layout with only `px-4` (16px padding). On a 768px tablet, text is 736px wide — no issue with narrowness, but the minimal padding gives no visual margin for the text block.
