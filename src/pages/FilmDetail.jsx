/**
 * ============================================================================
 * FILM DETAIL PAGE
 * ============================================================================
 *
 * Displays the full details of a single film project.
 * This page is shown when clicking on a film from the homepage.
 *
 * URL PATTERN: /films/:slug
 * Example: /films/decathlon-cocreation
 *
 * PAGE STRUCTURE:
 * 1. Back navigation link
 * 2. Video player (Vimeo/YouTube embed)
 * 3. Film title and metadata
 * 4. Description
 * 5. Full credits
 * 6. Next/Previous navigation
 *
 * ============================================================================
 */

// useParams hook extracts URL parameters (like :slug)
// useNavigate hook allows programmatic navigation
// Link component for declarative navigation
import { useParams, useNavigate, Link } from 'react-router-dom';

// Import the video player component
import VideoPlayer from '../components/films/VideoPlayer';

// Import film data and helper functions
import { getFilmBySlug, getAdjacentFilms } from '../data/films';


/**
 * FilmDetail Page Component
 *
 * Shows the complete details of a single film.
 *
 * @returns {JSX.Element} The film detail page
 */
function FilmDetail() {
  // Extract the 'slug' parameter from the URL
  // If URL is /films/decathlon-cocreation, slug = "decathlon-cocreation"
  const { slug } = useParams();

  // Hook for programmatic navigation (going back, redirecting, etc.)
  const navigate = useNavigate();

  // Find the film data that matches the URL slug
  const film = getFilmBySlug(slug);

  // Get previous and next films for navigation
  const { prev, next } = getAdjacentFilms(slug);


  // Handle case where film is not found
  // This happens if someone types a wrong URL
  if (!film) {
    return (
      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          min-h-[50vh]
          gap-4
        "
      >
        <h1 className="font-title text-2xl">Film not found</h1>
        <p className="font-body text-muted">
          The film you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="
            font-header
            text-sm
            uppercase
            tracking-wide
            hover:opacity-70
            transition-opacity
          "
        >
          ← Back to Films
        </Link>
      </div>
    );
  }


  // Destructure film data for cleaner code
  const {
    title,
    description,
    videoUrl,
    videoType,
    year,
    client,
    category,
    credits,
  } = film;


  return (
    // Main page container
    <div
      className="
        flex
        flex-col
        items-center
        w-full
        max-w-container
        px-6
        py-8
      "
    >
      {/* BACK NAVIGATION */}
      <div className="w-full mb-8">
        {/*
          Button that navigates back to the previous page
          navigate(-1) goes back one step in browser history
          This is like clicking the browser's back button
        */}
        <button
          onClick={() => navigate(-1)}
          className="
            font-header
            text-sm
            uppercase
            tracking-wide
            hover:opacity-70
            transition-opacity
            flex
            items-center
            gap-2
          "
        >
          {/* Arrow character */}
          ← Back
        </button>
      </div>


      {/* VIDEO PLAYER SECTION */}
      <section
        className="
          w-full
          max-w-4xl                      /* Limit video width for better viewing */
          mb-12
        "
        aria-label="Video"
      >
        <VideoPlayer
          url={videoUrl}
          type={videoType}
          title={title}
        />
      </section>


      {/* FILM INFORMATION SECTION */}
      <section
        className="
          w-full
          max-w-4xl
          flex
          flex-col
          gap-8
        "
        aria-label="Film information"
      >
        {/* TITLE AND METADATA */}
        <header className="flex flex-col gap-4">
          <h1
            className="
              font-title
              text-3xl
              md:text-4xl
              font-bold
              tracking-wide
            "
          >
            {title}
          </h1>

          {/* Metadata row: Year, Client, Category */}
          <div className="flex flex-wrap gap-4 text-muted font-body text-sm">
            {year && <span>{year}</span>}
            {client && (
              <>
                <span>•</span>
                <span>{client}</span>
              </>
            )}
            {category && (
              <>
                <span>•</span>
                <span>{category}</span>
              </>
            )}
          </div>
        </header>


        {/* DESCRIPTION */}
        <div className="max-w-2xl">
          <p
            className="
              font-body
              text-base
              leading-relaxed
              tracking-wide
            "
          >
            {description}
          </p>
        </div>


        {/* CREDITS SECTION */}
        <section aria-label="Credits">
          <h2
            className="
              font-header
              text-lg
              uppercase
              tracking-wider
              mb-6
            "
          >
            Credits
          </h2>

          {/* Two-column credits layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column */}
            <div className="flex flex-col gap-3">
              {credits.left.map((credit, index) => (
                <div key={index} className="flex flex-col">
                  <span className="font-body text-sm text-muted">
                    {credit.role}
                  </span>
                  <span className="font-body text-base">
                    {credit.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-3">
              {credits.right.map((credit, index) => (
                <div key={index} className="flex flex-col">
                  <span className="font-body text-sm text-muted">
                    {credit.role}
                  </span>
                  <span className="font-body text-base">
                    {credit.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* NAVIGATION TO OTHER FILMS */}
        <nav
          className="
            flex
            justify-between
            items-center
            pt-12
            mt-8
            border-t
            border-border
          "
          aria-label="Film navigation"
        >
          {/* Previous film link */}
          {prev ? (
            <Link
              to={`/films/${prev.slug}`}
              className="
                flex
                flex-col
                items-start
                gap-1
                hover:opacity-70
                transition-opacity
              "
            >
              <span className="font-header text-xs uppercase text-muted">
                ← Previous
              </span>
              <span className="font-body text-sm">
                {prev.title}
              </span>
            </Link>
          ) : (
            // Empty div to maintain layout when there's no previous film
            <div />
          )}

          {/* Next film link */}
          {next ? (
            <Link
              to={`/films/${next.slug}`}
              className="
                flex
                flex-col
                items-end
                gap-1
                hover:opacity-70
                transition-opacity
              "
            >
              <span className="font-header text-xs uppercase text-muted">
                Next →
              </span>
              <span className="font-body text-sm">
                {next.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </section>


      {/* BOTTOM SPACING */}
      <div className="h-20" aria-hidden="true" />
    </div>
  );
}

// Export for use in App.jsx router
export default FilmDetail;
