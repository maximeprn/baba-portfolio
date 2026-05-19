/**
 * Film Card — displays a non-featured film with alternating layout.
 * Clicking opens a film detail modal (no navigation to /films/:slug).
 */

// Per-element padding + margin-bottom variants. Cycled by index. Desktop-only —
// see fc-* rules in src/styles/index.css. Margin-bottom values stay <= 2rem.
// (No subtitle on this card; only title + description vary.)
const LAYOUT_VARIANTS = [
  { titlePl: '2rem',   titlePr: '0.5rem', titleMb: '3rem',   descPl: '1rem',   descPr: '2rem'   },
  { titlePl: '0.5rem', titlePr: '2rem',   titleMb: '4rem',   descPl: '2rem',   descPr: '1rem'   },
  { titlePl: '1.5rem', titlePr: '1rem',   titleMb: '3.5rem', descPl: '2.5rem', descPr: '0.5rem' },
];

function FilmCard({ film, index = 0, onFilmClick }) {
  const {
    title,
    description,
    thumbnail,
    credits,
    imagePosition,
  } = film;

  const isImageLeft = imagePosition === 'left';
  const handleClick = () => onFilmClick(film);
  const variant = LAYOUT_VARIANTS[index % LAYOUT_VARIANTS.length];

  return (
    <article
      className="w-full max-w-container bg-white border-t border-b border-border px-[5%] py-8 lg:py-3"
      style={{
        '--fc-title-pl': variant.titlePl,
        '--fc-title-pr': variant.titlePr,
        '--fc-title-mb': variant.titleMb,
        '--fc-desc-pl': variant.descPl,
        '--fc-desc-pr': variant.descPr,
      }}
    >
      <div className={`flex flex-col gap-8 items-center ${isImageLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
        {/* IMAGE */}
        <div className="w-full lg:w-1/2 flex-shrink-0" onClick={handleClick}>
          <img
            src={thumbnail}
            alt={`Project image for ${title}`}
            loading="lazy"
            className="w-full aspect-[1.36] object-cover cursor-pointer transition-opacity duration-300 hover:opacity-90"
          />
        </div>

        {/* TEXT CONTENT — per-element padding/mb come from CSS vars + lg-only rules. */}
        <div className="flex flex-col flex-1 min-w-0 items-start gap-9 lg:gap-0 py-6">
          <header className="fc-title">
            <h3
              onClick={handleClick}
              className="project-title cursor-pointer hover:opacity-70 transition-opacity duration-150"
            >
              {title}
            </h3>
          </header>

          <div className="fc-desc relative w-full max-w-[584px]">
            <p className="font-header text-xs tracking-wide leading-6 text-primary">
              {description}
            </p>
          </div>

          {/* Credits */}
          <div className="flex w-full max-w-[584px] items-start justify-center gap-6 md:gap-11 lg:mt-[4.5rem]">
            <div className="flex-1 font-header text-sm tracking-wide leading-7">
              {credits.left.map((credit) => (
                <p key={`${credit.role}-${credit.name}`}>{credit.role} : {credit.name}</p>
              ))}
            </div>
            <div className="flex-1 font-header text-sm tracking-wide leading-7">
              {credits.right.map((credit) => (
                <p key={`${credit.role}-${credit.name}`}>{credit.role} : {credit.name}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default FilmCard;
