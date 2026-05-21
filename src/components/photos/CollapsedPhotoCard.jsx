/**
 * CollapsedPhotoCard — single-row band that expands directly into the
 * ExpandedPhotoGallery. Photo-page analogue of CollapsedFilmCard: same
 * shutter timing (1200 ms open / 600 ms close), same single-expand
 * orchestration via onWillExpand / onDidCollapse / closeSignal, but with
 * no FLIP morph and no in-card video — the expanded body is just the
 * same gallery used by FeaturedPhotoCard.
 *
 * Cross-card-type single-expand: a click here triggers an animated
 * close of any currently-expanded photo card (Featured or Collapsed)
 * via parent's closeSignal bump. The opening card's smooth-scroll
 * targets the SIBLING-DELTA-corrected position so the close animation
 * and the open animation run in parallel without competing scrolls.
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

  const { scrollTo, getScrollPosition, isDesktop, setScrollLocked } = useSmoothScrollContext();
  const { id, title, description, year, category } = project;
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

    // Tell the parent we're opening — it'll bump the previously-expanded
    // sibling's closeSignal, which triggers that sibling's animated
    // close. Do NOT flushSync: we want the sibling's close and our open
    // to animate in parallel so the user perceives a single coordinated
    // motion (B expanding) instead of "A snaps shut → page jumps → B
    // expands" three-step shuffle.
    onWillExpand?.(id);

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

    // Scroll target: this article's TOP at viewport y=0. The sibling
    // (if any) stays expanded above us throughout the smooth-scroll —
    // by the time the scroll settles, the sibling has been pushed
    // off-screen above the viewport. The sibling's actual collapse
    // happens AFTER our open transition finishes (see
    // handleTransitionEnd → 'photo-card-expand-done' event), at which
    // point it's invisible to the user.
    const articleAbsoluteTop = article.getBoundingClientRect().top + getScrollPosition();
    const targetScroll = Math.max(0, articleAbsoluteTop);

    let cancelled = false;

    const startHeightTransition = () => {
      if (cancelled) return;
      article.style.transition = OPEN_TRANSITION;
      article.style.height = `${targetHeight}px`;
    };

    if (!isDesktop) {
      scrollTo(targetScroll).then(() => {
        if (cancelled) return;
        requestAnimationFrame(startHeightTransition);
      });
      return () => { cancelled = true; };
    }

    scrollTo(targetScroll, { ease: 0.05 });
    const rafId = requestAnimationFrame(startHeightTransition);
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

    // User-initiated close (sibling-triggered closes bypass this
    // 'closing' phase and go straight to 'collapsed' via the
    // photo-card-expand-done event listener). Always scroll the
    // collapsed card top to viewport y=0 so the user doesn't land mid-
    // gallery.
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
      // Notify any sibling that's been waiting to collapse. The sibling
      // listens for this on the window and will instant-collapse +
      // instant-scroll-adjust off-screen, invisibly.
      const article = articleRef.current;
      if (article) {
        const sourceTop = article.getBoundingClientRect().top + getScrollPosition();
        window.dispatchEvent(new CustomEvent('photo-card-expand-done', {
          detail: { sourceTop },
        }));
      }
      if (pendingCloseRef.current) {
        pendingCloseRef.current = false;
        requestAnimationFrame(() => handleClose());
      }
    } else if (phase === 'closing') {
      setPhase('collapsed');
      isAnimatingRef.current = false;
    }
  }, [phase, handleClose, getScrollPosition]);

  // Auto-close when parent bumps closeSignal. We DELAY the actual
  // collapse until the new card finishes expanding ('photo-card-expand-
  // done' window event). By then the new card has scrolled the user
  // past us — we're off-screen above the viewport — so we can collapse
  // INSTANTLY (no animation) and the user never sees the layout shift.
  //
  // We also instant-scroll the document up by our (expanded − collapsed)
  // delta in the same JS execution, so the new card's top stays anchored
  // at viewport y=0 across our removal from doc flow. Browsers paint
  // both updates as one frame → invisible.
  useLayoutEffect(() => {
    if (closeSignal === lastCloseSignalRef.current) return;
    lastCloseSignalRef.current = closeSignal;

    if (phase === 'expanded') {
      let active = true;
      const handleExpandDone = (e) => {
        if (!active) return;
        active = false;
        window.removeEventListener('photo-card-expand-done', handleExpandDone);

        const article = articleRef.current;
        if (!article) {
          setPhase('collapsed');
          return;
        }

        const expHeight = article.offsetHeight;
        const colHeight = collapsedHeightRef.current || 0;
        const delta = Math.max(0, expHeight - colHeight);

        // Compensate scrollY only if we sit ABOVE the source card —
        // collapsing below the user's viewport doesn't shift content
        // upward, so no adjustment is needed there.
        const myTop = article.getBoundingClientRect().top + getScrollPosition();
        const sourceTop = e.detail?.sourceTop ?? myTop;
        const isAbove = myTop < sourceTop;

        if (isAbove && delta > 0) {
          // Collapse + scroll-compensate as one atomic, synchronous step.
          // flushSync forces the collapse to commit to the DOM *now*, so
          // the browser cannot paint a frame where the scroll has moved
          // up but the old card is still expanded — which flickers it
          // back into view. (The collapse only shrinks the document
          // height; it does not change getScrollPosition()'s value.)
          const newScrollY = Math.max(0, getScrollPosition() - delta);
          flushSync(() => setPhase('collapsed'));
          scrollTo(newScrollY, { instant: true });
        } else {
          setPhase('collapsed');
        }
      };
      window.addEventListener('photo-card-expand-done', handleExpandDone);
      return () => {
        active = false;
        window.removeEventListener('photo-card-expand-done', handleExpandDone);
      };
    } else if (phase !== 'collapsed') {
      // Mid-animation phases — just collapse instantly, no waiting.
      isAnimatingRef.current = false;
      pendingCloseRef.current = false;
      setPhase('collapsed');
    }
    return undefined;
  }, [closeSignal, phase, getScrollPosition, scrollTo]);

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
      className={`w-full bg-white relative ${phase === 'collapsed' ? 'cursor-pointer' : ''} ${phase === 'expanded' ? 'cursor-pointer group' : ''} ${phase !== 'collapsed' ? 'col-span-2 md:col-span-1' : ''}`}
      style={{
        // clip-path (not overflow:hidden) so the sticky gallery header
        // continues to treat the viewport as its scroll ancestor on mobile.
        // Same trade-off documented in FeaturedPhotoCard.
        clipPath: phase !== 'expanded' ? 'inset(0)' : undefined,
      }}
    >
      {/* Collapsed band overlay — same visual + variant padding pattern as
          CollapsedFilmCard. Three independent hover chips (group/row).
          `relative` at every width when collapsed: it sizes the article,
          so a band whose text wraps to two lines grows to fit instead of
          clipping into its neighbour. py-2 + md:min-h-[36px] keep a
          one-line row at ≈36 px. */}
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
            <p className={`flex-1 md:flex md:items-center font-header font-semibold md:font-medium tracking-[1.8px] uppercase ${variant.titlePl}`}>
              <span className="inline-block px-2 py-0.5 text-[13.5px] md:text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                {title}
              </span>
            </p>
            <p className="font-body tracking-[0.6px] hidden md:flex md:items-center">
              <span className="inline-block px-2 py-0.5 text-[11.5px] md:text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                {firstSentence}
              </span>
            </p>
            <p className={`flex-1 md:flex md:items-center md:justify-end font-header font-medium tracking-[1.5px] md:text-right uppercase whitespace-pre-wrap ${variant.metaPr}`}>
              <span className="inline-block px-2 py-0.5 text-[10.5px] md:text-xs leading-[1.3] group-hover/row:bg-gray-900 group-hover/row:text-white">
                {year}  •  {category}
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
