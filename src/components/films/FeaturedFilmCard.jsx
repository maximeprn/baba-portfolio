/**
 * Featured Film Card — displays a film with embedded video preview.
 * Clicking opens a film detail modal (no navigation to /films/:slug).
 */

// Per-element padding + margin-bottom variants. Cycled by index for a
// "slightly random but intentional" feel. Desktop-only — see ffc-* rules
// in src/styles/index.css. Margin-bottom values stay <= 2rem.
const LAYOUT_VARIANTS = [
  {
    videoWidth: '47.52%', textWidth: '45%', paddingTop: '2rem', paddingBottom: '2rem', textPaddingTop: '0',
    titlePl: '2rem',   titlePr: '0.5rem', titleMb: '3rem',
    subtitlePl: '2.5rem', subtitlePr: '1rem',  subtitleMb: '4rem',
    descPl: '1rem',    descPr: '2rem',
  },
  {
    videoWidth: '47.52%', textWidth: '45%', paddingTop: '2rem', paddingBottom: '2rem', textPaddingTop: '0',
    titlePl: '0.5rem', titlePr: '2rem',   titleMb: '4rem',
    subtitlePl: '1.5rem', subtitlePr: '0.5rem', subtitleMb: '3rem',
    descPl: '2rem',    descPr: '1rem',
  },
  {
    videoWidth: '47.52%', textWidth: '45%', paddingTop: '2rem', paddingBottom: '2rem', textPaddingTop: '0',
    titlePl: '1.5rem', titlePr: '1rem',   titleMb: '3.5rem',
    subtitlePl: '0.5rem', subtitlePr: '1.5rem', subtitleMb: '4rem',
    descPl: '2.5rem',  descPr: '0.5rem',
  },
];

function FeaturedFilmCard({ film, index = 0, onFilmClick, shouldLoad = true, onVideoReady }) {
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

  // stopPropagation so an enclosing CollapsedFilmCard doesn't treat this as a "close" click.
  const handleClick = (e) => {
    e?.stopPropagation?.();
    onFilmClick(film);
  };
  const handleVideoReady = (e) => {
    e.target.controls = false;
    e.target.removeAttribute('controls');
    e.target.play().catch((err) => console.warn(`Video autoplay blocked for "${title}":`, err.message));
    onVideoReady?.();
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
        '--ffc-title-pl': variant.titlePl,
        '--ffc-title-pr': variant.titlePr,
        '--ffc-title-mb': variant.titleMb,
        '--ffc-subtitle-pl': variant.subtitlePl,
        '--ffc-subtitle-pr': variant.subtitlePr,
        '--ffc-subtitle-mb': variant.subtitleMb,
        '--ffc-desc-pl': variant.descPl,
        '--ffc-desc-pr': variant.descPr,
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
            src={shouldLoad ? videoFile : undefined}
            poster={thumbnail || undefined}
            autoPlay
            loop
            playsInline
            muted
            preload={shouldLoad ? 'auto' : 'none'}
            onLoadedData={handleVideoReady}
            className="w-full h-full object-cover pointer-events-none"
            aria-label={title}
          />
        </div>

        {/* TEXT CONTENT — stopPropagation so reading text doesn't collapse an enclosing card.
            Per-element padding + margin-bottom come from CSS vars + lg-only rules in index.css. */}
        <div
          className="flex flex-col justify-center min-w-0 items-start"
          onClick={(e) => e.stopPropagation()}
        >
          {/* TITLE — desktop only (mobile title is overlaid on video) */}
          <header className="hidden lg:block ffc-title">
            <h3
              onClick={handleClick}
              className="font-header text-lg font-medium tracking-widest uppercase cursor-pointer hover:opacity-70 transition-opacity duration-150 leading-tight"
            >
              {title}
            </h3>
          </header>

          {/* METADATA */}
          <div className="ffc-subtitle font-header text-xs tracking-widest text-primary uppercase">
            {year}
            <span className="mx-3">•</span>
            {client}
            <span className="mx-3">•</span>
            {category}
          </div>

          {/* DESCRIPTION */}
          <div className="ffc-desc relative w-full overflow-hidden">
            <p className="font-header text-xs tracking-[0.15em] leading-6 text-primary">
              {description}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default FeaturedFilmCard;
