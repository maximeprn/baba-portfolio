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
 * Features:
 * - Backdrop click + Escape close
 * - Left/right arrow buttons + ←/→ keys navigate
 * - Body scroll lock + smooth-scroll wheel/key lock while open
 * - Image is centered and clamped to the viewport via max-w/max-h on the img
 *   (h-svh avoids the iOS address-bar overflow trap).
 */

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { useSmoothScrollContext } from '../../context/SmoothScrollContext';


function Lightbox({ photos, currentIndex, onClose, onNavigate, isOpen }) {
  const { setScrollLocked } = useSmoothScrollContext();
  const currentPhoto = photos[currentIndex];

  // Navigation wraps: previous from index 0 jumps to the last photo, next
  // from the last photo jumps to index 0. Arrows are only useful at all
  // when there are 2+ photos.
  const canNavigate = photos.length > 1;

  const goToPrev = useCallback(() => {
    if (!canNavigate) return;
    onNavigate((currentIndex - 1 + photos.length) % photos.length);
  }, [canNavigate, currentIndex, photos.length, onNavigate]);

  const goToNext = useCallback(() => {
    if (!canNavigate) return;
    onNavigate((currentIndex + 1) % photos.length);
  }, [canNavigate, currentIndex, photos.length, onNavigate]);

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

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={onClose}
    >
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

      {/* Main image — centered via the parent's flex; h-svh on a wrapper
          would create a positioning child of the fixed parent, which is
          unnecessary. The img clamps to (vw, svh) directly so iOS Safari's
          address bar never causes overflow. */}
      <img
        src={currentPhoto.src}
        alt={currentPhoto.alt || ''}
        onClick={(e) => e.stopPropagation()}
        className="block object-contain select-none"
        style={{
          maxWidth: 'calc(100vw - 2rem)',
          maxHeight: 'calc(100svh - 2rem)',
        }}
      />

      {/* Counter / caption */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 text-white pointer-events-none">
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
