/**
 * ============================================================================
 * FEATURED FILM CARD COMPONENT
 * ============================================================================
 *
 * Displays a featured film project with an embedded video player.
 * Uses varied, asymmetric layouts for an editorial "messy" feel.
 * Video aspect ratios are preserved (16:9).
 *
 * ============================================================================
 */

// Link for navigation to film detail page
import { Link } from 'react-router-dom';

// Staggered text animation hook
import { useStaggeredText } from '../../hooks/useStaggeredText';


// Layout variations for each card index (creates visual variety)
// Video maintains 16:9 aspect ratio - width determines height
const LAYOUT_VARIANTS = [
  // Card 1: Large video right, text left
  {
    videoWidth: 55, // vw
    videoOffsetX: 0, // vw from edge
    videoOffsetY: 60, // px from top
    textWidth: 420, // px
    textOffsetX: 0, // px from edge
    textGap: 10, // gap between elements
    sectionPaddingTop: 160,
    sectionPaddingBottom: 200,
  },
  // Card 2: Medium video left, more vertical offset
  {
    videoWidth: 48,
    videoOffsetX: 4,
    videoOffsetY: 120,
    textWidth: 380,
    textOffsetX: 40,
    textGap: 8,
    sectionPaddingTop: 140,
    sectionPaddingBottom: 260,
  },
  // Card 3: Wide video right, compact
  {
    videoWidth: 58,
    videoOffsetX: 2,
    videoOffsetY: 40,
    textWidth: 360,
    textOffsetX: 20,
    textGap: 12,
    sectionPaddingTop: 180,
    sectionPaddingBottom: 180,
  },
  // Card 4: Smaller video left, lots of space
  {
    videoWidth: 42,
    videoOffsetX: 8,
    videoOffsetY: 80,
    textWidth: 440,
    textOffsetX: 60,
    textGap: 14,
    sectionPaddingTop: 220,
    sectionPaddingBottom: 220,
  },
];


/**
 * FeaturedFilmCard Component
 *
 * Renders a featured film card with embedded video player.
 * Each card has unique sizing and spacing for visual variety.
 * Video aspect ratio (16:9) is always preserved.
 *
 * @param {Object} props - Component props
 * @param {Object} props.film - The film data object
 * @param {number} props.index - Index of the card (for layout variation)
 * @returns {JSX.Element} The featured film card
 */
function FeaturedFilmCard({ film, index = 0 }) {
  // Destructure film data for cleaner code
  const {
    slug,
    title,
    description,
    year,
    client,
    category,
    imagePosition,
    videoFile,
    thumbnail,
    aspectRatio = 1.78, // Default to 16:9 if not specified
  } = film;

  // Determine if video should be on the left side
  const isVideoLeft = imagePosition === 'left';

  // Get layout variant based on index (cycles through variants)
  const variant = LAYOUT_VARIANTS[index % LAYOUT_VARIANTS.length];

  // Staggered text animation for description
  const { containerRef: descriptionRef } = useStaggeredText({
    text: description,
    maxOffset: 2.4,
    wordSpacing: 0.3,
    animationSpeed: 0.15,
  });


  // Save clicked film slug before navigating
  const handleCardClick = () => {
    sessionStorage.setItem('lastClickedFilm', slug);
  };

  // CSS custom properties for responsive desktop layout
  const desktopVideoStyles = {
    '--video-width': `${variant.videoWidth}vw`,
    '--video-top': `${variant.videoOffsetY}px`,
    '--video-offset': `${variant.videoOffsetX}vw`,
    '--video-aspect-ratio': aspectRatio,
  };

  const desktopTextStyles = {
    '--text-width': `${variant.textWidth}px`,
    '--text-offset': `${variant.textOffsetX}px`,
  };

  return (
    <article
      id={`film-${slug}`}
      className="film-card flex w-full items-start bg-white relative px-4 lg:px-0"
      style={{
        '--section-padding-top': `${variant.sectionPaddingTop}px`,
        '--section-padding-bottom': `${variant.sectionPaddingBottom}px`,
      }}
    >
      {/* Inner container - stacked on mobile, side-by-side on desktop */}
      <div className={`flex flex-col w-full lg:items-start lg:relative ${isVideoLeft ? '' : ''}`}>
        {/* VIDEO - Full width on mobile, absolute positioned on desktop */}
        <Link
          to={`/films/${slug}`}
          onClick={handleCardClick}
          className={`relative w-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity duration-300 film-card-video ${isVideoLeft ? 'film-card-video-left' : 'film-card-video-right'}`}
          style={{
            aspectRatio: aspectRatio,
            backgroundImage: `url(${thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            ...desktopVideoStyles,
          }}
        >
          <video
            src={videoFile}
            poster={thumbnail}
            autoPlay
            loop
            playsInline
            muted
            className="w-full h-full object-cover pointer-events-none"
            aria-label={title}
          />
        </Link>


        {/* TEXT CONTENT - Title, metadata, description */}
        <div
          className={`flex flex-col items-start justify-start relative z-10 w-full pt-6 film-card-text ${isVideoLeft ? 'film-card-text-left' : 'film-card-text-right'}`}
          style={{
            gap: `${variant.textGap * 3}px`,
            ...desktopTextStyles,
          }}
        >
          {/* TITLE */}
          <header>
            <Link to={`/films/${slug}`} onClick={handleCardClick}>
              <h3
                className="
                  text-lg
                  font-medium
                  tracking-widest
                  uppercase
                  cursor-pointer
                  hover:opacity-70
                  transition-opacity
                  duration-150
                  leading-tight
                "
                style={{ fontFamily: 'Helvetica Now Display' }}
              >
                {title}
              </h3>
            </Link>
          </header>

          {/* METADATA - Year • Client • Category */}
          <div
            className="text-xs tracking-widest text-primary uppercase"
            style={{
              fontFamily: 'Helvetica Now Display',
              marginTop: `-${variant.textGap}px`,
            }}
          >
            {year}
            <span className="mx-3">•</span>
            {client}
            <span className="mx-3">•</span>
            {category}
          </div>

          {/* DESCRIPTION - with staggered text animation */}
          <div
            className="relative w-full overflow-hidden"
            style={{ marginTop: `${variant.textGap}px` }}
          >
            <p
              ref={descriptionRef}
              className="
                staggered-text
                text-xs md:text-sm
                tracking-wider
                leading-6 md:leading-7
                text-primary
              "
              style={{ fontFamily: 'Helvetica Now Display' }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

// Export for use in Films page
export default FeaturedFilmCard;
