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
    <article
      className="
        flex w-full max-w-container aspect-[2/1] max-h-[650px]
        items-center justify-around px-[5%]
        bg-white border-t border-b border-border
      "
    >
      <div className="flex items-center justify-between relative flex-1">
        {/* IMAGE — Left position */}
        {isImageLeft && (
          <div className="grid grid-cols-1 grid-rows-1 w-[50%] h-[73%] absolute top-[9%] left-0">
            <div onClick={handleClick} className="cursor-pointer">
              <img
                src={thumbnail}
                alt={`Project image for ${title}`}
                loading="lazy"
                className="justify-self-start row-[1_/_2] col-[1_/_2] self-end w-[95%] h-[95%] aspect-[1.36] object-cover transition-opacity duration-300 hover:opacity-90"
              />
            </div>
          </div>
        )}

        {/* TEXT CONTENT */}
        <div
          className={`
            inline-flex flex-col h-[91%] items-start justify-center
            gap-9 px-[3%] py-6
            ${isImageLeft ? 'ml-auto' : ''}
          `}
        >
          <header className="inline-flex h-[89px] items-center justify-center">
            <h3
              onClick={handleClick}
              className="project-title cursor-pointer hover:opacity-70 transition-opacity duration-150"
            >
              {title}
            </h3>
          </header>

          <div className="relative w-full max-w-[584px] h-[170px]">
            <p
              className="font-header text-sm tracking-wider leading-6 text-primary"
            >
              {description}
            </p>
          </div>

          {/* Credits */}
          <div className="flex w-full max-w-[584px] items-start justify-center gap-11">
            <div className="flex-1 font-header text-sm tracking-wide leading-7">
              {credits.left.map((credit, i) => (
                <p key={i}>{credit.role} : {credit.name}</p>
              ))}
            </div>
            <div className="flex-1 h-[120px] font-header text-sm tracking-wide leading-7">
              {credits.right.map((credit, i) => (
                <p key={i}>{credit.role} : {credit.name}</p>
              ))}
            </div>
          </div>
        </div>

        {/* IMAGE — Right position */}
        {!isImageLeft && (
          <div className="grid grid-cols-1 grid-rows-1 w-[50%] h-[73%] absolute top-[9%] right-0">
            <div onClick={handleClick} className="cursor-pointer">
              <img
                src={thumbnail}
                alt={`Project image for ${title}`}
                loading="lazy"
                className="justify-self-end row-[1_/_2] col-[1_/_2] self-end w-[95%] h-[95%] aspect-[1.36] object-cover transition-opacity duration-300 hover:opacity-90"
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default FilmCard;
