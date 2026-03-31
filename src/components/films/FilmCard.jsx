/**
 * Film Card — displays a non-featured film with alternating layout.
 * Clicking opens a film detail modal (no navigation to /films/:slug).
 */

function FilmCard({ film, onFilmClick }) {
  const {
    title,
    description,
    thumbnail,
    credits,
    imagePosition,
  } = film;

  const isImageLeft = imagePosition === 'left';
  const handleClick = () => onFilmClick(film);

  return (
    <article className="w-full max-w-container bg-white border-t border-b border-border px-[5%] py-8 lg:py-12">
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

        {/* TEXT CONTENT */}
        <div className="flex flex-col flex-1 min-w-0 items-start gap-9 py-6">
          <header>
            <h3
              onClick={handleClick}
              className="project-title cursor-pointer hover:opacity-70 transition-opacity duration-150"
            >
              {title}
            </h3>
          </header>

          <div className="relative w-full max-w-[584px]">
            <p className="font-header text-sm tracking-wide leading-6 text-primary">
              {description}
            </p>
          </div>

          {/* Credits */}
          <div className="flex w-full max-w-[584px] items-start justify-center gap-6 md:gap-11">
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
