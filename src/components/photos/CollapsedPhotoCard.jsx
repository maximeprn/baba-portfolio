/**
 * CollapsedPhotoCard — single-row band that expands directly into the
 * ExpandedPhotoGallery. Photo-page analogue of CollapsedFilmCard: same
 * shutter timing (1200 ms open / 600 ms close), same single-expand
 * orchestration via onWillExpand / onDidCollapse / closeSignal, but with
 * no FLIP morph and no in-card video — the expanded body is just the
 * same gallery used by FeaturedPhotoCard.
 *
 * Cross-card-type single-expand: a click here flushSync-collapses any
 * currently-expanded FeaturedPhotoCard (or other CollapsedPhotoCard) so
 * the new card's scroll anchor is correct. Mirror of FeaturedPhotoCard's
 * anchored open.
 *
 * Spec: .mdd/docs/06-collapsed-photo-cards.md
 */

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';

import ExpandedPhotoGallery from './ExpandedPhotoGallery';
import { useSmoothScrollContext } from '../../context/SmoothScrollContext';

const OPEN_DURATION_MS  = 1200;
const CLOSE_DURATION_MS = 600;
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const OPEN_TRANSITION   = `height ${OPEN_DURATION_MS}ms ${EASE}`;
const CLOSE_TRANSITION  = `height ${CLOSE_DURATION_MS}ms ${EASE}`;
const GALLERY_FADE_OUT_MS  = 200;
const OVERLAY_TRANSITION_MS = 500;
const OVERLAY_REVEAL_DELAY_MS = Math.max(0, CLOSE_DURATION_MS - OVERLAY_TRANSITION_MS);

// md:-prefixed classes so the staggered horizontal offset only kicks in
// on desktop (where it's a stylistic rhythm). On mobile the band is
// stacked, the offset is meaningless and just pushed text out of place.
const COLLAPSED_VARIANTS = [
  { titlePl: 'md:pl-6', metaPr: 'md:pr-2' },
  { titlePl: 'md:pl-2', metaPr: 'md:pr-8' },
  { titlePl: 'md:pl-8', metaPr: 'md:pr-4' },
];

function reducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function CollapsedPhotoCard({
  project,
  index = 0,
  onPhotoClick,
  onWillExpand,
  onDidCollapse,
  closeSignal = 0,
}) {
  const [phase, setPhase] = useState('collapsed'); // 'collapsed' | 'animating' | 'expanded' | 'closing'
  const [closingOverlayVisible, setClosingOverlayVisible] = useState(false);

  const articleRef         = useRef(null);
  const galleryWrapRef     = useRef(null);
  const collapsedHeightRef = useRef(0);
  const isAnimatingRef     = useRef(false);
  const pendingCloseRef    = useRef(false);
  const lastCloseSignalRef = useRef(closeSignal);
  const prevPhaseRef       = useRef(phase);

  const { scrollTo, getScrollPosition, isDesktop } = useSmoothScrollContext();
  const { id, title, description, year, client, category } = project;
  const variant = COLLAPSED_VARIANTS[index % COLLAPSED_VARIANTS.length];
  const firstSentence = (description.match(/^[^.!?]+[.!?]/)?.[0] || description).trim();

  // Notify parent the moment this card lands in 'collapsed' after a close.
  useEffect(() => {
    const wasNotCollapsed = prevPhaseRef.current !== 'collapsed';
    prevPhaseRef.current = phase;
    if (phase === 'collapsed' && wasNotCollapsed) {
      onDidCollapse?.(id);
    }
  }, [phase, onDidCollapse, id]);

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

  // Settle inline styles when phase reaches a stable state.
  useLayoutEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    if (phase === 'expanded') {
      article.style.transition = 'none';
      article.style.height = 'auto';
      const gallery = galleryWrapRef.current;
      if (gallery) {
        gallery.style.transition = '';
        gallery.style.opacity = '';
      }
    } else if (phase === 'collapsed') {
      article.style.transition = 'none';
      article.style.height = '';
    }
  }, [phase]);

  const handleOpen = useCallback(() => {
    if (phase !== 'collapsed' || isAnimatingRef.current) return;

    const article = articleRef.current;
    if (!article) return;

    // ANCHOR — viewport y of this article at click time. We keep this
    // INVARIANT across any currently-expanded sibling's collapse so the
    // user perceives the gallery unfolding right here, not after a long
    // scroll trip elsewhere.
    const articleTopPre = article.getBoundingClientRect().top;
    const scrollPre = getScrollPosition();

    // Force any currently-expanded sibling (Featured or Collapsed) to
    // collapse fully — state + DOM + style cleanup — synchronously.
    // flushSync flushes layout effects but not passive ones; siblings
    // listen for closeSignal in useLayoutEffect for exactly this reason.
    flushSync(() => {
      onWillExpand?.(id);
    });

    // Re-anchor: the sibling's collapse pulled this article up. Jump
    // scroll INSTANTLY to put it back at articleTopPre.
    const articleTopPost = article.getBoundingClientRect().top;
    const collapseDelta = articleTopPre - articleTopPost; // ≥ 0
    if (collapseDelta > 0) {
      scrollTo(Math.max(0, scrollPre - collapseDelta), { instant: true });
    }

    const collapsedHeight = article.offsetHeight;
    collapsedHeightRef.current = collapsedHeight;

    isAnimatingRef.current = true;

    if (reducedMotion()) {
      const articleTopNow = article.getBoundingClientRect().top;
      const scrollNow = getScrollPosition();
      scrollTo(Math.max(0, articleTopNow + scrollNow), { instant: true });
      setPhase('expanded');
      isAnimatingRef.current = false;
      return;
    }

    // Pin the article to its current height before the layout swap so
    // nothing jumps when the gallery mounts in flow.
    article.style.transition = 'none';
    article.style.height = `${collapsedHeight}px`;

    setPhase('animating');
    // Continues in the 'animating' useLayoutEffect below.
  }, [phase, onWillExpand, id, getScrollPosition, scrollTo]);

  // After the swap to 'animating' commits: top-align the article so its
  // top lands at viewport y=0 (the gallery's pinned header sits there)
  // and play the height transition.
  //
  // Desktop uses the snap-trick (expand → scrollTo with valid maxScroll
  // → snap collapsed → transition) so smooth-scroll's clamp doesn't
  // chop the target. Mobile native smooth-scroll race-conditions with
  // the doc-height changes mid-trick (see issue: "back-and-forth
  // scroll"), so we serialize: scroll to target first, await
  // scroll-end, THEN start the height transition.
  useLayoutEffect(() => {
    if (phase !== 'animating') return;
    const article = articleRef.current;
    if (!article) return;

    const collapsedHeight = collapsedHeightRef.current;
    article.style.transition = 'none';
    article.style.height = `${collapsedHeight}px`;
    const targetHeight = article.scrollHeight;

    let cancelled = false;

    const startHeightTransition = () => {
      if (cancelled) return;
      article.style.transition = OPEN_TRANSITION;
      article.style.height = `${targetHeight}px`;
    };

    if (!isDesktop) {
      // Mobile — serialize.
      const articleAbsoluteTop = article.getBoundingClientRect().top + getScrollPosition();
      const targetScroll = Math.max(0, articleAbsoluteTop);
      scrollTo(targetScroll).then(() => {
        if (cancelled) return;
        // One rAF so the browser commits the post-scroll layout before
        // we kick off the height transition.
        requestAnimationFrame(startHeightTransition);
      });
      return () => { cancelled = true; };
    }

    // Desktop — snap-trick: temporarily expand to grow the doc, scrollTo
    // with the valid (post-expand) maxScroll, snap back, then transition.
    const rafId = requestAnimationFrame(() => {
      article.style.transition = 'none';
      article.style.height = `${targetHeight}px`;
      article.getBoundingClientRect();

      const articleAbsoluteTop = article.getBoundingClientRect().top + getScrollPosition();
      const targetScroll = Math.max(0, articleAbsoluteTop);
      scrollTo(targetScroll, { ease: 0.05 });

      article.style.height = `${collapsedHeight}px`;
      article.getBoundingClientRect();
      startHeightTransition();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [phase, getScrollPosition, scrollTo, isDesktop]);

  const handleClose = useCallback((e) => {
    if (e) e.stopPropagation();
    if (phase !== 'expanded' || isAnimatingRef.current) return;

    const article = articleRef.current;
    if (!article) return;

    isAnimatingRef.current = true;

    if (reducedMotion()) {
      setPhase('collapsed');
      isAnimatingRef.current = false;
      return;
    }

    const expandedHeight = article.offsetHeight;
    article.style.transition = 'none';
    article.style.height = `${expandedHeight}px`;

    setPhase('closing');
  }, [phase]);

  // Drive the close animation: gallery opacity fade + height shutter +
  // scroll-up so the now-collapsed card lands at viewport top (instead
  // of leaving the user wherever they were inside the gallery).
  useLayoutEffect(() => {
    if (phase !== 'closing') return;
    const article = articleRef.current;
    const gallery = galleryWrapRef.current;
    if (!article) return;

    if (gallery) {
      gallery.style.transition = `opacity ${GALLERY_FADE_OUT_MS}ms ease-out`;
      gallery.style.opacity = '0';
    }

    article.getBoundingClientRect();

    const targetHeight =
      collapsedHeightRef.current || (window.innerWidth >= 768 ? 36 : 0);

    // Scroll the collapsed card's top to viewport y=0 in parallel with
    // the height collapse. Browser clamps to maxScroll if the article
    // sits too close to doc end after close — that's fine; the user
    // lands "as close to article-top as the doc allows".
    const articleAbsoluteTop =
      article.getBoundingClientRect().top + getScrollPosition();
    scrollTo(Math.max(0, articleAbsoluteTop), isDesktop ? { ease: 0.05 } : undefined);

    const rafId = requestAnimationFrame(() => {
      article.style.transition = CLOSE_TRANSITION;
      article.style.height = `${targetHeight}px`;
    });

    return () => cancelAnimationFrame(rafId);
  }, [phase, getScrollPosition, scrollTo, isDesktop]);

  const handleTransitionEnd = useCallback((e) => {
    if (e.target !== articleRef.current || e.propertyName !== 'height') return;
    if (phase === 'animating') {
      setPhase('expanded');
      isAnimatingRef.current = false;
      if (pendingCloseRef.current) {
        pendingCloseRef.current = false;
        requestAnimationFrame(() => handleClose());
      }
    } else if (phase === 'closing') {
      setPhase('collapsed');
      isAnimatingRef.current = false;
    }
  }, [phase, handleClose]);

  // Auto-close when parent bumps closeSignal. INSTANT collapse — no fade,
  // no shutter. useLayoutEffect (not useEffect) so flushSync from a sibling
  // open path can drain this fully before the new card captures its
  // anchor + FIRST rects.
  useLayoutEffect(() => {
    if (closeSignal === lastCloseSignalRef.current) return;
    lastCloseSignalRef.current = closeSignal;
    if (phase !== 'collapsed') {
      isAnimatingRef.current = false;
      pendingCloseRef.current = false;
      setPhase('collapsed');
    }
  }, [closeSignal, phase]);

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

  const isInteractive = phase === 'collapsed' || phase === 'expanded';
  const showOverlay   = phase === 'collapsed' || phase === 'animating' || phase === 'closing';
  const showGallery   = phase !== 'collapsed';
  const overlayHidden =
    phase === 'animating' || (phase === 'closing' && !closingOverlayVisible);

  return (
    <article
      ref={articleRef}
      data-collapsed-photo-card
      data-project-slug={project.slug}
      onClick={isInteractive ? handleArticleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      onTransitionEnd={handleTransitionEnd}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-expanded={phase !== 'collapsed'}
      aria-label={
        phase === 'collapsed'
          ? `Expand ${title} photo gallery`
          : phase === 'expanded'
            ? `Collapse ${title} photo gallery`
            : undefined
      }
      className={`w-full bg-white relative ${phase === 'collapsed' ? 'cursor-pointer md:h-9' : ''} ${phase === 'expanded' ? 'cursor-pointer group' : ''}`}
      style={{
        // clip-path (not overflow:hidden) so the sticky gallery header
        // continues to treat the viewport as its scroll ancestor on mobile.
        // Same trade-off documented in FeaturedPhotoCard.
        clipPath: phase !== 'expanded' ? 'inset(0)' : undefined,
      }}
    >
      {/* Collapsed band overlay — same visual + variant padding pattern as
          CollapsedFilmCard. Three independent hover chips (group/row).
          Mobile: relative (sizes the article naturally).
          Desktop: absolute (article fixed at md:h-9 = 36 px). */}
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
            <p className={`flex-1 font-header font-medium tracking-[1.8px] uppercase ${variant.titlePl}`}>
              <span className="inline-block px-2 py-0.5 text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                {title}
              </span>
            </p>
            <p className="font-body tracking-[0.6px] shrink-0 hidden md:block">
              <span className="inline-block px-2 py-0.5 text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                {firstSentence}
              </span>
            </p>
            <p className={`flex-1 font-header font-medium tracking-[1.5px] md:text-right uppercase whitespace-pre-wrap ${variant.metaPr}`}>
              <span className="inline-block px-2 py-0.5 text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                {year}  •  {client}  •  {category}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Expanded gallery body — reuses ExpandedPhotoGallery, including its
          sticky pinned header (mobile) / JS pin (desktop), masonry, and
          close-X strip. Click on the pinned header bubbles to the article
          and triggers handleClose, mirroring FeaturedPhotoCard. */}
      {showGallery && (
        <div ref={galleryWrapRef} className="w-full">
          <ExpandedPhotoGallery
            project={project}
            pinHeader={phase !== 'collapsed'}
            onPhotoClick={onPhotoClick}
            onClose={handleClose}
          />
        </div>
      )}
    </article>
  );
}

export default CollapsedPhotoCard;
