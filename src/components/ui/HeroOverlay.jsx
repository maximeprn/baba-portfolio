/**
 * Hero overlay — CMS-driven floating text on top of the heroes.
 *
 * `HeroBioOverlay` is shared by the Films hero (HeroSection) and the Photos
 * hero (FloatingGalleryHero). Each hero renders it twice — once inside its
 * `hidden md:block` desktop wrapper and once inside its `md:hidden` mobile
 * wrapper — so the layout is chosen by an explicit `variant` prop:
 *
 *   variant="desktop" → free anchor layout (fixed insets), tablet/desktop size
 *   variant="mobile"  → automatic nav-safe zones, phone size
 *
 * Text size is resolved per viewport tier (phone / tablet / desktop) — see
 * resolveOverlayFontSize. See .mdd/docs/14-hero-overlay-sizing.md.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { heroOverlay } from '../../sanity/loader';
import {
  anchorToStyle,
  buildDesktopRenderPlan,
  computeFitScale,
  MOBILE_BOTTOM_PAD_PX,
  MOBILE_EDGE_PAD_PX,
  MOBILE_NAV_SAFE_PX,
  MOBILE_ZONE_GAP_PX,
  resolveOverlayFontSize,
  resolveStyle,
  splitMobileZones,
  stackRowGapPx,
  viewportTier,
} from './heroOverlayLayout';

// Opposite-edge bound for a desktop stack, so flex-wrap has a width to wrap
// against. 1rem matches the mobile edge padding.
const STACK_EDGE_BOUND = '1rem';

/** Track the viewport tier ('phone' | 'tablet' | 'desktop'), live on resize. */
function useViewportTier() {
  const [tier, setTier] = useState(() =>
    typeof window === 'undefined' ? 'desktop' : viewportTier(window.innerWidth),
  );
  useEffect(() => {
    const onResize = () => setTier(viewportTier(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return tier;
}

// ---------------------------------------------------------------------------
// Shared text element
// ---------------------------------------------------------------------------

/**
 * The visual element of an overlay item — the <a> or <span> with text
 * styling and (optional) link href. Positioning is applied by the parent;
 * font-size is resolved for the current viewport tier.
 */
function HeroOverlayText({ item, tier = 'desktop' }) {
  const { text, link, maxWidth } = item;

  const sizeClass =
    resolveStyle(item) === 'contact'
      ? 'font-header font-medium tracking-[0.15em]'
      : 'font-header font-medium leading-tight tracking-[-0.01em]';

  // Phone numbers were uppercased in the original design; email was not.
  const upperClass = link?.type === 'phone' ? 'uppercase' : '';

  const isInteractive = link?.type && link.type !== 'none' && link.value;
  const pointerClass = isInteractive ? 'pointer-events-auto' : 'pointer-events-none';
  const hoverClass = isInteractive ? 'hover:opacity-70 transition-opacity duration-150' : '';

  const className = [
    'block text-white whitespace-pre-line break-words',
    sizeClass,
    upperClass,
    pointerClass,
    hoverClass,
  ]
    .filter(Boolean)
    .join(' ');

  const style = { fontSize: resolveOverlayFontSize(item, tier) };
  if (typeof maxWidth === 'number' && maxWidth > 0) {
    style.maxWidth = `${maxWidth}px`;
  }

  const shared = { className, style, 'data-hero-overlay': '' };

  if (link?.type === 'email' && link.value) {
    return (
      <a href={`mailto:${link.value}`} {...shared}>
        {text}
      </a>
    );
  }
  if (link?.type === 'phone' && link.value) {
    const sanitized = link.value.replace(/[^\d+]/g, '');
    return (
      <a href={`tel:${sanitized}`} {...shared}>
        {text}
      </a>
    );
  }
  if (link?.type === 'url' && link.value) {
    return (
      <a href={link.value} target="_blank" rel="noopener noreferrer" {...shared}>
        {text}
      </a>
    );
  }
  return <span {...shared}>{text}</span>;
}

// ---------------------------------------------------------------------------
// Desktop layout — fixed-inset anchor positioning
// ---------------------------------------------------------------------------

/** A single absolutely-positioned desktop item (not part of a stack). */
function HeroOverlayItem({ item, tier }) {
  return (
    <div className="absolute z-10" style={anchorToStyle(item.anchor)}>
      <HeroOverlayText item={item} tier={tier} />
    </div>
  );
}

/**
 * A desktop stack of overlay items — flex-row with flex-wrap so items sit
 * inline when there's room and wrap to new rows when there isn't. Positioned
 * at the first item's anchor; the row gap is sized to the text.
 */
function HeroOverlayStack({ items, tier }) {
  const first = items[0];
  const anchor = first.anchor || 'top-left';
  const h = anchor.split('-')[1]; // 'left' | 'right'

  const style = anchorToStyle(anchor);
  // Bound the opposite side so flex-wrap has a width to wrap against.
  if (h === 'right') style.left = STACK_EDGE_BOUND;
  else style.right = STACK_EDGE_BOUND;
  style.rowGap = `${stackRowGapPx(first)}px`;

  const justifyClass = h === 'right' ? 'justify-end' : 'justify-start';

  return (
    <div
      className={`absolute z-10 flex flex-row flex-wrap items-center gap-x-6 ${justifyClass}`}
      style={style}
    >
      {items.map((item, i) => (
        <HeroOverlayText key={item._key ?? `s-${i}`} item={item} tier={tier} />
      ))}
    </div>
  );
}

/** Desktop renderer — render plan of singles + stacks. */
function HeroOverlayDesktop({ items }) {
  const tier = useViewportTier();
  const plan = buildDesktopRenderPlan(items);
  return (
    <>
      {plan.map((node, i) =>
        node.type === 'stack' ? (
          <HeroOverlayStack key={`stack-${i}`} items={node.items} tier={tier} />
        ) : (
          <HeroOverlayItem key={node.item._key ?? `item-${i}`} item={node.item} tier={tier} />
        ),
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Mobile layout — automatic, unbreakable safe zones
// ---------------------------------------------------------------------------

/**
 * Mobile renderer. Items are split into a top zone (anchored below the
 * nav-safe line) and a bottom zone (anchored above the bottom edge), each a
 * left-aligned flex column. Both zones are measured and, if their combined
 * height would not fit, scaled down with a CSS transform until they do.
 *
 * `offsetHeight` is used for measurement — it is the untransformed layout
 * height, so applying the scale transform never re-triggers measurement.
 * The overlay items array is a static build-time import, so the effect runs
 * once on mount + on viewport resize.
 */
function HeroOverlayMobile({ items }) {
  const containerRef = useRef(null);
  const topRef = useRef(null);
  const bottomRef = useRef(null);
  const [fitScale, setFitScale] = useState(1);

  const { top, bottom } = splitMobileZones(items);

  useLayoutEffect(() => {
    const recompute = () => {
      const container = containerRef.current;
      if (!container) return;
      setFitScale(
        computeFitScale({
          containerHeight: container.offsetHeight,
          topHeight: topRef.current?.offsetHeight ?? 0,
          bottomHeight: bottomRef.current?.offsetHeight ?? 0,
        }),
      );
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    [containerRef, topRef, bottomRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });
    return () => observer.disconnect();
  }, []);

  const zoneClass = 'absolute flex flex-col';

  return (
    <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none">
      {top.length > 0 && (
        <div
          ref={topRef}
          data-hero-overlay-zone="top"
          className={zoneClass}
          style={{
            top: MOBILE_NAV_SAFE_PX,
            left: MOBILE_EDGE_PAD_PX,
            right: MOBILE_EDGE_PAD_PX,
            rowGap: MOBILE_ZONE_GAP_PX,
            transform: `scale(${fitScale})`,
            transformOrigin: 'top left',
          }}
        >
          {top.map((item, i) => (
            <HeroOverlayText key={item._key ?? `mt-${i}`} item={item} tier="phone" />
          ))}
        </div>
      )}

      {bottom.length > 0 && (
        <div
          ref={bottomRef}
          data-hero-overlay-zone="bottom"
          className={zoneClass}
          style={{
            bottom: MOBILE_BOTTOM_PAD_PX,
            left: MOBILE_EDGE_PAD_PX,
            right: MOBILE_EDGE_PAD_PX,
            rowGap: MOBILE_ZONE_GAP_PX,
            transform: `scale(${fitScale})`,
            transformOrigin: 'bottom left',
          }}
        >
          {bottom.map((item, i) => (
            <HeroOverlayText key={item._key ?? `mb-${i}`} item={item} tier="phone" />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

/**
 * HeroBioOverlay — top-level renderer for CMS-driven hero overlay items.
 *
 * @param {'desktop'|'mobile'} variant — which layout to render. Defaults to
 *   desktop. Each hero passes both, in its respective responsive wrapper.
 */
function HeroBioOverlay({ variant = 'desktop' }) {
  const items = heroOverlay?.items ?? [];
  if (!items.length) return null;

  return variant === 'mobile' ? (
    <HeroOverlayMobile items={items} />
  ) : (
    <HeroOverlayDesktop items={items} />
  );
}

export { HeroBioOverlay };
export default HeroBioOverlay;
