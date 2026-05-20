/**
 * Hero overlay — CMS-driven floating text on top of the heroes.
 *
 * `HeroBioOverlay` is shared by the Films hero (HeroSection) and the Photos
 * hero (FloatingGalleryHero). Each hero renders it twice — once inside its
 * `hidden md:block` desktop wrapper and once inside its `md:hidden` mobile
 * wrapper — so the layout is chosen by an explicit `variant` prop:
 *
 *   variant="desktop" → free anchor + offset positioning (+ nav-safe clamp)
 *   variant="mobile"  → automatic, unbreakable top/bottom safe zones
 *
 * See .mdd/docs/13-hero-overlay-mobile.md.
 */
import { useLayoutEffect, useRef, useState } from 'react';

import { heroOverlay } from '../../sanity/loader';
import { fluidScale } from '../../utils/fluidScale';
import {
  anchorToStyle,
  buildDesktopRenderPlan,
  computeFitScale,
  DESKTOP_NAV_SAFE_PX,
  fluidOffset,
  MOBILE_BOTTOM_PAD_PX,
  MOBILE_EDGE_PAD_PX,
  MOBILE_NAV_SAFE_PX,
  MOBILE_ZONE_GAP_PX,
  resolveStyle,
  resolveTextSizePx,
  splitMobileZones,
} from './heroOverlayLayout';

// px gap from the opposite viewport edge for a desktop stack container.
const STACK_VIEWPORT_PADDING = 16;

// ---------------------------------------------------------------------------
// Shared text element
// ---------------------------------------------------------------------------

/**
 * The visual element of an overlay item — the <a> or <span> with text
 * styling and (optional) link href. Positioning is applied by the parent.
 */
function HeroOverlayText({ item }) {
  const { text, link, maxWidth } = item;

  // `style` here is the body/contact typographic treatment, not the size.
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

  // Fluid font-size from the named size scale, plus the optional max-width cap.
  const style = { fontSize: fluidScale(resolveTextSizePx(item)) };
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
// Desktop layout — free anchor + offset positioning
// ---------------------------------------------------------------------------

/** A single absolutely-positioned desktop item (not part of a stack). */
function HeroOverlayItem({ item }) {
  const positionStyle = anchorToStyle(item.anchor, item.offsetX ?? 0, item.offsetY ?? 0);
  return (
    <div className="absolute z-10" style={positionStyle}>
      <HeroOverlayText item={item} />
    </div>
  );
}

/**
 * A desktop stack of overlay items — flex-row with flex-wrap so items sit
 * inline when there's room and wrap to new rows when there isn't. Positioned
 * at the FIRST item's anchor + offsets; top-anchored stacks get the same
 * `max()` nav-safe clamp as single items.
 */
function HeroOverlayStack({ items }) {
  const first = items[0];
  const anchor = first.anchor || 'top-left';
  const offsetX = first.offsetX ?? 0;
  const offsetY = first.offsetY ?? 0;
  const [v, h] = anchor.split('-');

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

  // Set the opposite side too, so the container has a bounded width that
  // lets flex-wrap kick in when items can't fit on a single row.
  if (h === 'left') {
    style.left = fluidOffset(offsetX);
    style.right = `${STACK_VIEWPORT_PADDING}px`;
  } else if (h === 'right') {
    style.right = fluidOffset(offsetX);
    style.left = `${STACK_VIEWPORT_PADDING}px`;
  } else {
    style.left = '50%';
    style.maxWidth = `calc(100vw - ${STACK_VIEWPORT_PADDING * 2}px)`;
    transforms.push(`translateX(calc(-50% + ${fluidOffset(offsetX)}))`);
  }

  if (transforms.length) style.transform = transforms.join(' ');

  const rowGapPx = typeof first.stackRowGap === 'number' ? first.stackRowGap : 24;
  style.rowGap = `${rowGapPx}px`;

  const justifyClass = h === 'right' ? 'justify-end' : 'justify-start';

  return (
    <div
      className={`absolute z-10 flex flex-row flex-wrap items-center gap-x-6 ${justifyClass}`}
      style={style}
    >
      {items.map((item, i) => (
        <HeroOverlayText key={item._key ?? `s-${i}`} item={item} />
      ))}
    </div>
  );
}

/** Desktop renderer — render plan of singles + stacks. */
function HeroOverlayDesktop({ items }) {
  const plan = buildDesktopRenderPlan(items);
  return (
    <>
      {plan.map((node, i) =>
        node.type === 'stack' ? (
          <HeroOverlayStack key={`stack-${i}`} items={node.items} />
        ) : (
          <HeroOverlayItem key={node.item._key ?? `item-${i}`} item={node.item} />
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
 * height, so applying the scale transform never re-triggers measurement
 * (no measure/scale loop). The overlay items array is a static build-time
 * import, so the effect runs once on mount + on viewport resize.
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
            <HeroOverlayText key={item._key ?? `mt-${i}`} item={item} />
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
            <HeroOverlayText key={item._key ?? `mb-${i}`} item={item} />
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
