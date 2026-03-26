import { useEffect, useState } from 'react';

/**
 * FilmModal — Fullscreen Vimeo player overlay with sound.
 * The iframe fills the entire viewport; Vimeo handles letterboxing.
 */
function FilmModal({ film, isOpen, onClose }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setIsLoaded(false);
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !film) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 text-white hover:opacity-70 transition-opacity"
        aria-label="Close"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Loading spinner */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Fullscreen Vimeo iframe */}
      <iframe
        src={`${film.videoUrl}?autoplay=1&title=0&byline=0&portrait=0`}
        title={film.title}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}

export default FilmModal;
