/**
 * FeaturedPhotoCard — phase-machine + FLIP-morph wrapper around
 * PhotoCardPreview (collapsed) and ExpandedPhotoGallery (expanded).
 *
 * The 2–3 photos that appear in the collapsed collage AND in the gallery
 * (matched by `data-photo-idx`) morph between layouts via FLIP: First, Last,
 * Invert, Play. Non-preview gallery cells fade in with a small stagger.
 * Close is intentionally a fast fade + height shutter (no inverse morph),
 * matching the asymmetric open/close timing established by CollapsedFilmCard.
 *
 * Spec: .mdd/docs/05-featured-photo-cards.md
 */

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';

import PhotoCardPreview from './PhotoCardPreview';
import ExpandedPhotoGallery from './ExpandedPhotoGallery';
import { useSmoothScrollContext } from '../../context/SmoothScrollContext';

const OPEN_DURATION_MS  = 1200;
const CLOSE_DURATION_MS = 600;
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const OPEN_TRANSITION   = `height ${OPEN_DURATION_MS}ms ${EASE}`;
const CLOSE_TRANSITION  = `height ${CLOSE_DURATION_MS}ms ${EASE}`;
const CELL_FADE_DURATION_MS = 400;
const CELL_FADE_STAGGER_MS  = 30;
const GALLERY_FADE_OUT_MS   = 200;
const OVERLAY_TRANSITION_MS = 500;
// Slide the collapsed preview in over the *tail* of the close so it lands
// fully visible exactly when the height transition ends.
const OVERLAY_REVEAL_DELAY_MS = Math.max(0, CLOSE_DURATION_MS - OVERLAY_TRANSITION_MS);

function reducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function FeaturedPhotoCard({
  project,
  index = 0,
  onPhotoClick,
  onWillExpand,
  onDidCollapse,
  closeSignal = 0,
}) {
  const [phase, setPhase] = useState('collapsed'); // 'collapsed' | 'animating-open' | 'expanded' | 'animating-close'
  const [overlayVisible, setOverlayVisible] = useState(false);

  const articleRef         = useRef(null);
  const previewWrapRef     = useRef(null);
  const galleryWrapRef     = useRef(null);
  const collapsedHeightRef = useRef(0);
  const isAnimatingRef     = useRef(false);
  const pendingCloseRef    = useRef(false);
  const lastCloseSignalRef = useRef(closeSignal);
  const firstRectsRef      = useRef(new Map()); // photoIdx → DOMRect
  const prevPhaseRef       = useRef(phase);

  const { scrollTo, getScrollPosition, isDesktop } = useSmoothScrollContext();
  const { id, title, description, year, client, category } = project;
  // Alternate by row: even rows → image left, odd rows → image right.
  const isImageLeft = index % 2 === 0;

  // Notify parent when the card lands in 'collapsed' after a close.
  useEffect(() => {
    const wasNotCollapsed = prevPhaseRef.current !== 'collapsed';
    prevPhaseRef.current = phase;
    if (phase === 'collapsed' && wasNotCollapsed) {
      onDidCollapse?.(id);
    }
  }, [phase, onDidCollapse, id]);

  // Closing-tail overlay reveal scheduler.
  useEffect(() => {
    if (phase !== 'animating-close') {
      setOverlayVisible(false);
      return;
    }
    const t = setTimeout(() => setOverlayVisible(true), OVERLAY_REVEAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // Settle inline styles when phase reaches a stable state.
  useLayoutEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    if (phase === 'expanded') {
      article.style.transition = 'none';
      article.style.height = 'auto';
      article.style.clipPath = '';
      const gallery = galleryWrapRef.current;
      if (gallery) {
        gallery.style.transition = '';
        gallery.style.opacity = '';
        gallery.querySelectorAll('[data-fpc-gallery-img="1"]').forEach((img) => {
          img.style.transition = '';
          img.style.transform = '';
          img.style.transformOrigin = '';
          img.style.zIndex = '';
        });
        gallery.querySelectorAll('[data-fpc-cell]').forEach((cell) => {
          cell.style.transition = '';
          cell.style.opacity = '';
        });
      }
    } else if (phase === 'collapsed') {
      article.style.transition = 'none';
      article.style.height = '';
      article.style.clipPath = '';
      delete article.dataset.fpcEh;
      delete article.dataset.fpcCh;
    }
  }, [phase]);

  const handleOpen = useCallback(() => {
    if (phase !== 'collapsed' || isAnimatingRef.current) return;

    const article = articleRef.current;
    const previewWrap = previewWrapRef.current;
    if (!article || !previewWrap) return;

    // Tell the parent we're opening — it bumps the previously-expanded
    // sibling's closeSignal, which triggers that sibling's animated
    // close. No flushSync: we WANT the sibling's close and our open to
    // animate in parallel so the user perceives a single coordinated
    // motion (B expanding) rather than "A snaps shut, page jumps, B
    // expands" three-step shuffle.
    onWillExpand?.(id);

    // FIRST rects: snapshot preview imgs at click time. The sibling has
    // received closeSignal but hasn't actually collapsed yet (its close
    // animation is starting in parallel), so these rects reflect what
    // the user sees on screen the instant they tapped.
    const firstRects = new Map();
    previewWrap.querySelectorAll('[data-fpc-preview="1"]').forEach((img) => {
      const idx = parseInt(img.dataset.photoIdx, 10);
      firstRects.set(idx, img.getBoundingClientRect());
    });
    firstRectsRef.current = firstRects;

    const collapsedHeight = article.offsetHeight;
    collapsedHeightRef.current = collapsedHeight;

    isAnimatingRef.current = true;

    if (reducedMotion()) {
      // Snap to expanded with title at viewport top, instant.
      const articleTopNow = article.getBoundingClientRect().top;
      const scrollNow = getScrollPosition();
      scrollTo(Math.max(0, articleTopNow + scrollNow), { instant: true });
      setPhase('expanded');
      isAnimatingRef.current = false;
      return;
    }

    // Pin the article to its current height before the layout swap so
    // nothing jumps when the gallery mounts in flow. We use clip-path
    // instead of overflow:hidden so the gallery header's `position: sticky`
    // (active on mobile) keeps treating the viewport as its scroll ancestor
    // — overflow:hidden would re-anchor sticky to the article and pop the
    // header out of the viewport on close.
    article.style.transition = 'none';
    article.style.height = `${collapsedHeight}px`;
    article.style.clipPath = 'inset(0)';

    setPhase('animating-open');
    // Continues in the 'animating-open' useLayoutEffect below.
  }, [phase, onWillExpand, id, getScrollPosition, scrollTo]);

  // After the swap to 'animating-open' commits: measure LAST rects,
  // invert each preview img to its FIRST position, then play under transition.
  useLayoutEffect(() => {
    if (phase !== 'animating-open') return;
    const article = articleRef.current;
    const gallery = galleryWrapRef.current;
    if (!article || !gallery) return;

    const galleryImgs = Array.from(gallery.querySelectorAll('[data-fpc-gallery-img="1"]'));
    const morphImgs = [];
    galleryImgs.forEach((img) => {
      const idx = parseInt(img.dataset.photoIdx, 10);
      const first = firstRectsRef.current.get(idx);
      if (!first) return;
      const last = img.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top  - last.top;
      const ds = last.width > 0 ? first.width / last.width : 1;
      img.style.transition = 'none';
      img.style.transformOrigin = 'top left';
      img.style.transform = `translate(${dx}px, ${dy}px) scale(${ds})`;
      img.style.zIndex = '2';
      morphImgs.push(img);
    });

    const cells = Array.from(gallery.querySelectorAll('[data-fpc-cell]'));
    cells.forEach((cell) => {
      const idx = parseInt(cell.dataset.fpcCell, 10);
      if (firstRectsRef.current.has(idx)) return; // morph cell — keep visible
      cell.style.transition = 'none';
      cell.style.opacity = '0';
    });

    const collapsedHeight = collapsedHeightRef.current;
    article.style.transition = 'none';
    article.style.height = `${collapsedHeight}px`;
    article.style.clipPath = 'inset(0)';

    // scrollHeight reflects the natural content height now that gallery is in flow.
    const targetHeight = article.scrollHeight;
    article.dataset.fpcEh = String(targetHeight);
    article.dataset.fpcCh = String(collapsedHeight);

    article.getBoundingClientRect();

    // Smooth-scroll our top to viewport y=0. The previously-expanded
    // sibling (if any) stays expanded above us throughout the scroll —
    // by the time the scroll settles, the sibling has been pushed
    // off-screen above viewport. The sibling's actual collapse fires
    // AFTER our open transition ends, off-screen, with a synchronous
    // scrollY compensation (see handleTransitionEnd → 'photo-card-
    // expand-done' event).
    const articleTop = article.getBoundingClientRect().top;
    const currentScroll = getScrollPosition();
    const targetScroll = Math.max(0, articleTop + currentScroll);

    let cancelled = false;

    const startMorph = () => {
      if (cancelled) return;
      article.style.transition = OPEN_TRANSITION;
      article.style.height = `${targetHeight}px`;

      morphImgs.forEach((img) => {
        img.style.transition = `transform ${OPEN_DURATION_MS}ms ${EASE}`;
        img.style.transform = '';
      });

      cells.forEach((cell, i) => {
        const idx = parseInt(cell.dataset.fpcCell, 10);
        if (firstRectsRef.current.has(idx)) return;
        const stagger = Math.min(
          i * CELL_FADE_STAGGER_MS,
          OPEN_DURATION_MS - CELL_FADE_DURATION_MS,
        );
        cell.style.transition = `opacity ${CELL_FADE_DURATION_MS}ms ${EASE} ${stagger}ms`;
        cell.style.opacity = '1';
      });
    };

    if (!isDesktop) {
      // Mobile — serialize: scroll first, then run the morph + height
      // transition. Native smooth-scroll race-conditions with the doc
      // growing under it, so we wait for the scroll to settle before
      // kicking off the rest. The FLIP transform is doc-relative
      // (translates from the gallery cell's NATURAL position), so it
      // tracks the page during the scroll without re-measurement —
      // re-snapshotting Last rects post-scroll would cause a visible
      // jump.
      scrollTo(targetScroll).then(() => {
        if (cancelled) return;
        requestAnimationFrame(startMorph);
      });
      return () => { cancelled = true; };
    }

    const rafId = requestAnimationFrame(() => {
      scrollTo(targetScroll, { ease: 0.05 });
      startMorph();
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

    const expandedHeight = article.offsetHeight;
    isAnimatingRef.current = true;

    if (reducedMotion()) {
      setPhase('collapsed');
      isAnimatingRef.current = false;
      return;
    }

    article.style.transition = 'none';
    article.style.height = `${expandedHeight}px`;
    article.style.clipPath = 'inset(0)';

    setPhase('animating-close');
  }, [phase]);

  // Drive the close animation: gallery opacity fade + height shutter +
  // scroll-up so the now-collapsed card lands at viewport top (instead
  // of leaving the user wherever they were inside the gallery).
  useLayoutEffect(() => {
    if (phase !== 'animating-close') return;
    const article = articleRef.current;
    const gallery = galleryWrapRef.current;
    if (!article) return;

    if (gallery) {
      gallery.style.transition = `opacity ${GALLERY_FADE_OUT_MS}ms ease-out`;
      gallery.style.opacity = '0';
    }

    article.getBoundingClientRect();

    const targetHeight = collapsedHeightRef.current || 0;

    // User-initiated close (sibling-triggered closes bypass this
    // 'animating-close' phase). Always scroll the collapsed card top to
    // viewport y=0 so the user doesn't land mid-gallery.
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
    if (phase === 'animating-open') {
      setPhase('expanded');
      isAnimatingRef.current = false;
      // Notify any sibling that's been waiting to collapse.
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
    } else if (phase === 'animating-close') {
      setPhase('collapsed');
      isAnimatingRef.current = false;
    }
  }, [phase, handleClose, getScrollPosition]);

  // Auto-close when parent bumps closeSignal. We DELAY the actual
  // collapse until the new card finishes expanding (window event
  // 'photo-card-expand-done'). By then the new card has scrolled the
  // user past us — we're off-screen above the viewport — so we collapse
  // INSTANTLY (no animation) and instant-scroll-adjust scrollY by our
  // (expanded − collapsed) delta in the same JS execution. The browser
  // paints both updates as one frame → invisible to the user.
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

        const myTop = article.getBoundingClientRect().top + getScrollPosition();
        const sourceTop = e.detail?.sourceTop ?? myTop;
        const isAbove = myTop < sourceTop;

        setPhase('collapsed');
        if (isAbove && delta > 0) {
          const newScrollY = Math.max(0, getScrollPosition() - delta);
          scrollTo(newScrollY, { instant: true });
        }
      };
      window.addEventListener('photo-card-expand-done', handleExpandDone);
      return () => {
        active = false;
        window.removeEventListener('photo-card-expand-done', handleExpandDone);
      };
    } else if (phase !== 'collapsed') {
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

  const isInteractive    = phase === 'collapsed' || phase === 'expanded';
  const showPreview      = phase === 'collapsed' || phase === 'animating-close';
  const showGallery      = phase !== 'collapsed';
  const previewIsOverlay = phase === 'animating-close';

  return (
    <article
      ref={articleRef}
      data-featured-photo-card
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
      className={`relative w-full bg-white ${isInteractive ? 'cursor-pointer' : ''} ${phase === 'expanded' ? 'group' : ''}`}
    >
      {/* COLLAPSED PREVIEW — title/meta + collage. Becomes an absolute overlay
          during 'animating-close' so it can slide in over the tail of the
          height transition. */}
      {showPreview && (
        <div
          ref={previewWrapRef}
          className={
            previewIsOverlay
              ? 'absolute top-0 left-0 right-0 bg-white z-10'
              : 'relative w-full'
          }
          style={
            previewIsOverlay
              ? {
                  transition: `transform ${OVERLAY_TRANSITION_MS}ms ease-out, opacity ${OVERLAY_TRANSITION_MS}ms ease-out`,
                  transform: overlayVisible ? 'translateY(0)' : 'translateY(-100%)',
                  opacity: overlayVisible ? 1 : 0,
                }
              : undefined
          }
        >
          <div
            className={`flex flex-col-reverse gap-4 px-4 md:px-0 py-8 md:py-10 md:items-center ${
              // Asymmetric gap. Image-LEFT / text-RIGHT: text *starts* right
              // after the gap, needs breathing room → 96px. Text-LEFT /
              // image-RIGHT: text is left-aligned so its content naturally
              // ends well before the column edge, leaving a big visual
              // buffer already → 32px is plenty.
              isImageLeft
                ? 'md:gap-x-24 md:flex-row'
                : 'md:gap-x-8 md:flex-row-reverse'
            }`}
          >
            {/* Collage half */}
            <div className="w-full md:w-[47%]">
              <PhotoCardPreview project={project} />
            </div>

            {/* Text half — no stopPropagation: clicking the title or any
                text bubbles to the article and triggers expand/collapse. */}
            <div className="w-full md:w-[47%] flex flex-col">
              <h3 className="font-header text-lg md:text-2xl font-medium tracking-widest uppercase leading-tight">
                <span className="px-2 py-0.5 box-decoration-clone transition-colors duration-150 hover:bg-gray-900 hover:text-white">
                  {title}
                </span>
              </h3>
              <div className="mt-3 font-header text-xs tracking-widest text-primary uppercase">
                {year}
                <span className="mx-3">•</span>
                {client}
                <span className="mx-3">•</span>
                {category}
              </div>
              {description && (
                <p className="mt-4 font-header text-xs tracking-[0.15em] leading-6 text-primary">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED GALLERY */}
      {showGallery && (
        <div ref={galleryWrapRef} className="w-full">
          <ExpandedPhotoGallery
            project={project}
            /* Pin the header for the entire non-collapsed lifecycle —
               not just 'expanded'. Otherwise a user who wheels during
               the 1200 ms open animation watches the header scroll past
               and then snap back when the pin finally engages. */
            pinHeader={phase !== 'collapsed'}
            onPhotoClick={onPhotoClick}
            onClose={handleClose}
          />
        </div>
      )}
    </article>
  );
}

export default FeaturedPhotoCard;
