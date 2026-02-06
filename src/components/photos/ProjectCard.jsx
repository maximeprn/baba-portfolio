/**
 * ============================================================================
 * PROJECT CARD COMPONENT
 * ============================================================================
 *
 * Displays a single photo project as a card on the Photos listing page.
 *
 * LAYOUT:
 * ┌─────────────────────────────────────┐
 * │                                     │
 * │         [COVER IMAGE]               │
 * │                                     │
 * ├─────────────────────────────────────┤
 * │  Project Title                      │
 * │  Short description text...          │
 * │  Year • Category                    │
 * └─────────────────────────────────────┘
 *
 * FEATURES:
 * - Clickable to navigate to project gallery
 * - Hover effect on image
 * - Displays cover image, title, description, and metadata
 *
 * ============================================================================
 */

// Link for navigation to project gallery
import { Link } from 'react-router-dom';


/**
 * ProjectCard Component
 *
 * Renders a photo project preview card.
 *
 * @param {Object} props - Component props
 * @param {Object} props.project - The project data object
 * @param {string} props.project.slug - URL slug for the project
 * @param {string} props.project.title - Project title
 * @param {string} props.project.description - Short description
 * @param {string} props.project.coverImage - Path to cover image
 * @param {number} props.project.year - Year completed
 * @param {string} props.project.category - Project category
 * @returns {JSX.Element} The project card
 */
function ProjectCard({ project }) {
  // Destructure project data
  const {
    slug,
    title,
    description,
    coverImage,
    year,
    category,
  } = project;


  return (
    // The entire card is a link to the project gallery
    <Link
      to={`/photos/${slug}`}
      className="
        group                            /* Group for hover effects on children */
        flex
        flex-col
        w-full
        cursor-pointer
      "
    >
      {/* IMAGE CONTAINER */}
      <div
        className="
          relative                       /* Position context for overlay */
          w-full
          aspect-[4/3]                   /* 4:3 aspect ratio for cover images */
          overflow-hidden                /* Hide image overflow on scale */
          bg-gray-100                    /* Placeholder color while loading */
        "
      >
        {/* Cover image with hover effect */}
        <img
          src={coverImage}
          alt={title}
          loading="lazy"
          className="
            w-full
            h-full
            object-cover                 /* Cover the area */
            transition-transform         /* Smooth transform animation */
            duration-500                 /* 500ms animation */
            ease-out                     /* Ease out timing */
            group-hover:scale-105        /* Zoom in slightly on card hover */
          "
        />

        {/* Optional: Overlay on hover
            Uncomment if you want a subtle overlay effect */}
        {/*
        <div
          className="
            absolute
            inset-0
            bg-black
            opacity-0
            group-hover:opacity-10
            transition-opacity
            duration-300
          "
        />
        */}
      </div>


      {/* TEXT CONTENT */}
      <div className="flex flex-col gap-2 pt-4">
        {/* Project title */}
        <h3
          className="
            font-title
            text-lg
            font-bold
            tracking-wide
            group-hover:opacity-70       /* Fade on hover */
            transition-opacity
            duration-150
          "
        >
          {title}
        </h3>

        {/* Description - limited to 2 lines */}
        <p
          className="
            font-body
            text-sm
            text-muted
            leading-relaxed
            line-clamp-2                 /* Limit to 2 lines with ellipsis */
          "
        >
          {description}
        </p>

        {/* Metadata: Year and Category */}
        <div
          className="
            flex
            items-center
            gap-2
            font-body
            text-xs
            text-muted
            mt-1
          "
        >
          {year && <span>{year}</span>}
          {year && category && <span>•</span>}
          {category && <span>{category}</span>}
        </div>
      </div>
    </Link>
  );
}

// Export for use in Photos page
export default ProjectCard;
