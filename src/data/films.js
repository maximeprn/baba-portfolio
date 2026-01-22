/**
 * ============================================================================
 * FILMS DATA
 * ============================================================================
 *
 * This file contains all film/video project data.
 * Each film object includes all information needed to display on the site.
 *
 * TO ADD A NEW FILM:
 * 1. Copy an existing film object
 * 2. Update all fields with new information
 * 3. Add the thumbnail image to /src/assets/films/
 * 4. The film will automatically appear on the homepage
 *
 * FIELDS EXPLAINED:
 * - id: Unique number for React keys (increment for each new film)
 * - slug: URL-friendly version of title (used in /films/slug)
 * - title: Display title of the project
 * - description: Full description shown on detail page and cards
 * - thumbnail: Path to the preview image
 * - videoUrl: Vimeo or YouTube embed URL
 * - videoType: 'vimeo' or 'youtube' (for embed component)
 * - year: Year the project was completed
 * - client: Client name (if commercial work)
 * - category: Type of work (commercial, music video, documentary, etc.)
 * - credits: Object containing all crew credits
 * - imagePosition: 'left' or 'right' for alternating layout on homepage
 * - featured: Boolean - if true, shown prominently
 * - aspectRatio: Video aspect ratio (width/height) e.g., 1.78 for 16:9, 1.33 for 4:3
 *
 * ============================================================================
 */

export const films = [
  {
    id: 1,
    slug: 'decathlon-cocreation',
    title: 'Decathlon "Co-Creation" Olympic Games Campaign',
    description: 'A celebration of collective spirit and athletic ambition crafted for the Paris 2024 Olympic Games. This campaign captures the essence of co-creation—athletes, designers, and communities united in the pursuit of movement and excellence.',
    thumbnail: '/posters/decathlon.jpg',
    videoFile: '/videos/decathlon.mp4',
    videoUrl: 'https://player.vimeo.com/video/989542038',
    videoType: 'vimeo',
    year: 2024,
    client: 'Decathlon',
    category: 'Commercial',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
        { role: 'DOP', name: 'Julien Caldarone / Studio Lamadone' },
        { role: 'Edit, Compositing, Color', name: 'Lucas Brunier' },
        { role: 'Music', name: 'Basile Deschamps' },
      ],
      right: [
        { role: 'Production', name: 'Pral' },
        { role: 'Producer', name: '@alloalix' },
        { role: 'Line Producer', name: '@antoinewatine' },
      ],
    },
    imagePosition: 'right',
    featured: true,
    aspectRatio: 1.25, // 5:4
  },

  {
    id: 2,
    slug: 'badre-documentary',
    title: 'Badre - A Short Documentary',
    description: 'An intimate portrait exploring the journey of an athlete pushing beyond limits. This documentary captures raw moments of dedication, struggle, and triumph in the pursuit of excellence.',
    thumbnail: '/posters/badre.jpg',
    videoFile: '/videos/badre.mp4',
    videoUrl: 'https://player.vimeo.com/video/768152390',
    videoType: 'vimeo',
    year: 2023,
    client: 'DISTANCE',
    category: 'Documentary',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
        { role: 'DOP', name: 'Julien Caldarone' },
      ],
      right: [
        { role: 'Production', name: 'DISTANCE' },
      ],
    },
    imagePosition: 'left',
    featured: true,
    aspectRatio: 1.33, // 4:3
  },

  {
    id: 3,
    slug: 'salomon-trail-running',
    title: 'Salomon Trail Running',
    description: 'A cinematic spec ad showcasing the raw beauty of trail running. Capturing the essence of freedom and connection with nature through dynamic visuals and immersive storytelling.',
    thumbnail: '/posters/salomon.jpg',
    videoFile: '/videos/salomon.mp4',
    videoUrl: 'https://player.vimeo.com/video/551544527',
    videoType: 'vimeo',
    year: 2023,
    client: 'Salomon',
    category: 'Spec Ad',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
        { role: 'DOP', name: 'Studio Lamadone' },
      ],
      right: [
        { role: 'Edit', name: 'Lucas Brunier' },
      ],
    },
    imagePosition: 'right',
    featured: true,
    aspectRatio: 1.78, // 16:9
  },

  {
    id: 4,
    slug: 'veja-condor-3',
    title: 'Veja Condor 3',
    description: 'A visual exploration of sustainable performance footwear. Blending minimalist aesthetics with powerful athletic imagery to showcase the intersection of eco-conscious design and high performance.',
    thumbnail: '/posters/veja.jpg',
    videoFile: '/videos/veja.mp4',
    videoUrl: 'https://player.vimeo.com/video/1062003612',
    videoType: 'vimeo',
    year: 2024,
    client: 'Veja',
    category: 'Commercial',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
        { role: 'DOP', name: 'Julien Caldarone' },
      ],
      right: [
        { role: 'Production', name: 'Pral' },
      ],
    },
    imagePosition: 'left',
    featured: true,
    aspectRatio: 1.78, // 16:9
  },
];


// -------------------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------------------
// These functions make it easier to work with film data

/**
 * Get a single film by its slug
 * Used on the film detail page to find the correct film
 *
 * @param {string} slug - The URL slug of the film
 * @returns {Object|undefined} The film object or undefined if not found
 *
 * Example usage:
 * const film = getFilmBySlug('decathlon-cocreation');
 */
export const getFilmBySlug = (slug) => {
  return films.find((film) => film.slug === slug);
};


/**
 * Get all featured films
 * Used to display highlighted projects
 *
 * @returns {Array} Array of featured film objects
 */
export const getFeaturedFilms = () => {
  return films.filter((film) => film.featured);
};


/**
 * Get films by category
 * Useful for filtering films by type
 *
 * @param {string} category - The category to filter by
 * @returns {Array} Array of films in that category
 */
export const getFilmsByCategory = (category) => {
  return films.filter((film) => film.category === category);
};


/**
 * Get all unique categories
 * Useful for building filter menus
 *
 * @returns {Array} Array of unique category strings
 */
export const getAllCategories = () => {
  const categories = films.map((film) => film.category);
  return [...new Set(categories)]; // Remove duplicates
};


/**
 * Get the next and previous films (for navigation)
 *
 * @param {string} currentSlug - The slug of the current film
 * @returns {Object} Object with prev and next film objects
 */
export const getAdjacentFilms = (currentSlug) => {
  const currentIndex = films.findIndex((film) => film.slug === currentSlug);

  return {
    prev: currentIndex > 0 ? films[currentIndex - 1] : null,
    next: currentIndex < films.length - 1 ? films[currentIndex + 1] : null,
  };
};


// Export the films array as default
export default films;
