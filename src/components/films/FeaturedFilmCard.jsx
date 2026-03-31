/**
 * Featured Film Card — displays a film with embedded video preview.
 * Clicking opens a film detail modal (no navigation to /films/:slug).
 */

const LAYOUT_VARIANTS = [
  { videoWidth: '44%', textWidth: '45%', paddingTop: '8rem', paddingBottom: '8rem', textPaddingTop: '0' },
  { videoWidth: '44%', textWidth: '45%', paddingTop: '8rem', paddingBottom: '8rem', textPaddingTop: '0' },
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
  const handleVideoReady = (e) => {
    e.target.controls = false;
    e.target.removeAttribute('controls');
    e.target.play().catch((err) => console.warn(`Video autoplay blocked for "${title}":`, err.message));
  };

  return (
    <article
      className="film-card w-full bg-white"
      style={{
        '--section-padding-top': variant.paddingTop,
        '--section-padding-bottom': variant.paddingBottom,
        '--video-width': variant.videoWidth,
        '--text-width': variant.textWidth,
        '--text-padding-top': variant.textPaddingTop,
      }}
    >
      {/* TITLE — mobile only, above the video */}
      <header className="px-4 lg:hidden">
        <h3
          onClick={handleClick}
          className="font-header text-lg font-medium tracking-widest uppercase cursor-pointer hover:opacity-70 transition-opacity duration-150 leading-tight mb-4"
        >
          {title}
        </h3>
      </header>

      <div
        className={`px-4 lg:px-0 flex flex-col lg:items-center ${isVideoLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
      >
        {/* VIDEO */}
        <div
          onClick={handleClick}
          className="w-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity duration-300"
          style={{
            aspectRatio,
            ...(thumbnail ? {
              backgroundImage: `url(${thumbnail})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {}),
          }}
        >
          <video
            src={videoFile}
            poster={thumbnail || undefined}
            autoPlay
            loop
            playsInline
            muted
            preload="auto"
            onLoadedData={handleVideoReady}
            className="w-full h-full object-cover pointer-events-none"
            aria-label={title}
          />
        </div>

        {/* TEXT CONTENT */}
        <div className={`flex flex-col justify-center min-w-0 gap-5 items-start lg:px-8 xl:px-12 2xl:px-20`}>
          {/* TITLE — desktop only (mobile title is overlaid on video) */}
          <header className="hidden lg:block">
            <h3
              onClick={handleClick}
              className="font-header text-lg font-medium tracking-widest uppercase cursor-pointer hover:opacity-70 transition-opacity duration-150 leading-tight"
            >
              {title}
            </h3>
          </header>

          {/* METADATA */}
          <div className="font-header text-xs tracking-widest text-primary uppercase -mt-2">
            {year}
            <span className="mx-3">•</span>
            {client}
            <span className="mx-3">•</span>
            {category}
          </div>

          {/* DESCRIPTION */}
          <div className="relative w-full overflow-hidden">
            <p className="font-header text-xs md:text-sm tracking-[0.15em] leading-6 md:leading-7 text-primary">
              {description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default FeaturedFilmCard;
