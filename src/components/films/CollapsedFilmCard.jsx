/**
 * CollapsedFilmCard — single-row band in the Films page "Other Projects"
 * section that expands inline into a full FeaturedFilmCard.
 *
 * Borrows CollapsedPhotoCard's open/close TECHNIQUE — the expanded body
 * is mounted only while the card is open (`showContent`), driven by the
 * same 1200 ms open / 600 ms close height shutter and band-overlay
 * slide — but with two deliberate differences:
 *
 *  - No single-expand. Film cards are independent: opening one does NOT
 *    collapse the others. Each card is collapsed only by the user
 *    clicking it. (Photos enforces single-expand; Films does not.)
 *  - Open scroll target. A film's body is a single preview video, so the
 *    open scrolls the video's vertical centre to the viewport's vertical
 *    centre. (Photos scrolls its gallery's top to y=0.)
 *
 * Spec: .mdd/docs/03-collapsed-film-cards.md
 */

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';

import FeaturedFilmCard from './FeaturedFilmCard';
import { useSmoothScrollContext } from '../../context/SmoothScrollContext';
import CardSubtitle from '../ui/CardSubtitle';

const OPEN_DURATION_MS  = 1200;
const CLOSE_DURATION_MS = 600; // 2× faster than open — snappy dismissal.
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const OPEN_TRANSITION   = `height ${OPEN_DURATION_MS}ms ${EASE}`;
const CLOSE_TRANSITION  = `height ${CLOSE_DURATION_MS}ms ${EASE}`;
const CONTENT_FADE_OUT_MS    = 200;
const OVERLAY_TRANSITION_MS   = 500;
// Delay the overlay reveal so it lands fully visible exactly when the
// close height transition ends.
const OVERLAY_REVEAL_DELAY_MS = Math.max(0, CLOSE_DURATION_MS - OVERLAY_TRANSITION_MS);

// Per-card horizontal drift for the collapsed row — cycled by index so
// each band sits slightly differently. `cards:`-prefixed (≥1350 px) so
// the stagger only appears in the fully-composed desktop layout. Between
// 768 px and 1350 px the row is a plain 3-zone layout with no stagger;
// on phones the band stacks.
const COLLAPSED_VARIANTS = [
  { titlePl: 'cards:pl-6', metaPr: 'cards:pr-2' },
  { titlePl: 'cards:pl-2', metaPr: 'cards:pr-8' },
  { titlePl: 'cards:pl-8', metaPr: 'cards:pr-4' },
];

function reducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function CollapsedFilmCard({ film, index = 0, onFilmClick }) {
  const [phase, setPhase] = useState('collapsed'); // 'collapsed' | 'animating' | 'expanded' | 'closing'
  const [closingOverlayVisible, setClosingOverlayVisible] = useState(false);

  const containerRef       = useRef(null);
  const contentRef         = useRef(null);
  const collapsedHeightRef = useRef(0);
  const isAnimatingRef     = useRef(false);

  const { scrollTo, getScrollPosition, isDesktop, setScrollLocked } = useSmoothScrollContext();
  const { title, description, year, category } = film;
  const collapsedVariant = COLLAPSED_VARIANTS[index % COLLAPSED_VARIANTS.length];

  // First sentence of the description (matches up to and including the first . ! or ?)
  const firstSentence = (description.match(/^[^.!?]+[.!?]/)?.[0] || description).trim();

  // Closing-tail overlay reveal: fades the band back in over the last
  // OVERLAY_TRANSITION_MS of the close so it lands fully visible exactly
  // when the height transition ends.
  useEffect(() => {
    if (phase !== 'closing') {
      setClosingOverlayVisible(false);
      return;
    }
    const t = setTimeout(() => setClosingOverlayVisible(true), OVERLAY_REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // While this card is mid-animation, disable user scrolling so a manual
  // scroll — or an inertial fling on mobile — cannot fight the programmatic
  // open/close scroll. setScrollLocked gates the desktop smooth-scroll's
  // wheel/key handlers; the touchmove blocker covers mobile native scroll.
  // Programmatic scrollTo is unaffected by either. Keyed on `phase` (not a
  // transition event) so the unlock is guaranteed to run.
  useEffect(() => {
    if (phase !== 'animating' && phase !== 'closing') return undefined;
    setScrollLocked(true);
    const blockTouch = (e) => {
      if (e.cancelable) e.preventDefault();
    };
    window.addEventListener('touchmove', blockTouch, { passive: false });
    return () => {
      setScrollLocked(false);
      window.removeEventListener('touchmove', blockTouch);
    };
  }, [phase, setScrollLocked]);

  // Settle inline styles when phase reaches a stable state.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (phase === 'expanded') {
      container.style.transition = 'none';
      container.style.height = 'auto';
      const content = contentRef.current;
      if (content) {
        content.style.transition = '';
        content.style.opacity = '';
      }
    } else if (phase === 'collapsed') {
      container.style.transition = 'none';
      container.style.height = '';
    }
  }, [phase]);

  const handleOpen = useCallback(() => {
    if (phase !== 'collapsed' || isAnimatingRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const collapsedHeight = container.offsetHeight;
    collapsedHeightRef.current = collapsedHeight;

    isAnimatingRef.current = true;

    if (reducedMotion()) {
      const topNow = container.getBoundingClientRect().top;
      scrollTo(Math.max(0, topNow + getScrollPosition()), { instant: true });
      setPhase('expanded');
      isAnimatingRef.current = false;
      return;
    }

    // Pin the article to its current height before the layout swap so
    // nothing jumps when the content mounts in flow.
    container.style.transition = 'none';
    container.style.height = `${collapsedHeight}px`;

    setPhase('animating');
    // Continues in the 'animating' useLayoutEffect below.
  }, [phase, getScrollPosition, scrollTo]);

  // After the swap to 'animating' commits: scroll the preview video's
  // vertical centre to the viewport's vertical centre and play the open
  // height shutter.
  //
  // Desktop uses a snap-trick. The centre target sits deep in the page,
  // and SmoothScrollContext.scrollTo clamps to the CURRENT maxScroll —
  // which, while the card is still collapsed, is too small, so the
  // target would be chopped short. So: temporarily grow the article to
  // its expanded height (the document reaches its post-expand size),
  // call scrollTo (now the target survives the clamp), snap the article
  // back to collapsed, then start the real height transition — all in
  // one rAF so the snapped states never paint.
  //
  // Mobile (native scroll) can't snap-trick: a native smooth-scroll
  // race-conditions with the document growing under it. Mobile runs the
  // shutter first and centres the video afterwards (handleTransitionEnd),
  // once the document is already at full height.
  useLayoutEffect(() => {
    if (phase !== 'animating') return;
    const container = containerRef.current;
    if (!container) return;

    const collapsedHeight = collapsedHeightRef.current;
    container.style.transition = 'none';
    container.style.height = `${collapsedHeight}px`;
    const targetHeight = container.scrollHeight;

    let cancelled = false;

    if (!isDesktop) {
      const rafId = requestAnimationFrame(() => {
        if (cancelled) return;
        container.style.transition = OPEN_TRANSITION;
        container.style.height = `${targetHeight}px`;
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
      };
    }

    const rafId = requestAnimationFrame(() => {
      if (cancelled) return;

      // Grow the document so scrollTo clamps against the full maxScroll.
      container.style.transition = 'none';
      container.style.height = `${targetHeight}px`;
      container.getBoundingClientRect();

      // Centre the preview video; fall back to top-aligning the article.
      const video = container.querySelector('video');
      let targetScroll;
      if (video) {
        const vr = video.getBoundingClientRect();
        targetScroll = Math.max(
          0,
          vr.top + getScrollPosition() + vr.height / 2 - window.innerHeight / 2,
        );
      } else {
        targetScroll = Math.max(
          0,
          container.getBoundingClientRect().top + getScrollPosition(),
        );
      }
      scrollTo(targetScroll, { ease: 0.05 });

      // Snap back to collapsed, then play the real height transition.
      container.style.height = `${collapsedHeight}px`;
      container.getBoundingClientRect();
      container.style.transition = OPEN_TRANSITION;
      container.style.height = `${targetHeight}px`;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [phase, getScrollPosition, scrollTo, isDesktop]);

  const handleClose = useCallback((e) => {
    if (e) e.stopPropagation();
    if (phase !== 'expanded' || isAnimatingRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    isAnimatingRef.current = true;

    if (reducedMotion()) {
      setPhase('collapsed');
      isAnimatingRef.current = false;
      return;
    }

    const expandedHeight = container.offsetHeight;
    container.style.transition = 'none';
    container.style.height = `${expandedHeight}px`;

    setPhase('closing');
  }, [phase]);

  // Drive the close animation: content opacity fade + scroll the
  // collapsed band to the viewport top + height shutter.
  useLayoutEffect(() => {
    if (phase !== 'closing') return;
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container) return;

    if (content) {
      content.style.transition = `opacity ${CONTENT_FADE_OUT_MS}ms ease-out`;
      content.style.opacity = '0';
    }

    container.getBoundingClientRect();

    const targetHeight =
      collapsedHeightRef.current || (window.innerWidth >= 768 ? 36 : 0);

    const absoluteTop =
      container.getBoundingClientRect().top + getScrollPosition();
    scrollTo(Math.max(0, absoluteTop), isDesktop ? { ease: 0.05 } : undefined);

    const rafId = requestAnimationFrame(() => {
      container.style.transition = CLOSE_TRANSITION;
      container.style.height = `${targetHeight}px`;
    });

    return () => cancelAnimationFrame(rafId);
  }, [phase, getScrollPosition, scrollTo, isDesktop]);

  const handleTransitionEnd = useCallback((e) => {
    if (e.target !== containerRef.current || e.propertyName !== 'height') return;
    if (phase === 'animating') {
      setPhase('expanded');
      isAnimatingRef.current = false;
      // Mobile centres the video now — the document is at full height so
      // the native scroll isn't clamped short (see the open useLayoutEffect).
      if (!isDesktop) {
        const container = containerRef.current;
        const video = container?.querySelector('video');
        if (video) {
          const vr = video.getBoundingClientRect();
          scrollTo(
            Math.max(
              0,
              vr.top + getScrollPosition() + vr.height / 2 - window.innerHeight / 2,
            ),
          );
        }
      }
    } else if (phase === 'closing') {
      setPhase('collapsed');
      isAnimatingRef.current = false;
    }
  }, [phase, isDesktop, getScrollPosition, scrollTo]);

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

  const isInteractive      = phase === 'collapsed' || phase === 'expanded';
  const showOverlay        = phase === 'collapsed' || phase === 'animating' || phase === 'closing';
  const showContent        = phase !== 'collapsed';
  const showCloseIndicator = phase === 'expanded' || phase === 'closing';
  // Overlay is hidden during the open animation, and during the leading
  // portion of the close (before closingOverlayVisible flips true).
  const overlayHidden =
    phase === 'animating' || (phase === 'closing' && !closingOverlayVisible);

  return (
    <article
      ref={containerRef}
      data-collapsed-film-card
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
      className={`w-full bg-white relative ${phase === 'collapsed' ? 'cursor-pointer' : ''} ${phase === 'expanded' ? 'cursor-pointer group' : ''} ${phase !== 'collapsed' ? 'col-span-2 md:col-span-1' : ''}`}
      style={{
        overflow: phase !== 'expanded' ? 'hidden' : undefined,
      }}
    >
      {/* Collapsed band overlay — `relative` at every width when collapsed:
          it sits in flow and sizes the article, so a band whose text wraps
          to two lines grows to fit instead of clipping into its neighbour.
          py-2 + md:min-h-[36px] keep a one-line row at ≈36 px. (During the
          open/close animation the overlay is `absolute` so it can slide
          independently of the revealed content.) Three independent
          black-on-white hover chips (group/row). */}
      {showOverlay && (
        <div
          className={`${phase === 'collapsed' ? 'relative group/row' : 'absolute'} top-0 left-0 right-0 bg-white z-10`}
          style={{
            transition: `transform ${OVERLAY_TRANSITION_MS}ms ease-out, opacity ${OVERLAY_TRANSITION_MS}ms ease-out`,
            transform: overlayHidden ? 'translateY(-100%)' : 'translateY(0)',
            opacity: overlayHidden ? 0 : 1,
          }}
        >
          {/* items-stretch (default): the 3 column boxes all stretch to the
              tallest one's height. Each <p> is itself a flex container
              (md:flex md:items-center) so its text sits vertically centred
              within that equal-height box. */}
          <div className="flex flex-col md:flex-row gap-[3px] md:gap-6 px-4 py-2 md:min-h-[36px]">
            <p className={`flex-1 md:flex md:items-center font-header font-semibold md:font-medium tracking-[1.8px] uppercase ${collapsedVariant.titlePl}`}>
              <span className="inline-block px-2 py-0.5 text-[13.5px] md:text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                {title}
              </span>
            </p>
            <p className="font-body tracking-[0.6px] hidden md:flex md:items-center">
              <span className="inline-block px-2 py-0.5 text-[11.5px] md:text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                {firstSentence}
              </span>
            </p>
            <p className={`flex-1 md:flex md:items-center md:justify-end font-header font-medium tracking-[1.5px] md:text-right uppercase whitespace-pre-wrap ${collapsedVariant.metaPr}`}>
              <span className="inline-block px-2 py-0.5 text-[10.5px] md:text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                <CardSubtitle parts={[year, category]} separator="  •  " />
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Expanded body — FeaturedFilmCard + close-X indicator. Mounted only
          while the card is open, exactly like CollapsedPhotoCard's
          showGallery. */}
      {showContent && (
        <div ref={contentRef} className="w-full">
          <FeaturedFilmCard
            film={film}
            index={index}
            onFilmClick={onFilmClick}
          />

          {/* Close indicator — small X revealed on hover (desktop) / always
              visible (touch). Inert until the card is expanded. */}
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
      )}
    </article>
  );
}

export default CollapsedFilmCard;
