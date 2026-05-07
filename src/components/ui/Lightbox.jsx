/**
 * Lightbox — fullscreen image viewer overlay.
 *
 * Why a portal: SmoothScrollContext wraps page content in a div with
 * `transform: translateY(-scrollY)` (desktop). A `transform` on an
 * ancestor turns that ancestor into the containing block for any
 * `position: fixed` descendant, so a fixed overlay rendered inside the
 * page tree gets *anchored to the transformed wrapper* — visible at
 * y=-scrollY in the viewport, i.e. offscreen as soon as the user has
 * scrolled past zero. We portal to document.body to escape that.
 *
 * Touch nav model (iOS Photos style):
 * - Renders a 3-slide track [prev, current, next], each one viewport
 *   wide. Track is offset by -viewportWidth so the current slide is
 *   centered at rest.
 * - Drag translates the whole track 1:1 with the finger; the prev/next
 *   slides come into view from the sides.
 * - On commit: animate the track to ±viewportWidth so the destination
 *   slide arrives at center, then on transitionend swap the index and
 *   snap the track back to centered (no transition) — visually
 *   seamless because the same image is now in slot 1.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useSmoothScrollContext } from '../../context/SmoothScrollContext';


// Phase machine for the swipe track:
// - idle: track at rest, transitions enabled
// - dragging: finger down, no transition, track follows finger
// - committing-prev / committing-next: animating to neighbor; on
//   transitionend → swap index + snap
// - snapping: one render with transition disabled to reposition the
//   track to centered after the index swap
// - cancelling: animating back to centered (swipe didn't pass threshold)
const SWIPE_TRANSITION = 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1)';


function Lightbox({ photos, currentIndex, onClose, onNavigate, isOpen }) {
  const { setScrollLocked } = useSmoothScrollContext();
  const currentPhoto = photos[currentIndex];

  // Navigation wraps: previous from index 0 jumps to the last photo, next
  // from the last photo jumps to index 0. Arrows are only useful at all
  // when there are 2+ photos.
  const canNavigate = photos.length > 1;

  const [dragX, setDragX] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 0,
  );
  const touchRef = useRef(null);
  const swipedRef = useRef(false);

  // Track viewport width — slide width + commit distance both depend on it.
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Reset track state when the lightbox opens/closes so a stale phase
  // (e.g. mid-commit when something else closes it) can't bleed in.
  useEffect(() => {
    if (!isOpen) {
      setDragX(0);
      setPhase('idle');
      touchRef.current = null;
      swipedRef.current = false;
    }
  }, [isOpen]);

  const goToPrev = useCallback(() => {
    if (!canNavigate) return;
    onNavigate((currentIndex - 1 + photos.length) % photos.length);
  }, [canNavigate, currentIndex, photos.length, onNavigate]);

  const goToNext = useCallback(() => {
    if (!canNavigate) return;
    onNavigate((currentIndex + 1) % photos.length);
  }, [canNavigate, currentIndex, photos.length, onNavigate]);

  // After the snap render (no-transition centering with the new index),
  // hand back to idle so the next gesture animates normally.
  useEffect(() => {
    if (phase !== 'snapping') return;
    // Two RAFs: first commits the no-transition render to the screen,
    // second flips the phase so the next style read includes transition.
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase('idle'));
    });
    return () => cancelAnimationFrame(raf1);
  }, [phase]);

  const handleTouchStart = useCallback((e) => {
    if (!canNavigate || e.touches.length !== 1) return;
    // Don't interrupt commit/snap — those need to complete cleanly.
    if (phase === 'committing-prev' || phase === 'committing-next' || phase === 'snapping') return;
    const t = e.touches[0];
    touchRef.current = {
      x: t.clientX,
      y: t.clientY,
      time: Date.now(),
      locked: null, // 'horizontal' | 'vertical' | null until first significant move
    };
    swipedRef.current = false;
  }, [canNavigate, phase]);

  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current || e.touches.length !== 1) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;

    if (touchRef.current.locked === null && Math.abs(dx) + Math.abs(dy) > 8) {
      touchRef.current.locked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }

    if (touchRef.current.locked === 'horizontal') {
      setPhase('dragging');
      setDragX(dx);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchRef.current) return;
    const dx = dragX;
    const elapsed = Date.now() - touchRef.current.time;
    // Past 15% of viewport → commit. Or a short, fast flick (>30px in <250ms).
    const threshold = Math.min(80, viewportWidth * 0.15);
    const fastFlick = Math.abs(dx) > 30 && elapsed < 250;

    if (Math.abs(dx) > 5) swipedRef.current = true;
    touchRef.current = null;

    if (dx > threshold || (fastFlick && dx > 0)) {
      setDragX(viewportWidth);
      setPhase('committing-prev');
    } else if (dx < -threshold || (fastFlick && dx < 0)) {
      setDragX(-viewportWidth);
      setPhase('committing-next');
    } else if (Math.abs(dx) > 0) {
      setDragX(0);
      setPhase('cancelling');
    } else {
      // No real horizontal motion (probably a tap or vertical drift).
      setPhase('idle');
    }
  }, [dragX, viewportWidth]);

  // Track transition end → finalize commit/cancel.
  const handleTrackTransitionEnd = useCallback((e) => {
    if (e.propertyName !== 'transform') return;
    if (phase === 'committing-prev') {
      goToPrev();
      setDragX(0);
      setPhase('snapping');
    } else if (phase === 'committing-next') {
      goToNext();
      setDragX(0);
      setPhase('snapping');
    } else if (phase === 'cancelling') {
      setPhase('idle');
    }
  }, [phase, goToPrev, goToNext]);

  // Keyboard navigation + body / smooth-scroll lock.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Body overflow: SmoothScrollContext may already have set 'hidden' on
    // desktop. Save and restore exactly to avoid clobbering its state.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Block desktop smooth-scroll wheel/key handlers — body overflow alone
    // doesn't stop them since they listen on window.
    setScrollLocked(true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      setScrollLocked(false);
    };
  }, [isOpen, onClose, goToPrev, goToNext, setScrollLocked]);


  if (!isOpen || !currentPhoto) {
    return null;
  }

  const prevIdx = canNavigate
    ? (currentIndex - 1 + photos.length) % photos.length
    : currentIndex;
  const nextIdx = canNavigate
    ? (currentIndex + 1) % photos.length
    : currentIndex;

  // Track: 3 slides side-by-side, offset by -viewportWidth so the middle
  // (current) slide is centered at rest. Single-photo case: 1 slide, no
  // offset.
  const trackBaseOffset = canNavigate ? -viewportWidth : 0;
  const trackTranslateX = trackBaseOffset + dragX;
  const trackTransition =
    phase === 'dragging' || phase === 'snapping' ? 'none' : SWIPE_TRANSITION;

  const slides = canNavigate
    ? [
        { photo: photos[prevIdx], photoIndex: prevIdx, slot: 0 },
        { photo: currentPhoto, photoIndex: currentIndex, slot: 1 },
        { photo: photos[nextIdx], photoIndex: nextIdx, slot: 2 },
      ]
    : [{ photo: currentPhoto, photoIndex: currentIndex, slot: 1 }];

  // Key by photo index when possible — after a commit, the just-decoded
  // sibling slide (e.g. slot 2 holding photo C) physically moves to slot 1
  // via React's keyed reconciliation, instead of slot 1's existing <img>
  // having its src swapped from B → C. That's what causes the post-swipe
  // flash: changing src in place forces the browser to re-decode and the
  // old bitmap is visible for one frame.
  // photos.length === 2 collides (prev and next both wrap to the other
  // photo), so fall back to slot keys in that degenerate case.
  const keyByPhotoIndex = photos.length >= 3;

  const overlay = (
    <div
      className="fixed inset-0 z-[100] bg-black/90 overflow-hidden touch-pan-y"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={() => {
        // Suppress the synthesized click that fires after a swipe gesture
        // on the backdrop — otherwise a swipe-to-nav also closes the lightbox.
        if (swipedRef.current) {
          swipedRef.current = false;
          return;
        }
        onClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Carousel track */}
      <div
        className="absolute inset-0 flex"
        style={{
          transform: `translate3d(${trackTranslateX}px, 0, 0)`,
          transition: trackTransition,
          willChange: 'transform',
        }}
        onTransitionEnd={handleTrackTransitionEnd}
      >
        {slides.map(({ photo, photoIndex, slot }) => (
          <div
            key={keyByPhotoIndex ? `idx-${photoIndex}` : `slot-${slot}`}
            className="flex-shrink-0 h-full flex items-center justify-center"
            style={{ width: viewportWidth }}
          >
            <img
              src={photo.src}
              alt={photo.alt || ''}
              // decoding="sync" forces the browser to finish decoding before
              // the next paint — belt-and-braces against any one-frame stale
              // bitmap on the post-commit snap. Cost is negligible here
              // because the gallery preloads these images.
              decoding="sync"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
              className="block object-contain select-none"
              style={{
                maxWidth: 'calc(100vw - 2rem)',
                maxHeight: 'calc(100svh - 2rem)',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* Close (X) */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors duration-150"
        aria-label="Close lightbox"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Previous (wraps to last) */}
      {canNavigate && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white hover:text-gray-300 transition-colors duration-150"
          aria-label="Previous photo"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next (wraps to first) */}
      {canNavigate && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white hover:text-gray-300 transition-colors duration-150"
          aria-label="Next photo"
        >
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Counter / caption */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 text-white pointer-events-none z-10">
        {currentPhoto.caption && (
          <p className="font-body text-sm text-center max-w-lg px-4">{currentPhoto.caption}</p>
        )}
        <p className="font-header text-sm">{currentIndex + 1} / {photos.length}</p>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

export default Lightbox;
