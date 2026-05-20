/**
 * Hero overlay — layout primitives.
 *
 * Pure helpers + constants shared by the desktop and mobile overlay
 * renderers in HeroOverlay.jsx. Kept React-free so the positioning maths
 * can be reasoned about (and unit-tested) in isolation.
 *
 * See .mdd/docs/13-hero-overlay-mobile.md.
 */
import { fluidScale } from '../../utils/fluidScale';

// ---------------------------------------------------------------------------
// Text size scale
// ---------------------------------------------------------------------------

/**
 * Named sizes Basile picks in Sanity → desktop-ceiling px values (each fed
 * through `fluidScale` so it scales down on narrow viewports, like the nav).
 *
 * Values are chosen so the two legacy presets map exactly, keeping existing
 * content pixel-identical without a data migration:
 *   legacy "body"    (28px) → 'lg'
 *   legacy "contact" (25px) → 'md'
 */
export const SIZE_SCALE = { xs: 18, sm: 22, md: 25, lg: 28, xl: 34 };
export const DEFAULT_TEXT_SIZE = 'md';

/**
 * Resolve an item's text size to a desktop-ceiling px value.
 *
 * New items carry `textSize` (xs…xl). Legacy items (created before the
 * `textSize` field existed) have none — they fall back to the size that
 * preserves their original look, keyed off the (retitled) `size` field.
 */
export function resolveTextSizePx(item) {
  if (item?.textSize && SIZE_SCALE[item.textSize]) {
    return SIZE_SCALE[item.textSize];
  }
  return item?.size === 'contact' ? SIZE_SCALE.md : SIZE_SCALE.lg;
}

/**
 * Resolve an item's text style — `body` or `contact`. Controls casing +
 * letter-spacing only (never size). The CMS field key is still `size` for
 * backwards compatibility; it is titled "Text style" in Studio.
 */
export function resolveStyle(item) {
  return item?.size === 'contact' ? 'contact' : 'body';
}

/** Vertical half of an item's anchor — 'top' | 'middle' | 'bottom'. */
export function verticalAnchor(item) {
  return (item?.anchor || 'top-left').split('-')[0];
}

// ---------------------------------------------------------------------------
// Desktop positioning
// ---------------------------------------------------------------------------

/**
 * Desktop nav-safe line. The nav is `absolute top-0 h-20` (80px tall — see
 * Navigation.jsx); top-anchored overlay items are clamped to never render
 * above this line, so a low `offsetY` cannot collide with the nav links.
 */
export const DESKTOP_NAV_SAFE_PX = 96; // 80px nav + 16px breathing room

// Floor ratio for the fluid offset ramp: on the narrowest desktop widths an
// offset shrinks toward this fraction of its CMS value before the ramp tops
// out at the full value on standard laptop/desktop widths.
const OFFSET_FLOOR_RATIO = 0.4;

/** Fluid (clamp-based) offset for desktop anchor positioning. */
export const fluidOffset = (px) => fluidScale(px, { mobileRatio: OFFSET_FLOOR_RATIO });

/**
 * Resolve an anchor (e.g. 'top-left') plus pixel offsets into a CSS
 * positioning object for a single desktop overlay item.
 *
 * Top-anchored items receive a `max()` nav-safe clamp so a small `offsetY`
 * can never push text under the nav.
 */
export function anchorToStyle(anchor, offsetX = 0, offsetY = 0) {
  const [v, h] = (anchor || 'top-left').split('-');
  const style = {};
  const transforms = [];

  if (v === 'top') {
    style.top = `max(${DESKTOP_NAV_SAFE_PX}px, ${fluidOffset(offsetY)})`;
  } else if (v === 'bottom') {
    style.bottom = fluidOffset(offsetY);
  } else {
    style.top = '50%';
    transforms.push(`translateY(calc(-50% + ${fluidOffset(offsetY)}))`);
  }

  if (h === 'left') {
    style.left = fluidOffset(offsetX);
  } else if (h === 'right') {
    style.right = fluidOffset(offsetX);
  } else {
    style.left = '50%';
    transforms.push(`translateX(calc(-50% + ${fluidOffset(offsetX)}))`);
  }

  if (transforms.length) style.transform = transforms.join(' ');
  return style;
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
