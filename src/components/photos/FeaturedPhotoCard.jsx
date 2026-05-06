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
import { flushSync } from 'react-dom';

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
  imagePosition = 'left',
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

  const { scrollTo, getScrollPosition } = useSmoothScrollContext();
  const { id, title, description, year, client, category } = project;
  const isImageLeft = imagePosition === 'left';

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
      article.style.overflow = '';
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
      article.style.overflow = '';
      delete article.dataset.fpcEh;
      delete article.dataset.fpcCh;
    }
  }, [phase]);

  const handleOpen = useCallback(() => {
    if (phase !== 'collapsed' || isAnimatingRef.current) return;

    const article = articleRef.current;
    const previewWrap = previewWrapRef.current;
    if (!article || !previewWrap) return;

    // ANCHOR — the viewport y-coord of this article at click time. We will
    // keep this position INVARIANT across the previously-expanded sibling's
    // collapse so the user perceives the gallery unfolding right here, not
    // after a long scroll trip across the document.
    const articleTopPre = article.getBoundingClientRect().top;
    const scrollPre = getScrollPosition();

    // Force the previously-expanded sibling (if any) to collapse fully —
    // state + DOM + style cleanup — synchronously, before we go on. We
    // moved the sibling's closeSignal handler to useLayoutEffect for this
    // reason: flushSync flushes layout effects but not passive ones, so
    // by the end of this block the other card's article has shrunk to its
    // collapsed height and its [data-fpc-eh] markers are gone. No paint
    // happens between this and our re-anchor below — the user never sees
    // the intermediate state.
    flushSync(() => {
      onWillExpand?.(id);
    });

    // Re-anchor: the sibling's collapse pulled this article up in the
    // viewport because the wrapper's translateY hasn't moved yet. Jump
    // scroll INSTANTLY (no animation) so this article is back at exactly
    // articleTopPre. From the user's perspective: the previous card's
    // collapse was invisible.
    const articleTopPost = article.getBoundingClientRect().top;
    const collapseDelta = articleTopPre - articleTopPost; // ≥ 0
    const adjustedScroll = Math.max(0, scrollPre - collapseDelta);
    if (collapseDelta > 0) {
      scrollTo(adjustedScroll, { instant: true });
    }

    // FIRST rects: snapshot preview imgs in the post-anchor layout. Because
    // we restored the article to articleTopPre, these match what the user's
    // eye sees at click time — the morph will start exactly from the click.
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
    // nothing jumps when the gallery mounts in flow.
    article.style.transition = 'none';
    article.style.height = `${collapsedHeight}px`;
    article.style.overflow = 'hidden';

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
    article.style.overflow = 'hidden';

    // scrollHeight reflects the natural content height now that gallery is in flow.
    const targetHeight = article.scrollHeight;
    article.dataset.fpcEh = String(targetHeight);
    article.dataset.fpcCh = String(collapsedHeight);

    article.getBoundingClientRect();

    // Smooth-scroll our top to viewport y=0 (the gallery header / title
    // ends up pinned to the top edge). This is a SMALL local motion —
    // articleTop is the post-anchor viewport y from handleOpen, which is
    // typically just a few hundred px. No sibling-delta correction needed:
    // flushSync already collapsed any expanded sibling before we got here,
    // so [data-fpc-eh] markers on the page only point at our own article.
    const articleTop = article.getBoundingClientRect().top;
    const currentScroll = getScrollPosition();
    const targetScroll = Math.max(0, articleTop + currentScroll);

    const rafId = requestAnimationFrame(() => {
      scrollTo(targetScroll, { ease: 0.05 });

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
    });

    return () => cancelAnimationFrame(rafId);
  }, [phase, getScrollPosition, scrollTo]);

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
    article.style.overflow = 'hidden';

    setPhase('animating-close');
  }, [phase]);

  // Drive the close animation.
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
    const rafId = requestAnimationFrame(() => {
      article.style.transition = CLOSE_TRANSITION;
      article.style.height = `${targetHeight}px`;
    });

    return () => cancelAnimationFrame(rafId);
  }, [phase]);

  const handleTransitionEnd = useCallback((e) => {
    if (e.target !== articleRef.current || e.propertyName !== 'height') return;
    if (phase === 'animating-open') {
      setPhase('expanded');
      isAnimatingRef.current = false;
      if (pendingCloseRef.current) {
        pendingCloseRef.current = false;
        requestAnimationFrame(() => handleClose());
      }
    } else if (phase === 'animating-close') {
      setPhase('collapsed');
      isAnimatingRef.current = false;
    }
  }, [phase, handleClose]);

  // Auto-close when parent bumps closeSignal (single-expand enforcement).
  // Switching to a new card collapses this one INSTANTLY — no fade, no
  // height shutter, no overlay slide-in. The 'collapsed' useLayoutEffect
  // clears any inline styles left over from a possibly-interrupted open.
  //
  // useLayoutEffect (not useEffect) so that the new card can wrap
  // `onWillExpand` in `flushSync` and have THIS card's full collapse
  // (state + DOM) commit synchronously — before the new card captures
  // its scroll anchor and FIRST rects. flushSync flushes layout effects;
  // it does NOT flush passive effects.
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
            className={`flex flex-col gap-4 px-4 md:px-0 py-8 md:py-10 md:gap-8 md:items-center ${
              isImageLeft ? 'md:flex-row' : 'md:flex-row-reverse'
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
