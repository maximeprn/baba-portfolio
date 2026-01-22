/**
 * ============================================================================
 * PHOTO PROJECTS DATA
 * ============================================================================
 *
 * This file contains all photography project data.
 * Projects are collections of related photos (series, campaigns, etc.)
 *
 * TO ADD A NEW PROJECT:
 * 1. Copy an existing project object
 * 2. Update all fields with new information
 * 3. Add photos to /src/assets/photos/project-slug/
 * 4. List all photo filenames in the 'photos' array
 *
 * STRUCTURE:
 * - Each project has basic info (title, description, cover)
 * - Each project has an array of photos
 * - Photos can have captions and metadata
 *
 * ============================================================================
 */

export const photoProjects = [
  {
    // Unique identifier
    id: 1,

    // URL slug - used in browser URL (/photos/project-name)
    slug: 'summer-campaign-2024',

    // Project title
    title: 'Summer Campaign 2024',

    // Short description shown on project card
    description: 'A vibrant summer campaign exploring light and color in urban environments.',

    // Cover image - shown on the projects listing page
    // This should be one of the best images from the project
    coverImage: '/src/assets/photos/summer-campaign-2024/cover.jpg',

    // Year the project was completed
    year: 2024,

    // Client name (null for personal work)
    client: 'Fashion Brand',

    // Project category
    category: 'Commercial',

    // Location where photos were taken
    location: 'Paris, France',

    // Array of photos in this project
    // Each photo object contains image path and optional metadata
    photos: [
      {
        // Unique ID within this project
        id: 1,
        // Path to the full-size image
        src: '/src/assets/photos/summer-campaign-2024/photo-01.jpg',
        // Alt text for accessibility (describe the image)
        alt: 'Model in yellow dress against blue wall',
        // Optional caption shown in lightbox
        caption: null,
        // Aspect ratio for layout (width/height)
        // Common ratios: 1.5 (3:2), 1.33 (4:3), 0.67 (2:3 portrait)
        aspectRatio: 1.5,
      },
      {
        id: 2,
        src: '/src/assets/photos/summer-campaign-2024/photo-02.jpg',
        alt: 'Close-up portrait with natural lighting',
        caption: null,
        aspectRatio: 0.67, // Portrait orientation
      },
      {
        id: 3,
        src: '/src/assets/photos/summer-campaign-2024/photo-03.jpg',
        alt: 'Wide shot of urban street scene',
        caption: null,
        aspectRatio: 1.5,
      },
      {
        id: 4,
        src: '/src/assets/photos/summer-campaign-2024/photo-04.jpg',
        alt: 'Detail shot of accessories',
        caption: null,
        aspectRatio: 1,
      },
      {
        id: 5,
        src: '/src/assets/photos/summer-campaign-2024/photo-05.jpg',
        alt: 'Full body shot in motion',
        caption: null,
        aspectRatio: 0.67,
      },
      // Add more photos as needed...
    ],

    // Whether this is a featured project (shown more prominently)
    featured: true,
  },

  {
    id: 2,
    slug: 'portraits-series',
    title: 'Portraits Series',
    description: 'An intimate collection of portrait photography exploring identity and expression.',
    coverImage: '/src/assets/photos/portraits-series/cover.jpg',
    year: 2023,
    client: null, // Personal project
    category: 'Personal',
    location: 'Various',
    photos: [
      {
        id: 1,
        src: '/src/assets/photos/portraits-series/photo-01.jpg',
        alt: 'Portrait in natural light',
        caption: null,
        aspectRatio: 0.67,
      },
      {
        id: 2,
        src: '/src/assets/photos/portraits-series/photo-02.jpg',
        alt: 'Studio portrait with dramatic lighting',
        caption: null,
        aspectRatio: 0.67,
      },
      {
        id: 3,
        src: '/src/assets/photos/portraits-series/photo-03.jpg',
        alt: 'Environmental portrait',
        caption: null,
        aspectRatio: 1.5,
      },
      // Add more photos...
    ],
    featured: true,
  },

  {
    id: 3,
    slug: 'documentary-work',
    title: 'Documentary Work',
    description: 'Behind-the-scenes and documentary photography from various film productions.',
    coverImage: '/src/assets/photos/documentary-work/cover.jpg',
    year: 2023,
    client: null,
    category: 'Documentary',
    location: 'Various',
    photos: [
      {
        id: 1,
        src: '/src/assets/photos/documentary-work/photo-01.jpg',
        alt: 'Film crew on set',
        caption: null,
        aspectRatio: 1.5,
      },
      {
        id: 2,
        src: '/src/assets/photos/documentary-work/photo-02.jpg',
        alt: 'Director reviewing footage',
        caption: null,
        aspectRatio: 1.5,
      },
      // Add more photos...
    ],
    featured: false,
  },

  // Add more projects following the same structure...
];


// -------------------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------------------

/**
 * Get a single project by its slug
 * Used on the project detail page
 *
 * @param {string} slug - The URL slug of the project
 * @returns {Object|undefined} The project object or undefined
 */
export const getProjectBySlug = (slug) => {
  return photoProjects.find((project) => project.slug === slug);
};


/**
 * Get all featured projects
 * Used for highlighting on the photos landing page
 *
 * @returns {Array} Array of featured project objects
 */
export const getFeaturedProjects = () => {
  return photoProjects.filter((project) => project.featured);
};


/**
 * Get projects by category
 *
 * @param {string} category - The category to filter by
 * @returns {Array} Array of projects in that category
 */
export const getProjectsByCategory = (category) => {
  return photoProjects.filter((project) => project.category === category);
};


/**
 * Get all unique categories
 *
 * @returns {Array} Array of unique category strings
 */
export const getAllPhotoCategories = () => {
  const categories = photoProjects.map((project) => project.category);
  return [...new Set(categories)];
};


/**
 * Get the next and previous projects
 *
 * @param {string} currentSlug - The slug of the current project
 * @returns {Object} Object with prev and next project objects
 */
export const getAdjacentProjects = (currentSlug) => {
  const currentIndex = photoProjects.findIndex(
    (project) => project.slug === currentSlug
  );

  return {
    prev: currentIndex > 0 ? photoProjects[currentIndex - 1] : null,
    next:
      currentIndex < photoProjects.length - 1
        ? photoProjects[currentIndex + 1]
        : null,
  };
};


/**
 * Get a specific photo from a project
 *
 * @param {string} projectSlug - The project slug
 * @param {number} photoId - The photo ID within the project
 * @returns {Object|undefined} The photo object
 */
export const getPhotoById = (projectSlug, photoId) => {
  const project = getProjectBySlug(projectSlug);
  if (!project) return undefined;
  return project.photos.find((photo) => photo.id === photoId);
};


/**
 * Get total photo count for a project
 *
 * @param {string} projectSlug - The project slug
 * @returns {number} Number of photos in the project
 */
export const getPhotoCount = (projectSlug) => {
  const project = getProjectBySlug(projectSlug);
  return project ? project.photos.length : 0;
};


// Export as default
export default photoProjects;
