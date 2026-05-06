/**
 * ExpandedPhotoGallery — full inline gallery shown when a FeaturedPhotoCard
 * is in the 'expanded' (or transitioning) phase. Masonry-style via CSS
 * columns; each `<img>` carries `data-photo-idx={originalIndex}` so the
 * FLIP morph in FeaturedPhotoCard can match it back to the collapsed
 * preview cells.
 *
 * Click on an image opens the page-level Lightbox via onPhotoClick(project, idx).
 * Click on the close strip (X) collapses the card via onClose.
 *
 * The header is pinned to the top of the viewport while `isExpanded` is true,
 * with a sticky-with-bottom-stop release: as the article's bottom approaches
 * the viewport top, the header gets *pushed up* by the article bottom (minus
 * RELEASE_MARGIN_PX) so it slides off-screen exactly as the gallery ends —
 * no leftover header floating over the next section.
 *
 * `position: sticky` would be the obvious tool but doesn't apply: on desktop
 * `SmoothScrollContext` translates content via CSS transform, so there's no
 * real scrolling ancestor for sticky to attach to. We subscribe to
 * `addScrollListener` and compute the transform manually.
 */
import { useLayoutEffect, useRef } from 'react';

import { useSmoothScrollContext } from '../../context/SmoothScrollContext';

const RELEASE_MARGIN_PX = 24;

function ExpandedPhotoGallery({ project, pinHeader, onPhotoClick, onClose }) {
  const { title, description, year, client, category, photos } = project;
  const headerRef = useRef(null);
  const { addScrollListener, getScrollPosition } = useSmoothScrollContext();

  // Pin the header at viewport top while the gallery is open, with a
  // sticky-with-bottom-stop release so it slides off-screen as the article
  // ends. Active for the entire non-collapsed lifecycle (animating-open,
  // expanded, animating-close), not just 'expanded' — otherwise a user who
  // wheels during the 1200 ms open animation watches the header scroll past
  // and then snap back when the pin finally activates at transitionend.
  //
  // useLayoutEffect (not useEffect) so the scroll listener is subscribed
  // BEFORE the browser paints the gallery for the first time. With useEffect
  // there is a frame between paint and effect-flush where a wheel event
  // could land before the pin is wired up.
  useLayoutEffect(() => {
    if (!pinHeader) return;
    const header = headerRef.current;
    if (!header) return;
    const article = header.closest('article[data-featured-photo-card]');
    if (!article) return;

    // Reset any leftover transform so we can measure natural positions.
    header.style.transform = '';
    const initialScroll = getScrollPosition();
    const headerDocTop = header.getBoundingClientRect().top + initialScroll;

    const apply = (scrollY) => {
      const visualTop = headerDocTop - scrollY;
      if (visualTop >= 0) {
        header.style.transform = '';
        return;
      }
      // Sticky-with-bottom-stop: as the article's bottom approaches the
      // viewport top, the pinned header gets pushed up by the article
      // bottom minus the release margin, sliding off-screen exactly as the
      // gallery ends.
      const articleBottomVisual = article.getBoundingClientRect().bottom;
      const headerHeight = header.offsetHeight;
      const headerBottomLimit = articleBottomVisual - RELEASE_MARGIN_PX;
      const desiredHeaderTop = Math.min(0, headerBottomLimit - headerHeight);
      header.style.transform = `translate3d(0, ${desiredHeaderTop - visualTop}px, 0)`;
    };

    // Apply immediately against the current scroll so the very first paint
    // already shows the header in its correct (pinned-or-natural) position
    // — no one-frame flash where it's natural before the listener fires.
    apply(initialScroll);
    const unsubscribe = addScrollListener(apply);
    return () => {
      unsubscribe();
      if (headerRef.current) headerRef.current.style.transform = '';
    };
  }, [pinHeader, addScrollListener, getScrollPosition]);

  return (
    <div className="w-full px-4 md:px-0">
      {/* Title block — pinned to viewport top while expanded. bg-white +
          z-10 ensure the masonry photos that scroll under it don't show
          through. py-* matches the previous pt-* + mb-* spacing. */}
      <header
        ref={headerRef}
        className="relative z-10 bg-white pt-4 md:pt-8 pb-6 md:pb-10 will-change-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-header text-lg md:text-2xl font-medium tracking-widest uppercase leading-tight">
          {title}
        </h3>
        <div className="mt-2 font-header text-xs tracking-widest text-primary uppercase">
          {year}
          <span className="mx-3">•</span>
          {client}
          <span className="mx-3">•</span>
          {category}
        </div>
        {description && (
          <p className="mt-4 max-w-prose font-header text-xs tracking-[0.15em] leading-6 text-primary">
            {description}
          </p>
        )}
      </header>

      {/* Masonry — CSS columns. break-inside avoids splitting an image
          across columns. mb-4 separates rows; gap-4 separates columns. */}
      <div
        data-fpc-gallery
        className="columns-1 sm:columns-2 lg:columns-3 gap-4"
      >
        {photos.map((photo, idx) => (
          <div
            key={`${project.id}-gal-${idx}`}
            data-fpc-cell={idx}
            className="mb-4 break-inside-avoid"
          >
            <img
              src={photo.src}
              alt=""
              data-photo-idx={idx}
              data-fpc-gallery-img="1"
              loading="lazy"
              decoding="async"
              onClick={(e) => {
                e.stopPropagation();
                onPhotoClick?.(project, idx);
              }}
              className="block w-full h-auto cursor-pointer"
              style={{ aspectRatio: photo.aspectRatio || undefined }}
            />
          </div>
        ))}
      </div>

      {/* Close indicator — small X, revealed on article hover (desktop). */}
      <div
        data-fpc-close
        onClick={onClose}
        role="button"
        aria-label={`Collapse ${title}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onClose?.(e);
          }
        }}
        className="flex items-center justify-center pb-8 pt-2 cursor-pointer"
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
  );
}

export default ExpandedPhotoGallery;
