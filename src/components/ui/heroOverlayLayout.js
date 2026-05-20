/**
 * Hero overlay — layout primitives.
 *
 * Pure helpers + constants shared by the desktop and mobile overlay
 * renderers in HeroOverlay.jsx. Kept React-free so the positioning and
 * sizing maths can be reasoned about (and tested) in isolation.
 *
 * See .mdd/docs/14-hero-overlay-sizing.md (and 13-hero-overlay-mobile.md).
 */
import { fluidScale } from '../../utils/fluidScale';

// ---------------------------------------------------------------------------
// Text size scale
// ---------------------------------------------------------------------------

/**
 * Named sizes Basile picks in Sanity → desktop-ceiling px values (each fed
 * through `fluidScale` so it scales on narrow viewports, like the nav).
 *
 * Values are chosen so the two legacy presets map exactly, keeping existing
 * content pixel-identical without a data migration:
 *   legacy "body"    (28px) → 'lg'
 *   legacy "contact" (25px) → 'md'
 */
export const SIZE_SCALE = { xs: 18, sm: 22, md: 25, lg: 28, xl: 34 };

/**
 * Mobile shrink ratio for overlay text in AUTO mode. On phones, overlay text
 * renders at this fraction of its desktop size — a deeper shrink than the
 * nav's 0.85 — so the mobile/desktop contrast is pronounced.
 */
export const OVERLAY_TEXT_MOBILE_RATIO = 0.75;

/**
 * Resolve an item's base (computer) text size to a px value.
 *
 * New items carry `textSize` (xs…xl). Legacy items (created before the
 * `textSize` field existed) fall back to the size that preserves their
 * original look, keyed off the `size` (style) field.
 */
export function resolveTextSizePx(item) {
  if (item?.textSize && SIZE_SCALE[item.textSize]) {
    return SIZE_SCALE[item.textSize];
  }
  return item?.size === 'contact' ? SIZE_SCALE.md : SIZE_SCALE.lg;
}

/** Resolve a named size key to px, falling back when unset/unknown. */
export function sizeKeyToPx(key, fallbackPx) {
  return key && SIZE_SCALE[key] ? SIZE_SCALE[key] : fallbackPx;
}

/**
 * Resolve an item's text style — `body` or `contact`. Controls casing +
 * letter-spacing only (never size).
 */
export function resolveStyle(item) {
  return item?.size === 'contact' ? 'contact' : 'body';
}

/** Vertical half of an item's anchor — 'top' | 'middle' | 'bottom'. */
export function verticalAnchor(item) {
  return (item?.anchor || 'top-left').split('-')[0];
}

// ---------------------------------------------------------------------------
// Viewport tiers + per-screen size resolution
// ---------------------------------------------------------------------------

export const TABLET_MIN_PX = 768; // phone → tablet boundary
export const DESKTOP_MIN_PX = 1024; // tablet → desktop boundary

/** Classify a viewport width into a tier. */
export function viewportTier(width) {
  if (width < TABLET_MIN_PX) return 'phone';
  if (width < DESKTOP_MIN_PX) return 'tablet';
  return 'desktop';
}

/**
 * Resolve the CSS font-size for an overlay item at a given viewport tier.
 *
 * Auto mode (`autoShrinkSmallScreens` on / unset): the desktop + tablet tiers
 * use the standard fluid clamp; the phone tier uses the deeper overlay
 * mobile ratio. Manual mode: a fixed px per tier (phone/tablet picked by the
 * editor, desktop = the base size), each falling back to the base size.
 */
export function resolveOverlayFontSize(item, tier) {
  const basePx = resolveTextSizePx(item);
  const autoShrink = item?.autoShrinkSmallScreens !== false;

  if (autoShrink) {
    if (tier === 'phone') {
      return fluidScale(basePx, { mobileRatio: OVERLAY_TEXT_MOBILE_RATIO });
    }
    return fluidScale(basePx); // tablet + desktop
  }

  if (tier === 'phone') return `${sizeKeyToPx(item?.phoneSize, basePx)}px`;
  if (tier === 'tablet') return `${sizeKeyToPx(item?.tabletSize, basePx)}px`;
  return `${basePx}px`; // desktop
}

// ---------------------------------------------------------------------------
// Desktop positioning — fixed insets (no editable offsets)
// ---------------------------------------------------------------------------

