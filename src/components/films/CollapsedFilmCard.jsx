/**
 * Collapsed Film Card — single-row summary with shutter open/close animation.
 * On click (collapsed): text slides up, bottom edge slides down revealing FeaturedFilmCard content.
 * On click (expanded): reverse — content shrinks back to a single row.
 * A small X indicator at the bottom (with COLLAPSE label revealed on hover) signals click-to-close.
 */

import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import FeaturedFilmCard from './FeaturedFilmCard';
import { useSmoothScrollContext } from '../../context/SmoothScrollContext';

const OPEN_DURATION_MS  = 1200;
const CLOSE_DURATION_MS = 600; // Half the open duration: close feels snappier than the deliberate open.
const OPEN_TRANSITION  = `height ${OPEN_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
const CLOSE_TRANSITION = `height ${CLOSE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
const OVERLAY_TRANSITION_MS = 500;
// Delay before starting the overlay slide-in so it lands right as the height transition ends.
const OVERLAY_REVEAL_DELAY_MS = Math.max(0, CLOSE_DURATION_MS - OVERLAY_TRANSITION_MS);

// Per-card horizontal drift for the collapsed row. Cycled by index so each
// card sits slightly differently inside its band. Adds to the parent <div>'s
// own px-4 — these are extra inset on top of that.
// Title shifts via padding-left on the left-aligned <p>; metadata shifts via
// padding-right on the right-aligned <p> (text-right pulls the span back
// inward as we add padding-right).
const COLLAPSED_VARIANTS = [
  { titlePl: '1.5rem', metaPr: '0.5rem' },
  { titlePl: '0.5rem', metaPr: '2rem'   },
  { titlePl: '2rem',   metaPr: '1rem'   },
];

function CollapsedFilmCard({
  film,
  index = 0,
  onFilmClick,
  shouldLoad = false,
  onWillExpand,
  onDidCollapse,
  closeSignal = 0,
}) {
  const [phase, setPhase] = useState('collapsed'); // 'collapsed' | 'animating' | 'expanded' | 'closing'
  // During 'closing': overlay starts hidden (translateY(-100%), opacity 0) and crossfades in
  // when this flips true, near the tail of the height transition.
  const [closingOverlayVisible, setClosingOverlayVisible] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const collapsedHeightRef = useRef(0);
  const isAnimatingRef = useRef(false);
  // Tracks an auto-close request received while still in the open animation;
  // if true, we close immediately after reaching 'expanded'.
  const pendingCloseRef = useRef(false);
  const lastCloseSignalRef = useRef(closeSignal);
  const prevPhaseRef = useRef(phase);
  const { scrollTo, getScrollPosition } = useSmoothScrollContext();
  const { title, description, year, category } = film;
  const collapsedVariant = COLLAPSED_VARIANTS[index % COLLAPSED_VARIANTS.length];

  // First sentence of the description (matches up to and including the first . ! or ?)
  const firstSentence = (description.match(/^[^.!?]+[.!?]/)?.[0] || description).trim();

  // Schedule the overlay reveal for the tail of the close animation.
  useEffect(() => {
    if (phase !== 'closing') {
      setClosingOverlayVisible(false);
      return;
    }
    const t = setTimeout(() => setClosingOverlayVisible(true), OVERLAY_REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Notify parent when this card lands in 'collapsed' after a close (not on initial mount).
  useEffect(() => {
    const wasNotCollapsed = prevPhaseRef.current !== 'collapsed';
    prevPhaseRef.current = phase;
    if (phase === 'collapsed' && wasNotCollapsed) {
      onDidCollapse?.(film.id);
    }
  }, [phase, onDidCollapse, film.id]);

  // Run AFTER React has committed the new phase but BEFORE the browser paints — this prevents
  // a one-frame flash where the article's inline height is removed before contentRef switches
  // to absolute positioning (which would briefly let the full FeaturedFilmCard size the article).
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (phase === 'expanded') {
      container.style.transition = 'none';
      container.style.height = 'auto';
    } else if (phase === 'collapsed') {
      container.style.transition = 'none';
      container.style.height = '';
      delete container.dataset.cfcEh;
      delete container.dataset.cfcCh;
    }
  }, [phase]);

  const handleOpen = useCallback(() => {
    if (phase !== 'collapsed' || isAnimatingRef.current) return;
    // Notify parent we're about to expand — parent may close any other expanded card.
    onWillExpand?.(film.id);
    isAnimatingRef.current = true;

    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('expanded');
      container.style.height = 'auto';
      container.style.overflow = '';
      isAnimatingRef.current = false;
      return;
    }

    const targetHeight = content.scrollHeight;
    const collapsedHeight = container.offsetHeight;
    collapsedHeightRef.current = collapsedHeight;

    // Publish our heights so siblings opening later can adjust their scroll target
    // to account for our expected collapse. Cleared in the 'collapsed' useLayoutEffect.
    container.dataset.cfcEh = String(targetHeight);
    container.dataset.cfcCh = String(collapsedHeight);

    container.style.height = `${collapsedHeight}px`;
    container.getBoundingClientRect();

    setPhase('animating');

    requestAnimationFrame(() => {
      // 1. Set target height without transition so page height updates for scroll calc
      container.style.transition = 'none';
      container.style.height = `${targetHeight}px`;
      container.getBoundingClientRect();

      // 2. Compute scroll target to center the video element on screen.
      // Account for sibling cards that are currently in a non-collapsed phase and positioned
      // above us — they're about to (or have already started to) shrink, which will pull our
      // video up by their delta after their close animation completes.
      const videoEl = content.querySelector('video')?.parentElement;
      if (videoEl) {
        let siblingDelta = 0;
        const containerTop = container.getBoundingClientRect().top;
        document.querySelectorAll('[data-cfc-eh]').forEach((el) => {
          if (el === container) return;
          const expH = parseFloat(el.dataset.cfcEh || '0');
          const colH = parseFloat(el.dataset.cfcCh || '0');
          const siblingTop = el.getBoundingClientRect().top;
          if (siblingTop < containerTop) {
            siblingDelta += expH - colH;
          }
        });

        const currentScroll = getScrollPosition();
        const videoRect = videoEl.getBoundingClientRect();
        const videoAbsoluteTop = videoRect.top + currentScroll;
        const targetScroll =
          videoAbsoluteTop - siblingDelta - (window.innerHeight / 2) + (videoRect.height / 2);
        scrollTo(targetScroll, { ease: 0.05 });
      }

      // 3. Snap back to collapsed, then animate to target (no paint between — single rAF)
      container.style.height = `${collapsedHeight}px`;
      container.getBoundingClientRect();
      container.style.transition = OPEN_TRANSITION;
      container.style.height = `${targetHeight}px`;
    });
  }, [phase, scrollTo, getScrollPosition, onWillExpand, film.id]);

  const handleClose = useCallback((e) => {
    if (e) e.stopPropagation();
    if (phase !== 'expanded' || isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const container = containerRef.current;
    if (!container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('collapsed');
      container.style.height = '';
      isAnimatingRef.current = false;
      return;
    }

    const expandedHeight = container.offsetHeight;
    // Use the height we measured during open. Fallback: desktop = 36px (md:h-9), mobile = 0 → re-measure after.
    const targetHeight = collapsedHeightRef.current || (window.innerWidth >= 768 ? 36 : 0);

    container.style.height = `${expandedHeight}px`;
    container.getBoundingClientRect();

    setPhase('closing');

    requestAnimationFrame(() => {
      container.style.transition = CLOSE_TRANSITION;
      container.style.height = `${targetHeight}px`;
    });
  }, [phase]);

  const handleArticleClick = useCallback((e) => {
    if (phase === 'collapsed') {
      handleOpen();
    } else if (phase === 'expanded') {
      handleClose(e);
    }
  }, [phase, handleOpen, handleClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleArticleClick(e);
    }
  }, [handleArticleClick]);

  const handleTransitionEnd = useCallback((e) => {
    if (e.target !== containerRef.current || e.propertyName !== 'height') return;
    if (phase === 'animating') {
      setPhase('expanded');
      isAnimatingRef.current = false;
      // If a close was queued while we were still opening, fire it now.
      if (pendingCloseRef.current) {
        pendingCloseRef.current = false;
        requestAnimationFrame(() => handleClose());
      }
    } else if (phase === 'closing') {
      setPhase('collapsed');
      isAnimatingRef.current = false;
    }
  }, [phase, handleClose]);

  // Auto-close when parent signals via closeSignal increment.
  // If we're still opening, queue the close to fire on transition end.
  useEffect(() => {
    if (closeSignal === lastCloseSignalRef.current) return;
    lastCloseSignalRef.current = closeSignal;
    if (phase === 'expanded') {
      handleClose();
    } else if (phase === 'animating') {
      pendingCloseRef.current = true;
    }
    // 'collapsed' / 'closing': nothing to do
  }, [closeSignal, phase, handleClose]);

  const isInteractive = phase === 'collapsed' || phase === 'expanded';
  const showOverlay = phase === 'collapsed' || phase === 'animating' || phase === 'closing';
  const showCloseIndicator = phase === 'expanded' || phase === 'closing';
  // Overlay is hidden during the open animation, and during the leading portion of the close
  // animation (before closingOverlayVisible flips true). Otherwise it's fully visible.
  const overlayHidden =
    phase === 'animating' || (phase === 'closing' && !closingOverlayVisible);

  return (
    <article
      ref={containerRef}
      onClick={isInteractive ? handleArticleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      onTransitionEnd={handleTransitionEnd}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-expanded={phase !== 'collapsed'}
      aria-label={
        phase === 'collapsed'
          ? `Expand ${title} film details`
          : phase === 'expanded'
            ? `Collapse ${title} film details`
            : undefined
      }
      className={`w-full bg-white relative ${phase === 'collapsed' ? 'cursor-pointer md:h-9' : ''} ${phase === 'expanded' ? 'cursor-pointer group' : ''}`}
      style={{
        overflow: phase !== 'expanded' ? 'hidden' : undefined,
      }}
    >
      {/* Collapsed text overlay — normal flow on mobile (sizes container), absolute on desktop.
          On hover (collapsed only), each of the three text elements gets its own
          black-on-white chip — three separate boxes, not one row-wide box. */}
      {showOverlay && (
        <div
          className={`${phase === 'collapsed' ? 'relative md:absolute group/row' : 'absolute'} top-0 left-0 right-0 bg-white z-10`}
          style={{
            transition: `transform ${OVERLAY_TRANSITION_MS}ms ease-out, opacity ${OVERLAY_TRANSITION_MS}ms ease-out`,
            transform: overlayHidden ? 'translateY(-100%)' : 'translateY(0)',
            opacity: overlayHidden ? 0 : 1,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 px-4 py-2 md:py-0 md:h-9">
            <p
              className="flex-1 font-header font-medium tracking-[1.8px] uppercase"
              style={{ paddingLeft: collapsedVariant.titlePl }}
            >
              <span className="inline-block px-2 py-0.5 text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                {title}
              </span>
            </p>
            <p className="font-body tracking-[0.6px] shrink-0 hidden md:block">
              <span className="inline-block px-2 py-0.5 text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                {firstSentence}
              </span>
            </p>
            <p
              className="flex-1 font-header font-medium tracking-[1.5px] text-right uppercase whitespace-pre-wrap"
              style={{ paddingRight: collapsedVariant.metaPr }}
            >
              <span className="inline-block px-2 py-0.5 text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                {year}  •  {category}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* FeaturedFilmCard content — absolute when collapsed so it doesn't affect height */}
      {/*
        contentRef wraps the FeaturedFilmCard. While collapsed, it's positioned absolute (out
        of flow) AND visibility:hidden so it produces no pixels. This is a deliberate fix for
        a 1px subpixel leak: the article clips at y=36px but FeaturedFilmCard's video sits at
        y=32px inside contentRef, and fractional rounding under the smooth-scroll transform
        could expose a thin video line at the article's bottom edge. visibility:hidden hides
        the rendering without disturbing layout, so content.scrollHeight (used in handleOpen)
        still measures the true expanded height.
      */}
      <div
        ref={contentRef}
        className={`pt-[52px] ${phase === 'collapsed' ? 'absolute top-0 left-0 right-0 invisible' : ''}`}
      >
        <FeaturedFilmCard
          film={film}
          index={index}
          onFilmClick={onFilmClick}
          shouldLoad={phase !== 'collapsed' || shouldLoad}
        />

        {/*
          Close indicator — small X with COLLAPSE label revealed on hover.
          Always mounted so its height is included in `content.scrollHeight` during the
          collapsed→expanded measurement in handleOpen. When not in expanded/closing state
          it is visibility:hidden + inert (preserves layout space, no interaction).
        */}
        <div
          onClick={showCloseIndicator ? handleClose : undefined}
          role={showCloseIndicator ? 'button' : undefined}
          tabIndex={showCloseIndicator ? 0 : -1}
          aria-hidden={!showCloseIndicator}
          aria-label={showCloseIndicator ? `Collapse ${title}` : undefined}
          onKeyDown={
            showCloseIndicator
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClose(e);
                  }
                }
              : undefined
          }
          className={`flex items-center justify-center pb-8 pt-2 ${
            showCloseIndicator ? 'cursor-pointer' : 'invisible pointer-events-none'
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            aria-hidden="true"
            className="shrink-0 transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            <line x1="2" y1="2" x2="10" y2="10" />
            <line x1="10" y1="2" x2="2" y2="10" />
          </svg>
        </div>
      </div>
    </article>
  );
}

export default CollapsedFilmCard;
