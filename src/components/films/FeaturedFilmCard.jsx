/**
 * Featured Film Card — displays a film with embedded video preview.
 * Clicking opens a film detail modal (no navigation to /films/:slug).
 */

const LAYOUT_VARIANTS = [
  { videoWidth: 55, videoOffsetX: 0, videoOffsetY: 60, textWidth: 420, textOffsetX: 0, textGap: 10, sectionPaddingTop: 160, sectionPaddingBottom: 200 },
  { videoWidth: 48, videoOffsetX: 4, videoOffsetY: 120, textWidth: 380, textOffsetX: 40, textGap: 8, sectionPaddingTop: 140, sectionPaddingBottom: 260 },
  { videoWidth: 58, videoOffsetX: 2, videoOffsetY: 40, textWidth: 360, textOffsetX: 20, textGap: 12, sectionPaddingTop: 180, sectionPaddingBottom: 180 },
  { videoWidth: 42, videoOffsetX: 8, videoOffsetY: 80, textWidth: 440, textOffsetX: 60, textGap: 14, sectionPaddingTop: 220, sectionPaddingBottom: 220 },
];

function FeaturedFilmCard({ film, index = 0, onFilmClick }) {
  const {
    title,
    description,
    year,
    client,
    category,
    imagePosition,
    videoFile,
    thumbnail,
    aspectRatio = 1.78,
  } = film;

  const isVideoLeft = imagePosition === 'left';
  const variant = LAYOUT_VARIANTS[index % LAYOUT_VARIANTS.length];

  const handleClick = () => onFilmClick(film);

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
      className="film-card flex w-full items-start bg-white relative px-4 lg:px-0"
      style={{
        '--section-padding-top': `${variant.sectionPaddingTop}px`,
        '--section-padding-bottom': `${variant.sectionPaddingBottom}px`,
        '--video-top': `${variant.videoOffsetY}px`,
      }}
    >
      <div className={`flex flex-col w-full lg:items-start lg:relative`}>
        {/* VIDEO */}
        <div
          onClick={handleClick}
          className={`relative w-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity duration-300 film-card-video ${isVideoLeft ? 'film-card-video-left' : 'film-card-video-right'}`}
          style={{
            aspectRatio,
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
        </div>

        {/* TEXT CONTENT */}
        <div
          className={`flex flex-col items-start justify-start relative z-10 w-full pt-6 film-card-text ${isVideoLeft ? 'film-card-text-left' : 'film-card-text-right'}`}
          style={{
            gap: `${variant.textGap * 2}px`,
            ...desktopTextStyles,
          }}
        >
          {/* TITLE */}
          <header>
            <h3
              onClick={handleClick}
              className="font-header text-lg font-medium tracking-widest uppercase cursor-pointer hover:opacity-70 transition-opacity duration-150 leading-tight"
            >
              {title}
            </h3>
          </header>

          {/* METADATA */}
          <div
            className="font-header text-xs tracking-widest text-primary uppercase"
            style={{ marginTop: `-${variant.textGap}px` }}
          >
            {year}
            <span className="mx-3">•</span>
            {client}
            <span className="mx-3">•</span>
            {category}
          </div>

          {/* DESCRIPTION */}
          <div className="relative w-full overflow-hidden" style={{ marginTop: `${variant.textGap}px` }}>
            <p
              className="font-header text-xs md:text-sm tracking-wider leading-6 md:leading-7 text-primary"
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default FeaturedFilmCard;
