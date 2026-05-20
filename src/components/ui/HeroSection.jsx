import { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { siteConfig } from '../../data/siteConfig';
import { heroOverlay } from '../../sanity/loader';
import { fluidScale } from '../../utils/fluidScale';

// Desktop ceilings for overlay text. Mirrors the original Tailwind values
// (text-[28px] / text-[25px]); each is run through `fluidScale` so the
// effective size scales with viewport width — same approach as the nav.
const OVERLAY_DESKTOP_SIZE = {
  body: 28,
  contact: 25,
};

// ---------------------------------------------------------------------------
// Hero overlay rendering helpers
// ---------------------------------------------------------------------------

/**
 * Resolve an anchor (e.g. 'top-left', 'bottom-right', 'middle-center') plus
 * pixel offsets into a CSS positioning object.
 *
 * Offsets are pushed through `fluidScale` (same helper as the nav + text
 * sizing) so the editor's desktop value is the ceiling and the offset
 * shrinks on smaller viewports. Without this, a 40px offsetX would still
 * be a literal 40px on a 360px phone — which is too much padding for the
 * available width and doesn't match how the original site rendered the
 * hero overlay (text-sm spacing on mobile, larger on desktop).
 */
const OFFSET_MOBILE_RATIO = 0.4;
const fluidOffset = (px) => fluidScale(px, { mobileRatio: OFFSET_MOBILE_RATIO });

function anchorToStyle(anchor, offsetX = 0, offsetY = 0) {
  const [v, h] = (anchor || 'top-left').split('-');
  const style = {};
  const transforms = [];

  if (v === 'top') style.top = fluidOffset(offsetY);
  else if (v === 'bottom') style.bottom = fluidOffset(offsetY);
  else {
    style.top = '50%';
    transforms.push(`translateY(calc(-50% + ${fluidOffset(offsetY)}))`);
  }

  if (h === 'left') style.left = fluidOffset(offsetX);
  else if (h === 'right') style.right = fluidOffset(offsetX);
  else {
    style.left = '50%';
    transforms.push(`translateX(calc(-50% + ${fluidOffset(offsetX)}))`);
  }

  if (transforms.length) style.transform = transforms.join(' ');
  return style;
}

/**
 * The visual element of an overlay item — the <a> or <span> with text
 * styling and (optional) link href. Does NOT include positioning;
 * positioning is applied by the parent (single item or stack container).
 */
function HeroOverlayText({ item }) {
  const { text, size, link, maxWidth } = item;

  const sizeClass =
    size === 'contact'
      ? 'font-header font-medium tracking-[0.15em]'
      : 'font-header font-medium leading-tight tracking-[-0.01em]';

  // Phone numbers were uppercased in the original design; email was not.
  const isPhone = link?.type === 'phone';
  const upperClass = isPhone ? 'uppercase' : '';

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

  // Fluid font-size from the shared scaler, plus the optional max-width cap.
  const desktopPx = OVERLAY_DESKTOP_SIZE[size] ?? OVERLAY_DESKTOP_SIZE.body;
  const style = { fontSize: fluidScale(desktopPx) };
  if (typeof maxWidth === 'number' && maxWidth > 0) {
    style.maxWidth = `${maxWidth}px`;
  }

  if (link?.type === 'email' && link.value) {
    return (
      <a href={`mailto:${link.value}`} className={className} style={style}>
        {text}
      </a>
    );
  }
  if (link?.type === 'phone' && link.value) {
    const sanitized = link.value.replace(/[^\d+]/g, '');
    return (
      <a href={`tel:${sanitized}`} className={className} style={style}>
        {text}
      </a>
    );
  }
  if (link?.type === 'url' && link.value) {
    return (
      <a
        href={link.value}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {text}
      </a>
    );
  }
  return (
    <span className={className} style={style}>
      {text}
    </span>
  );
}

/**
 * A single absolutely-positioned overlay item. Used when an item is not
 * part of a stacking group.
 */
function HeroOverlayItem({ item }) {
  const mobileClass = item.mobileVisible === false ? 'hidden md:block' : '';
  const positionStyle = anchorToStyle(item.anchor, item.offsetX ?? 0, item.offsetY ?? 0);
  return (
    <div className={`absolute z-10 ${mobileClass}`.trim()} style={positionStyle}>
      <HeroOverlayText item={item} />
    </div>
  );
}

/**
 * A stack of overlay items. Positioned at the FIRST item's anchor + offsets.
 *
 * Renders as a flex-row container with `flex-wrap` so items sit inline
 * side-by-side when there's enough horizontal room and wrap to new rows
 * (i.e. stack vertically) when there isn't. Items are packed toward the
 * anchor's horizontal side (left-aligned for left/center anchors,
 * right-aligned for right anchors).
 *
 * The container is given the opposite-side padding (16px) so the available
 * width is bounded — without that bound, flex-wrap has nothing to wrap
 * against and items would just overflow the viewport.
 */
const STACK_VIEWPORT_PADDING = 16; // px gap from the opposite viewport edge

function HeroOverlayStack({ items }) {
  // Hide the entire stack when no item is mobile-visible. (Each item also
  // honours its own mobileVisible flag inside.)
  const anyMobileVisible = items.some((it) => it.mobileVisible !== false);
  const stackMobileClass = anyMobileVisible ? '' : 'hidden md:flex';

  const first = items[0];
  const anchor = first.anchor || 'top-left';
  const offsetX = first.offsetX ?? 0;
  const offsetY = first.offsetY ?? 0;
  const [v, h] = anchor.split('-');

  const style = {};
  const transforms = [];

  // Vertical positioning is anchor-driven, same as a single item.
  // Offsets are scaled responsively (mobile floor = 40% of desktop value)
  // so the overlay tightens up on smaller screens.
  if (v === 'top') style.top = fluidOffset(offsetY);
  else if (v === 'bottom') style.bottom = fluidOffset(offsetY);
  else {
    style.top = '50%';
    transforms.push(`translateY(calc(-50% + ${fluidOffset(offsetY)}))`);
  }

  // Horizontal positioning: in addition to the anchor edge, set the
  // opposite side too, so the container has a bounded width that lets
  // flex-wrap kick in when items can't fit on a single row.
  if (h === 'left') {
    style.left = fluidOffset(offsetX);
    style.right = `${STACK_VIEWPORT_PADDING}px`;
  } else if (h === 'right') {
    style.right = fluidOffset(offsetX);
    style.left = `${STACK_VIEWPORT_PADDING}px`;
  } else {
    // Center anchor: cap max-width so items can wrap, and shift the
    // centered container by offsetX.
    style.left = '50%';
    style.maxWidth = `calc(100vw - ${STACK_VIEWPORT_PADDING * 2}px)`;
    transforms.push(`translateX(calc(-50% + ${fluidOffset(offsetX)}))`);
  }

  if (transforms.length) style.transform = transforms.join(' ');

  // Vertical gap between rows is set by the first item's stackRowGap.
  // (Horizontal gap stays a uniform 24px via gap-x-6.) Default is 24px —
  // bigger than line-height so the row gap stays visually distinct from
  // intra-paragraph line spacing once items wrap internally on mobile.
  const rowGapPx = typeof first.stackRowGap === 'number' ? first.stackRowGap : 24;
  style.rowGap = `${rowGapPx}px`;

  // Pack items toward the anchor side so they read naturally:
  //   left/center anchor → items hug the left edge of the container
  //   right anchor       → items hug the right edge
  const justifyClass = h === 'right' ? 'justify-end' : 'justify-start';

  return (
    <div
      className={`absolute z-10 flex flex-row flex-wrap items-center gap-x-6 ${justifyClass} ${stackMobileClass}`.trim()}
      style={style}
    >
      {items.map((item, i) => {
        const itemMobileClass = item.mobileVisible === false ? 'hidden md:block' : '';
        return (
          <div key={item._key ?? `s-${i}`} className={itemMobileClass}>
            <HeroOverlayText item={item} />
          </div>
        );
      })}
    </div>
  );
}

/**
 * HeroBioOverlay — top-level renderer for CMS-driven hero overlay items.
 *
 * Consecutive items with `stackWithSiblings = true` AND the SAME anchor
 * are merged into a single vertical flex column anchored at the FIRST
 * item's anchor + offsets. The chain breaks when:
 *   - a non-flagged item appears, OR
 *   - the anchor changes (e.g. top-left items don't merge with bottom-left).
 *
 * Shared by Films (HeroSection) and Photos (FloatingGalleryHero).
 */
function HeroBioOverlay() {
  const items = heroOverlay?.items ?? [];
  if (!items.length) return null;

  const renderPlan = [];
  let currentStack = null;

  items.forEach((item) => {
    if (item.stackWithSiblings) {
      // Only continue an existing stack when this item shares its anchor.
      // A different anchor → new stack so e.g. top-left and bottom-left
      // groups stay distinct even when both are flagged.
      const sameAnchor =
        currentStack && (currentStack.items[0].anchor || 'top-left') === (item.anchor || 'top-left');
      if (sameAnchor) {
        currentStack.items.push(item);
      } else {
        currentStack = { type: 'stack', items: [item] };
        renderPlan.push(currentStack);
      }
    } else {
      currentStack = null;
      renderPlan.push({ type: 'single', item });
    }
  });

  return (
    <>
      {renderPlan.map((node, i) => {
        if (node.type === 'stack') {
          return (
            <HeroOverlayStack
              key={`stack-${node.anchor}-${i}`}
              items={node.items}
            />
          );
        }
        return (
          <HeroOverlayItem
            key={node.item._key ?? `item-${i}`}
            item={node.item}
          />
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// MuteButton + HeroSection
// ---------------------------------------------------------------------------

function MuteButton({ isMuted, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute bottom-6 right-6 z-20 flex items-center justify-center w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full transition-all duration-200"
      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
    >
      {isMuted ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}

function HeroSection({ onVideoClick, onReady }) {
  const desktopVideoRef = useRef(null);
  const mobileVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const readyFired = useRef(false);

  const isSafari = typeof navigator !== 'undefined'
    && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Mute toggle (always works — direct user gesture)
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (desktopVideoRef.current) desktopVideoRef.current.muted = newMuted;
    if (mobileVideoRef.current) mobileVideoRef.current.muted = newMuted;
  };

  // Single play handler — fires per-video when its data is ready.
  // No useEffect play calls (calling .play() on hidden videos poisons Safari).
  const handleVideoReady = (e) => {
    const video = e.target;
    video.controls = false;
    video.removeAttribute('controls');
    video.play().catch(() => {});
    if (!readyFired.current) {
      readyFired.current = true;
      onReady?.();
    }
  };

  // Mux HLS attachment: same pattern as FeaturedFilmCard. When a Mux
  // stream URL is present, hls.js drives playback (or native HLS in Safari).
  // Falls through to the legacy <video src=videoFile> path when no Mux yet.
  useEffect(() => {
    const muxUrl = siteConfig.showreel.muxStreamUrl;
    if (!muxUrl) return;

    const attach = (video) => {
      if (!video) return null;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = muxUrl;
        return null;
      }
      if (!Hls.isSupported()) return null;
      const hls = new Hls({ capLevelToPlayerSize: true, maxBufferLength: 8 });
      hls.loadSource(muxUrl);
      hls.attachMedia(video);
      return hls;
    };

    const desktopHls = attach(desktopVideoRef.current);
    const mobileHls = attach(mobileVideoRef.current);
    return () => {
      desktopHls?.destroy();
      mobileHls?.destroy();
    };
  }, []);

  // Non-Safari: unmute after 2.5s, re-mute if browser kills playback
  useEffect(() => {
    if (isSafari) return;
    const timer = setTimeout(() => {
      const video = desktopVideoRef.current || mobileVideoRef.current;
      if (!video || video.paused) return;
      video.muted = false;
      setTimeout(() => {
        if (video.paused) {
          video.muted = true;
          video.play().catch(() => {});
          setIsMuted(true);
        } else {
          if (desktopVideoRef.current) desktopVideoRef.current.muted = false;
          if (mobileVideoRef.current) mobileVideoRef.current.muted = false;
          setIsMuted(false);
        }
      }, 100);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isSafari]);

  // Mute hero when user opens a video (showreel or film modal)
  const handleHeroVideoClick = () => {
    if (desktopVideoRef.current) desktopVideoRef.current.muted = true;
    if (mobileVideoRef.current) mobileVideoRef.current.muted = true;
    setIsMuted(true);
    onVideoClick();
  };

  return (
    <section className="relative w-full" aria-label="Hero section">
      {/* DESKTOP: Sticky full-bleed video. The +150px keeps the documented
          scroll-to-reveal allowance below the hero (see memory: hero-150px-intentional). */}
      <div className="hidden md:block relative w-full" style={{ height: 'calc(100svh + 150px)' }}>
        <div className="sticky top-0 h-[100svh] w-full">
          <div className="relative w-full h-full overflow-hidden" style={{ containerType: 'inline-size' }}>
            <video
              ref={desktopVideoRef}
              data-hero-video
              src={siteConfig.showreel.muxStreamUrl ? undefined : siteConfig.showreel.videoFile || undefined}
              poster={siteConfig.showreel.muxPosterUrl || siteConfig.showreel.posterImageUrl || undefined}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onLoadedData={handleVideoReady}
              onClick={handleHeroVideoClick}
              className="w-full h-full object-cover cursor-pointer"
              aria-hidden="true"
            />
            <HeroBioOverlay />
            <MuteButton isMuted={isMuted} onClick={toggleMute} />
          </div>
        </div>
      </div>

      {/* MOBILE/TABLET: Sticky full-bleed video — mirrors the desktop pattern so
          the bio + contact overlay pins through the 150px scroll-reveal window
          (see memory: hero-150px-intentional). Native sticky (no JS), so no
          scroll-event lag → no jitter. */}
      <div className="md:hidden relative w-full" style={{ height: 'calc(100svh + 150px)' }}>
        <div className="sticky top-0 h-[100svh] w-full">
          <div className="relative w-full h-full overflow-hidden" onClick={onVideoClick} style={{ containerType: 'inline-size' }}>
            <video
              ref={mobileVideoRef}
              data-hero-video
              src={siteConfig.showreel.muxStreamUrl ? undefined : siteConfig.showreel.videoFile || undefined}
              poster={siteConfig.showreel.muxPosterUrl || siteConfig.showreel.posterImageUrl || undefined}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onLoadedData={handleVideoReady}
              className="absolute inset-0 w-full h-full object-cover"
              aria-hidden="true"
            />
            <HeroBioOverlay />
            <MuteButton isMuted={isMuted} onClick={toggleMute} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
export { HeroBioOverlay };
