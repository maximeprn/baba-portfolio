/**
 * ============================================================================
 * PHOTOS PAGE
 * ============================================================================
 *
 * Lists all photo projects as a grid of cards.
 * Each card links to the full project gallery.
 *
 * URL: /photos
 *
 * PAGE STRUCTURE:
 * 1. Page title
 * 2. Grid of project cards
 *
 * DATA SOURCE:
 * Photo projects come from /src/data/photoProjects.js
 *
 * ============================================================================
 */

// Import the ProjectCard component
import ProjectCard from '../components/photos/ProjectCard';

// Import photo projects data
import { photoProjects } from '../data/photoProjects';


/**
 * Photos Page Component
 *
 * Displays all photo projects in a responsive grid.
 *
 * @returns {JSX.Element} The Photos listing page
 */
function Photos() {
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
        py-12
      "
    >
      {/* PAGE HEADER */}
      <header className="w-full mb-12">
        <h1
          className="
            font-header
            text-4xl
            md:text-5xl
            text-center
          "
        >
          PHOTOS
        </h1>
      </header>


      {/* PROJECTS GRID
          Grid layout with responsive columns:
          - 1 column on mobile (default)
          - 2 columns on medium screens (md:)
          - 3 columns on large screens (lg:)
      */}
      <section
        className="
          grid
          grid-cols-1
          md:grid-cols-2
          lg:grid-cols-3
          gap-8                          /* Space between cards */
          w-full
        "
        aria-label="Photo projects"
      >
        {/*
          Map through all projects and render a card for each.

          The spread operator {...project} passes all project properties
          as individual props, but we're using project={project} instead
          for clarity and explicit prop passing.
        */}
        {photoProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
          />
        ))}
      </section>


      {/* EMPTY STATE
          Shows a message if there are no projects
          This is good UX - don't leave users wondering if something broke
      */}
      {photoProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="font-body text-muted text-lg">
            No photo projects yet.
          </p>
        </div>
      )}


      {/* BOTTOM SPACING */}
      <div className="h-20" aria-hidden="true" />
    </div>
  );
}

// Export for use in App.jsx router
export default Photos;