// Edge insets for the desktop overlay. Expressed in rem so they stay
// consistent with the Tailwind spacing scale and respect browser font
// settings. The top inset (9rem ≈ 144px) clears the 80px nav comfortably.
export const DESKTOP_EDGE_INSET = '2.5rem'; // 40px — left / right
export const DESKTOP_TOP_INSET = '9rem'; // 144px — clears the nav
export const DESKTOP_BOTTOM_INSET = '2.5rem'; // 40px — bottom

/**
 * Resolve an anchor (e.g. 'top-left') into a CSS positioning object for a
 * single desktop overlay item. Positions come from fixed insets — there are
 * no per-item offsets to configure.
 */
export function anchorToStyle(anchor) {
  const [v, h] = (anchor || 'top-left').split('-');
  const style = {};
  const transforms = [];

  if (v === 'top') style.top = DESKTOP_TOP_INSET;
  else if (v === 'bottom') style.bottom = DESKTOP_BOTTOM_INSET;
  else {
    style.top = '50%';
    transforms.push('translateY(-50%)');
  }

  if (h === 'right') style.right = DESKTOP_EDGE_INSET;
  else style.left = DESKTOP_EDGE_INSET; // 'left' (no center anchors)

  if (transforms.length) style.transform = transforms.join(' ');
  return style;
}

// Gap between stacked texts, as a fraction of the text size. Proportional so
// it looks right for one-liners and short paragraphs alike — it tracks the
// text size (em-style), not the page root (which is what rem would do).
const STACK_GAP_RATIO = 0.55;

/** Vertical gap (px) between items in a desktop stack, sized to the text. */
export function stackRowGapPx(item) {
  return Math.round(resolveTextSizePx(item) * STACK_GAP_RATIO);
}

/**
 * Build the desktop render plan: consecutive `stackWithSiblings` items that
 * share an anchor merge into one stack; everything else renders solo. The
 * chain breaks on a non-flagged item or an anchor change.
 */
export function buildDesktopRenderPlan(items) {
  const plan = [];
  let currentStack = null;

  (items || []).forEach((item) => {
    if (item.stackWithSiblings) {
      const sameAnchor =
        currentStack &&
        (currentStack.items[0].anchor || 'top-left') === (item.anchor || 'top-left');
      if (sameAnchor) {
        currentStack.items.push(item);
      } else {
        currentStack = { type: 'stack', items: [item] };
        plan.push(currentStack);
      }
    } else {
      currentStack = null;
      plan.push({ type: 'single', item });
    }
  });

  return plan;
}

// ---------------------------------------------------------------------------
// Mobile auto-safe layout
// ---------------------------------------------------------------------------

export const MOBILE_NAV_SAFE_PX = 104; // 80px nav + 24px breathing room
export const MOBILE_EDGE_PAD_PX = 16; // horizontal inset from the screen edges
export const MOBILE_BOTTOM_PAD_PX = 32; // bottom-zone inset from the screen bottom
export const MOBILE_ZONE_GAP_PX = 16; // vertical gap between items within a zone
export const MOBILE_MIN_ZONE_GAP_PX = 32; // min gap kept between the top & bottom zones
export const MOBILE_MIN_FIT_SCALE = 0.6; // readability floor for the auto-shrink

/**
 * Split overlay items into the mobile top + bottom zones.
 *
 * Items hidden on mobile (`mobileVisible: false`) are dropped. Top- and
 * middle-anchored items join the top zone; bottom-anchored items join the
 * bottom zone. Document order is preserved within each zone.
 */
export function splitMobileZones(items) {
  const visible = (items || []).filter((it) => it?.mobileVisible !== false);
  return {
    top: visible.filter((it) => verticalAnchor(it) !== 'bottom'),
    bottom: visible.filter((it) => verticalAnchor(it) === 'bottom'),
  };
}

/**
 * Compute the auto-shrink scale for the mobile overlay.
 *
 * Returns a value in [MOBILE_MIN_FIT_SCALE, 1]. When the natural height of
 * the two zones plus the minimum inter-zone gap exceeds the available
 * height, the zones are scaled down to fit (floored for readability).
 */
export function computeFitScale({ containerHeight, topHeight, bottomHeight }) {
  const available =
    containerHeight - MOBILE_NAV_SAFE_PX - MOBILE_BOTTOM_PAD_PX - MOBILE_MIN_ZONE_GAP_PX;
  const needed = (topHeight || 0) + (bottomHeight || 0);
  if (needed <= 0 || available <= 0 || needed <= available) return 1;
  return Math.max(MOBILE_MIN_FIT_SCALE, available / needed);
}
