/**
 * ============================================================================
 * FILM CARD COMPONENT
 * ============================================================================
 *
 * Displays a single film project in the alternating layout on the homepage.
 *
 * LAYOUT (imagePosition="right"):
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  ┌──────────────────────────────┐    ┌──────────────────────────────┐  │
 * │  │  TITLE                       │    │                              │  │
 * │  │                              │    │                              │  │
 * │  │  Description text here...    │    │         [IMAGE]              │  │
 * │  │                              │    │                              │  │
 * │  │  Credits:     Credits:       │    │                              │  │
 * │  │  Direction    Production     │    │                              │  │
 * │  │  DOP          Producer       │    │                              │  │
 * │  └──────────────────────────────┘    └──────────────────────────────┘  │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * LAYOUT (imagePosition="left"):
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  ┌──────────────────────────────┐    ┌──────────────────────────────┐  │
 * │  │                              │    │  TITLE                       │  │
 * │  │                              │    │                              │  │
 * │  │         [IMAGE]              │    │  Description text here...    │  │
 * │  │                              │    │                              │  │
 * │  │                              │    │  Credits:     Credits:       │  │
 * │  │                              │    │  Direction    Production     │  │
 * │  └──────────────────────────────┘    └──────────────────────────────┘  │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * FEATURES:
 * - Alternating image position (left/right)
 * - Clickable to navigate to film detail page
 * - Displays title, description, and credits
 * - Responsive design
 *
 * ============================================================================
 */

// Link for navigation to film detail page
import { Link } from 'react-router-dom';


/**
 * FilmCard Component
 *
 * Renders a single film project card with alternating layout.
 *
 * @param {Object} props - Component props
 * @param {Object} props.film - The film data object
 * @param {number} props.film.id - Unique film ID
 * @param {string} props.film.slug - URL slug for the film
 * @param {string} props.film.title - Film title
 * @param {string} props.film.description - Film description
 * @param {string} props.film.thumbnail - Path to thumbnail image
 * @param {Object} props.film.credits - Credits object with left and right arrays
 * @param {string} props.film.imagePosition - 'left' or 'right'
 * @returns {JSX.Element} The film card
 */
function FilmCard({ film }) {
  // Destructure film data for cleaner code
  const {
    slug,
    title,
    description,
    thumbnail,
    credits,
    imagePosition,
  } = film;

  // Determine if image should be on the left side
  const isImageLeft = imagePosition === 'left';

  return (
    // <article> is the semantic element for self-contained content
    // Wrapping in Link makes the entire card clickable
    <article
      className="
        flex                             /* Flexbox layout */
        w-full                           /* Full width */
        max-w-container                  /* Capped at container width */
        max-h-[650px]                    /* Maximum height */
        h-[653px]                        /* Fixed height matching design */
        items-center                     /* Center vertically */
        justify-around                   /* Space around items */
        px-[70px]                        /* Horizontal padding */
        bg-white                         /* White background */
        border-t                         /* Top border */
        border-b                         /* Bottom border */
        border-border                    /* Border color from variables */
      "
    >
      {/* Inner container for content and image */}
      <div className="flex items-center justify-between relative flex-1">
        {/* IMAGE - Positioned absolutely on left or right */}
        {/* Only render on left if imagePosition is 'left' */}
        {isImageLeft && (
          <div
            className="
              grid                       /* Grid for image positioning */
              grid-cols-1
              grid-rows-1
              w-[648px]                  /* Fixed width */
              h-[476px]                  /* Fixed height */
              absolute                   /* Absolute positioning */
              top-[60px]                 /* Offset from top */
              left-0                     /* Align to left */
            "
          >
            {/* Link wraps the image for navigation */}
            <Link to={`/films/${slug}`}>
              <img
                src={thumbnail}
                alt={`Project image for ${title}`}
                className="
                  justify-self-start     /* Align to start of grid cell */
                  row-[1_/_2]            /* Grid row placement */
                  col-[1_/_2]            /* Grid column placement */
                  self-end               /* Align to end */
                  w-[616px]              /* Fixed width */
                  h-[452px]              /* Fixed height */
                  aspect-[1.36]          /* Maintain aspect ratio */
                  object-cover           /* Cover the area */
                  cursor-pointer         /* Pointer cursor on hover */
                  transition-opacity     /* Smooth opacity transition */
                  duration-300
                  hover:opacity-90       /* Slight fade on hover */
                "
              />
            </Link>
          </div>
        )}


        {/* TEXT CONTENT - Title, description, credits */}
        <div
          className={`
            inline-flex                  /* Inline flexbox */
            flex-col                     /* Stack vertically */
            h-[596px]                    /* Fixed height */
            items-start                  /* Align to start */
            justify-center               /* Center vertically */
            gap-9                        /* Gap between sections */
            px-[38px]                    /* Horizontal padding */
            py-6                         /* Vertical padding */
            ${isImageLeft ? 'ml-auto' : ''} /* Push to right if image is left */
          `}
        >
          {/* TITLE */}
          <header className="inline-flex h-[89px] items-center justify-center">
            <Link to={`/films/${slug}`}>
              <h3
                className="
                  project-title          /* Custom class from CSS */
                  cursor-pointer
                  hover:opacity-70       /* Fade on hover */
                  transition-opacity
                  duration-150
                "
              >
                {title}
              </h3>
            </Link>
          </header>


          {/* DESCRIPTION */}
          <div className="relative w-[584px] h-[170px]">
            <p
              className="
                text-sm                  /* 14px */
                tracking-wider           /* Letter spacing */
                leading-6               /* Line height */
                text-primary             /* Black color */
              "
              style={{ fontFamily: 'Helvetica Now Display' }}
            >
              {description}
            </p>
          </div>


          {/* CREDITS - Two columns */}
          <div className="flex w-[584px] items-start justify-center gap-11">
            {/* Left column credits */}
            <div
              className="flex-1 text-sm tracking-wide leading-7"
              style={{ fontFamily: 'Helvetica Now Display' }}
            >
              {credits.left.map((credit, index) => (
                <p key={index}>
                  {/* Format: "Role : Name" */}
                  {credit.role} : {credit.name}
                </p>
              ))}
            </div>

            {/* Right column credits */}
            <div
              className="flex-1 h-[120px] text-sm tracking-wide leading-7"
              style={{ fontFamily: 'Helvetica Now Display' }}
            >
              {credits.right.map((credit, index) => (
                <p key={index}>
                  {credit.role} : {credit.name}
                </p>
              ))}
            </div>
          </div>
        </div>


        {/* IMAGE - Positioned absolutely on the right */}
        {/* Only render on right if imagePosition is 'right' */}
        {!isImageLeft && (
          <div
            className="
              grid
              grid-cols-1
              grid-rows-1
              w-[648px]
              h-[476px]
              absolute
              top-[60px]
              left-[652px]              /* Offset to the right side */
            "
          >
            <Link to={`/films/${slug}`}>
              <img
                src={thumbnail}
                alt={`Project image for ${title}`}
                className="
                  justify-self-end       /* Align to end of grid cell */
                  row-[1_/_2]
                  col-[1_/_2]
                  self-end
                  w-[616px]
                  h-[452px]
                  aspect-[1.36]
                  object-cover
                  cursor-pointer
                  transition-opacity
                  duration-300
                  hover:opacity-90
                "
              />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

// Export for use in Films page
export default FilmCard;
