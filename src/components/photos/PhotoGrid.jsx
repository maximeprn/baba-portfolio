/**
 * ============================================================================
 * PHOTO GRID COMPONENT
 * ============================================================================
 *
 * Displays photos in a responsive masonry-style grid layout.
 * Used on the individual photo project gallery pages.
 *
 * FEATURES:
 * - Responsive column layout (1 col mobile, 2 tablet, 3 desktop)
 * - Maintains photo aspect ratios
 * - Click to open lightbox
 * - Subtle hover effects
 *
 * USAGE:
 * <PhotoGrid
 *   photos={project.photos}
 *   onPhotoClick={(photo, index) => openLightbox(index)}
 * />
 *
 * ============================================================================
 */

/**
 * PhotoGrid Component
 *
 * Renders a grid of photos with click handling for lightbox.
 *
 * @param {Object} props - Component props
 * @param {Array} props.photos - Array of photo objects
 * @param {Function} props.onPhotoClick - Callback when a photo is clicked
 * @returns {JSX.Element} The photo grid
 */
function PhotoGrid({ photos, onPhotoClick }) {
  return (
    // Grid container
    // Uses CSS Grid with responsive column counts
    <div
      className="
        grid
        grid-cols-1                      /* 1 column on mobile */
        md:grid-cols-2                   /* 2 columns on tablet */
        lg:grid-cols-3                   /* 3 columns on desktop */
        gap-4                            /* Gap between items */
        w-full
      "
    >
      {photos.map((photo, index) => (
        // Each photo is wrapped in a button for accessibility
        // Using button instead of div because it's clickable
        <button
          key={photo.id}
          onClick={() => onPhotoClick(photo, index)}
          className="
            group                        /* Group for hover effects */
            relative
            w-full
            overflow-hidden
            bg-gray-100                  /* Placeholder while loading */
            cursor-pointer
            focus:outline-none           /* Remove default focus outline */
            focus-visible:ring-2         /* Custom focus ring for keyboard nav */
            focus-visible:ring-primary
            focus-visible:ring-offset-2
          "
          // Dynamic aspect ratio based on photo data
          // Falls back to 3:2 if not specified
          style={{
            aspectRatio: photo.aspectRatio || 1.5,
          }}
          // Accessibility: Describe what clicking does
          aria-label={`View ${photo.alt || 'photo'} in fullscreen`}
        >
          {/* Photo image */}
          <img
            src={photo.src}
            alt={photo.alt || ''}
            className="
              w-full
              h-full
              object-cover
              transition-all              /* Smooth all transitions */
              duration-300
              group-hover:scale-105       /* Slight zoom on hover */
            "
            // Lazy loading for performance
            // Images below the fold won't load until needed
            loading="lazy"
          />

          {/* Hover overlay */}
          <div
            className="
              absolute
              inset-0
              bg-black
              opacity-0                   /* Hidden by default */
              group-hover:opacity-10      /* Show on hover */
              transition-opacity
              duration-300
            "
            aria-hidden="true"
          />

          {/* Optional: Show caption on hover
              Uncomment if you want captions to appear on hover */}
          {/*
          {photo.caption && (
            <div
              className="
                absolute
                bottom-0
                left-0
                right-0
                p-4
                bg-gradient-to-t
                from-black/50
                to-transparent
                opacity-0
                group-hover:opacity-100
                transition-opacity
                duration-300
              "
            >
              <p className="text-white text-sm font-body">
                {photo.caption}
              </p>
            </div>
          )}
          */}
        </button>
      ))}
    </div>
  );
}

// Export for use in PhotoProject page
export default PhotoGrid;
