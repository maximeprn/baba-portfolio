/**
 * ============================================================================
 * LIGHTBOX COMPONENT
 * ============================================================================
 *
 * A fullscreen image viewer overlay.
 * Opens when clicking on a photo in the gallery.
 *
 * FEATURES:
 * - Fullscreen overlay with dark background
 * - Navigation arrows for prev/next
 * - Keyboard navigation (arrows, escape)
 * - Click outside to close
 * - Shows current photo index
 * - Optional caption display
 * - Smooth transitions
 *
 * USAGE:
 * <Lightbox
 *   photos={photos}
 *   currentIndex={5}
 *   onClose={() => setIsOpen(false)}
 *   onNavigate={(newIndex) => setCurrentIndex(newIndex)}
 * />
 *
 * ============================================================================
 */

// useEffect hook for handling keyboard events and body scroll lock
import { useEffect, useCallback } from 'react';


/**
 * Lightbox Component
 *
 * A fullscreen image viewer with navigation.
 *
 * @param {Object} props - Component props
 * @param {Array} props.photos - Array of photo objects
 * @param {number} props.currentIndex - Index of currently displayed photo
 * @param {Function} props.onClose - Callback to close the lightbox
 * @param {Function} props.onNavigate - Callback to navigate to a new index
 * @param {boolean} props.isOpen - Whether the lightbox is open
 * @returns {JSX.Element|null} The lightbox or null if closed
 */
function Lightbox({ photos, currentIndex, onClose, onNavigate, isOpen }) {
  // Get the current photo
  const currentPhoto = photos[currentIndex];

  // Check if there are previous/next photos
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;


  /**
   * Navigate to the previous photo
   * Wrapped in useCallback to prevent unnecessary re-renders
   */
  const goToPrev = useCallback(() => {
    if (hasPrev) {
      onNavigate(currentIndex - 1);
    }
  }, [hasPrev, currentIndex, onNavigate]);


  /**
   * Navigate to the next photo
   */
  const goToNext = useCallback(() => {
    if (hasNext) {
      onNavigate(currentIndex + 1);
    }
  }, [hasNext, currentIndex, onNavigate]);


  /**
   * Handle keyboard navigation
   *
   * useEffect sets up an event listener when the component mounts.
   * The return function cleans up the listener when the component unmounts.
   */
  useEffect(() => {
    // Only add listeners if lightbox is open
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'Escape':
          // Close lightbox on Escape key
          onClose();
          break;
        case 'ArrowLeft':
          // Go to previous photo
          goToPrev();
          break;
        case 'ArrowRight':
          // Go to next photo
          goToNext();
          break;
        default:
          break;
      }
    };

    // Add the event listener
    window.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll while lightbox is open
    document.body.style.overflow = 'hidden';

    // Cleanup function - runs when component unmounts or isOpen changes
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, goToPrev, goToNext]);


  // Don't render anything if lightbox is closed
  if (!isOpen || !currentPhoto) {
    return null;
  }


  return (
    // Overlay container - covers the entire viewport
    <div
      className="
        fixed                            /* Fixed positioning */
        inset-0                          /* Cover entire viewport */
        z-50                             /* Above everything else */
        flex
        items-center
        justify-center
        bg-black/90                      /* Semi-transparent black */
      "
      // Accessibility: This is a modal dialog
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* CLOSE BUTTON */}
      <button
        onClick={onClose}
        className="
          absolute
          top-4
          right-4
          z-50
          p-2
          text-white
          hover:text-gray-300
          transition-colors
          duration-150
        "
        aria-label="Close lightbox"
      >
        {/* X icon using SVG */}
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>


      {/* PREVIOUS BUTTON */}
      {hasPrev && (
        <button
          onClick={goToPrev}
          className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            z-50
            p-2
            text-white
            hover:text-gray-300
            transition-colors
            duration-150
          "
          aria-label="Previous photo"
        >
          {/* Left arrow SVG */}
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}


      {/* NEXT BUTTON */}
      {hasNext && (
        <button
          onClick={goToNext}
          className="
            absolute
            right-4
            top-1/2
            -translate-y-1/2
            z-50
            p-2
            text-white
            hover:text-gray-300
            transition-colors
            duration-150
          "
          aria-label="Next photo"
        >
          {/* Right arrow SVG */}
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}


      {/* MAIN IMAGE */}
      {/* Click on the background (outside image) closes the lightbox */}
      <div
        className="
          flex
          items-center
          justify-center
          w-full
          h-full
          p-8
          md:p-16
        "
        onClick={onClose}
      >
        {/* Stop propagation on image click so it doesn't close */}
        <img
          src={currentPhoto.src}
          alt={currentPhoto.alt || ''}
          className="
            max-w-full
            max-h-full
            object-contain               /* Fit entire image without cropping */
          "
          onClick={(e) => e.stopPropagation()}
        />
      </div>


      {/* PHOTO COUNTER & CAPTION */}
      <div
        className="
          absolute
          bottom-4
          left-0
          right-0
          flex
          flex-col
          items-center
          gap-2
          text-white
        "
      >
        {/* Caption (if exists) */}
        {currentPhoto.caption && (
          <p className="font-body text-sm text-center max-w-lg px-4">
            {currentPhoto.caption}
          </p>
        )}

        {/* Photo counter: "3 / 15" */}
        <p className="font-header text-sm">
          {currentIndex + 1} / {photos.length}
        </p>
      </div>
    </div>
  );
}

// Export for use in PhotoProject page
export default Lightbox;
