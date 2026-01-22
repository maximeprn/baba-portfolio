/**
 * ============================================================================
 * PHOTO PROJECT PAGE
 * ============================================================================
 *
 * Displays the full gallery for a single photo project.
 * This page is shown when clicking on a project from the Photos page.
 *
 * URL PATTERN: /photos/:slug
 * Example: /photos/summer-campaign-2024
 *
 * PAGE STRUCTURE:
 * 1. Back navigation
 * 2. Project header (title, description, metadata)
 * 3. Photo grid
 * 4. Lightbox (opens when photo is clicked)
 * 5. Navigation to other projects
 *
 * ============================================================================
 */

// useState hook for managing lightbox state
import { useState } from 'react';

// React Router hooks for URL parameters and navigation
import { useParams, useNavigate, Link } from 'react-router-dom';

// Import components
import PhotoGrid from '../components/photos/PhotoGrid';
import Lightbox from '../components/ui/Lightbox';

// Import photo project data and helpers
import { getProjectBySlug, getAdjacentProjects } from '../data/photoProjects';


/**
 * PhotoProject Page Component
 *
 * Shows the complete gallery for a single photo project.
 *
 * @returns {JSX.Element} The photo project gallery page
 */
function PhotoProject() {
  // Extract the 'slug' parameter from the URL
  const { slug } = useParams();

  // Navigation hook
  const navigate = useNavigate();

  // Find the project data that matches the URL slug
  const project = getProjectBySlug(slug);

  // Get adjacent projects for navigation
  const { prev, next } = getAdjacentProjects(slug);


  // =========================================================================
  // LIGHTBOX STATE
  // =========================================================================

  // Whether the lightbox is currently open
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Index of the currently displayed photo in the lightbox
  const [lightboxIndex, setLightboxIndex] = useState(0);


  /**
   * Open the lightbox at a specific photo
   *
   * @param {Object} photo - The photo object (not used, but received from grid)
   * @param {number} index - The index of the photo to display
   */
  const openLightbox = (photo, index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };


  /**
   * Close the lightbox
   */
  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };


  /**
   * Navigate to a specific photo in the lightbox
   *
   * @param {number} newIndex - The index to navigate to
   */
  const navigateLightbox = (newIndex) => {
    setLightboxIndex(newIndex);
  };


  // =========================================================================
  // RENDER
  // =========================================================================

  // Handle case where project is not found
  if (!project) {
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
        <h1 className="font-title text-2xl">Project not found</h1>
        <p className="font-body text-muted">
          The project you're looking for doesn't exist.
        </p>
        <Link
          to="/photos"
          className="
            font-header
            text-sm
            uppercase
            tracking-wide
            hover:opacity-70
            transition-opacity
          "
        >
          ← Back to Photos
        </Link>
      </div>
    );
  }


  // Destructure project data
  const {
    title,
    description,
    year,
    client,
    category,
    location,
    photos,
  } = project;


  return (
    <>
      {/* Main page container */}
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
            ← Back
          </button>
        </div>


        {/* PROJECT HEADER */}
        <header
          className="
            w-full
            max-w-4xl
            flex
            flex-col
            gap-4
            mb-12
          "
        >
          {/* Project title */}
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

          {/* Description */}
          <p
            className="
              font-body
              text-base
              leading-relaxed
              text-muted
              max-w-2xl
            "
          >
            {description}
          </p>

          {/* Metadata */}
          <div
            className="
              flex
              flex-wrap
              gap-4
              font-body
              text-sm
              text-muted
            "
          >
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
            {location && (
              <>
                <span>•</span>
                <span>{location}</span>
              </>
            )}
          </div>

          {/* Photo count */}
          <p className="font-header text-xs uppercase tracking-wide text-muted">
            {photos.length} photos
          </p>
        </header>


        {/* PHOTO GRID */}
        <section
          className="w-full"
          aria-label="Photo gallery"
        >
          <PhotoGrid
            photos={photos}
            onPhotoClick={openLightbox}
          />
        </section>


        {/* NAVIGATION TO OTHER PROJECTS */}
        <nav
          className="
            w-full
            max-w-4xl
            flex
            justify-between
            items-center
            pt-12
            mt-12
            border-t
            border-border
          "
          aria-label="Project navigation"
        >
          {/* Previous project */}
          {prev ? (
            <Link
              to={`/photos/${prev.slug}`}
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
            <div />
          )}

          {/* Back to all projects link */}
          <Link
            to="/photos"
            className="
              font-header
              text-xs
              uppercase
              tracking-wide
              text-muted
              hover:text-primary
              transition-colors
            "
          >
            All Projects
          </Link>

          {/* Next project */}
          {next ? (
            <Link
              to={`/photos/${next.slug}`}
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


        {/* BOTTOM SPACING */}
        <div className="h-20" aria-hidden="true" />
      </div>


      {/* LIGHTBOX
          Rendered outside the main container so it can cover the full viewport.
          Only renders when isLightboxOpen is true.
      */}
      <Lightbox
        photos={photos}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
      />
    </>
  );
}

// Export for use in App.jsx router
export default PhotoProject;
