import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * FilmModal — Popup Vimeo player overlay with dimmed backdrop.
 * The video sits in a centered container over the current page.
 */
function FilmModal({ film, isOpen, onClose }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setIsLoaded(false);
    setLoadError(false);
    requestAnimationFrame(() => {
      setIsVisible(true);
      closeBtnRef.current?.focus();
    });
    // Timeout: if iframe hasn't loaded after 20s, show error
    const timeout = setTimeout(() => {
      setLoadError(true);
      setIsLoaded(true);
    }, 20000);
    return () => {
      clearTimeout(timeout);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Keyboard: Escape to close + focus trap
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const modal = modalRef.current;
      if (!modal) return;
      const focusable = modal.querySelectorAll('button, iframe, [tabindex="0"]');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !film || !film.videoUrl) return null;

  return createPortal(
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={film.title}
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ease-out ${isVisible ? 'bg-black/80 backdrop-blur-md' : 'bg-black/0 backdrop-blur-0'}`}
      onClick={onClose}
    >
      {/* Video container — click inside doesn't close */}
      <div
        className="relative w-[98vw] md:w-[92vw] max-w-[1400px] aspect-video"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeBtnRef}
          onClick={onClose}
          className="absolute -top-10 right-0 z-50 text-white hover:opacity-70 transition-opacity"
          aria-label="Close"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Loading spinner or error */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black rounded-lg">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black rounded-lg gap-3">
            <p className="text-white/70 font-header text-sm">Video failed to load</p>
            <button onClick={onClose} className="text-white/50 font-header text-xs uppercase tracking-wider hover:text-white transition-colors">Close</button>
          </div>
        )}

        {/* Vimeo iframe */}
        <iframe
          src={`${film.videoUrl}?autoplay=1&title=0&byline=0&portrait=0`}
          title={film.title}
          className="w-full h-full border-0 rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoaded(true)}
          onError={() => { setLoadError(true); setIsLoaded(true); }}
        />
      </div>
    </div>,
    document.body
  );
}

export default FilmModal;
