/**
 * FILMS DATA
 *
 * All film/video projects displayed on the homepage.
 * Every film is currently set to featured (video preview cards).
 *
 * Video files live in /public/videos/
 * Poster images live in /public/posters/ (some films still need posters)
 */

export const films = [
  {
    id: 1,
    slug: 'veja-condor-3',
    title: 'Veja Condor 3',
    description: 'A sport film built around the launch of the Condor 3. From marathon tarmac to mountain trail, directed, edited, and scored by Basile Deschamps.',
    thumbnail: '/posters/veja.jpg',
    videoFile: '/videos/Veja Condor 3.mp4',
    videoUrl: 'https://player.vimeo.com/video/1062003612',
    videoType: 'vimeo',
    year: 2025,
    client: 'Veja',
    category: 'Commercial',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
        { role: 'Edit', name: 'Basile Deschamps' },
      ],
      right: [
        { role: 'Music', name: 'Basile Deschamps' },
      ],
    },
    imagePosition: 'left',
    featured: true,
    aspectRatio: 1.78,
  },

  {
    id: 2,
    slug: 'sacai-ss25',
    title: 'Sacai SS25',
    description: "A backstage film shot during Sacai's Spring/Summer 2025 show in Paris. Directed, edited, and scored by Basile Deschamps, capturing the atmosphere around the collection before and after the runway.",
    thumbnail: null,
    videoFile: '/videos/Sacai SS25.mp4',
    videoUrl: 'https://player.vimeo.com/video/1047455821',
    videoType: 'vimeo',
    year: 2025,
    client: 'Sacai',
    category: 'Fashion / Behind the Scenes',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
        { role: 'Edit', name: 'Basile Deschamps' },
      ],
      right: [
        { role: 'Music', name: 'Basile Deschamps' },
      ],
    },
    imagePosition: 'right',
    featured: true,
    aspectRatio: 1.78,
  },

  {
    id: 3,
    slug: 'decathlon-cocreation',
    title: 'Decathlon "Co-Creation" Olympic Games Campaign',
    description: 'A campaign made for the Paris 2024 Olympic Games, built around the idea of co-creation between athletes, designers, and communities.',
    thumbnail: '/posters/decathlon.jpg',
    videoFile: '/videos/Decathlon Co-Creation Olympic Games Campaign.mp4',
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
    imagePosition: 'left',
    featured: true,
    aspectRatio: 1.25,
  },

  {
    id: 4,
    slug: 'quentin-malriq',
    title: 'Quentin Malriq, An Athlete Portrait by DISTANCE',
    description: 'A film following middle-distance runner Quentin Malriq as he fights for Olympic selection. Made for ASICS, the portrait stays close to the daily grind. The margins are tiny and the stakes are everything.',
    thumbnail: '/posters/quentin-malriq.jpg',
    videoFile: '/videos/Quentin Malriq - An athlete portrait by DISTANCE.mp4',
    videoUrl: 'https://player.vimeo.com/video/895840721',
    videoType: 'vimeo',
    year: 2023,
    client: 'ASICS',
    category: 'Documentary / Sport',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
      ],
      right: [
        { role: 'Production', name: 'DISTANCE' },
      ],
    },
    imagePosition: 'right',
    featured: true,
    aspectRatio: 1.78,
  },

  {
    id: 5,
    slug: 'le-cnd-camping-2023',
    title: 'Le CN D, Camping 2023',
    description: 'A doc shot during Camping, a two-week international gathering of hundreds of dancers at the CN D in Pantin. Classes, workshops, krump to contemporary. The film captures what it feels like when that many bodies share one building.',
    thumbnail: null,
    videoFile: '/videos/Le CN D - camping 2023.mp4',
    videoUrl: 'https://player.vimeo.com/video/868701940',
    videoType: 'vimeo',
    year: 2023,
    client: 'Centre National de la Danse',
    category: 'Documentary',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
      ],
      right: [],
    },
    imagePosition: 'left',
    featured: true,
    aspectRatio: 1.78,
  },

  {
    id: 6,
    slug: 'diversions-ep-teaser',
    title: 'DIVERSIONS EP by Antoine Bourachot, Teaser',
    description: "A Super 8 teaser for composer Antoine Bourachot's EP. Synthesisers, vintage gear, the quiet of a recording studio. Analog and warm.",
    thumbnail: null,
    videoFile: '/videos/DIVERSIONS EP by Antoine Bourachot - Teaser.mp4',
    videoUrl: 'https://player.vimeo.com/video/863910150',
    videoType: 'vimeo',
    year: 2023,
    client: 'Antoine Bourachot',
    category: 'Music / Short Film',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
      ],
      right: [
        { role: 'Artist', name: 'Antoine Bourachot' },
      ],
    },
    imagePosition: 'right',
    featured: true,
    aspectRatio: 1.78,
  },

  {
    id: 7,
    slug: 'badre-documentary',
    title: 'Badre, A Short Documentary by DISTANCE',
    description: "A portrait of marathon runner Badre Zioini returning to competition after five years away. Part of On Running's Point2 series.",
    thumbnail: '/posters/badre.jpg',
    videoFile: '/videos/Badre - a short documentary by DISTANCE.mp4',
    videoUrl: 'https://player.vimeo.com/video/768152390',
    videoType: 'vimeo',
    year: 2022,
    client: 'On Running',
    category: 'Documentary / Sport',
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
    aspectRatio: 1.33,
  },

  {
    id: 8,
    slug: 'assos-feno-suit',
    title: "ASSOS Feno Suit, Director's Cut",
    description: 'The director\'s cut for the ASSOS Feno Suit launch. Goes deeper than the commercial version into the rider, the craft, and what Swiss cycling culture actually looks like up close.',
    thumbnail: null,
    videoFile: "/videos/ASSOS Feno Suit - Director's Cut.mp4",
    videoUrl: 'https://player.vimeo.com/video/647313570',
    videoType: 'vimeo',
    year: 2021,
    client: 'ASSOS of Switzerland',
    category: 'Branded Documentary',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
      ],
      right: [],
    },
    imagePosition: 'right',
    featured: true,
    collapsed: true,
    aspectRatio: 1.78,
  },

  {
    id: 9,
    slug: 'showreel-2021',
    title: 'Showreel 2021',
    description: 'A reel compiled from footage shot in early 2021. Sports, fashumentary.',
    thumbnail: null,
    videoFile: '/videos/Showreel 2021.mp4',
    videoUrl: 'https://player.vimeo.com/video/562172132',
    videoType: 'vimeo',
    year: 2021,
    client: 'Personal',
    category: 'Showreel',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
      ],
      right: [],
    },
    imagePosition: 'left',
    featured: true,
    collapsed: true,
    aspectRatio: 1.78,
  },

  {
    id: 10,
    slug: 'salomon-trail-running',
    title: 'Salomon Trail Running (Spec Ad)',
    description: 'A self-initiated trail running film for Salomon. Directed and scored by Basile Deschamps, featuring Nathan Hirsch, Johnathan Bamberger, Matt Rosengarten, and Victor Sion.',
    thumbnail: '/posters/salomon.jpg',
    videoFile: '/videos/Salomon Trail Running (Spec ad).mp4',
    videoUrl: 'https://player.vimeo.com/video/551544527',
    videoType: 'vimeo',
    year: 2021,
    client: 'Salomon',
    category: 'Spec Commercial',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
        { role: 'Music', name: 'Basile Deschamps' },
      ],
      right: [
        { role: 'Featuring', name: 'Nathan Hirsch, Johnathan Bamberger, Matt Rosengarten, Victor Sion' },
      ],
    },
    imagePosition: 'right',
    featured: true,
    collapsed: true,
    aspectRatio: 1.78,
  },

  {
    id: 11,
    slug: 'bastille-maison-mara',
    title: 'Bastille, Maison Mara',
    description: 'A fashion film for Maison Mara, directed and shot by Basile Deschamps. Styling by Natasha Els, with Loren Humpfreys and Olivier Ntumba. Paris, quiet confidence, nothing overdone.',
    thumbnail: null,
    videoFile: '/videos/Bastille - Maison Mara.mp4',
    videoUrl: 'https://player.vimeo.com/video/541582370',
    videoType: 'vimeo',
    year: 2021,
    client: 'Maison Mara',
    category: 'Fashion Film',
    credits: {
      left: [
        { role: 'Direction / DOP', name: 'Basile Deschamps' },
        { role: 'Styling', name: 'Natasha Els' },
      ],
      right: [
        { role: 'Cast', name: 'Loren Humpfreys, Olivier Ntumba' },
      ],
    },
    imagePosition: 'left',
    featured: true,
    collapsed: true,
    aspectRatio: 1.78,
  },

  {
    id: 12,
    slug: 'kamikwazi-locked-down',
    title: 'Kamikwazi, Locked Down',
    description: 'A music video made during lockdown. Written and performed by Julius Adorsu (Kamikwazi), directed and produced by Basile Deschamps. Small space, real energy.',
    thumbnail: null,
    videoFile: '/videos/Kamikwazi - Locked Down.mp4',
    videoUrl: 'https://player.vimeo.com/video/513405009',
    videoType: 'vimeo',
    year: 2021,
    client: 'Kamikwazi',
    category: 'Music Video',
    credits: {
      left: [
        { role: 'Direction / Production', name: 'Basile Deschamps' },
      ],
      right: [
        { role: 'Artist', name: 'Julius Adorsu (Kamikwazi)' },
      ],
    },
    imagePosition: 'right',
    featured: true,
    collapsed: true,
    aspectRatio: 1.78,
  },

  {
    id: 13,
    slug: 'hommage-back-to-1992-2',
    title: 'Hommage Clothing, Back to 1992 (Video No. 2)',
    description: 'Second film in the Back to 1992 campaign. Directed by Basile Deschamps, shot by Yann Macherez, edited by Tristan Deschamps. Nineties streetwear through a modern lens.',
    thumbnail: null,
    videoFile: '/videos/Hommage Clothing - Back to 1992.mp4',
    videoUrl: 'https://player.vimeo.com/video/271458415',
    videoType: 'vimeo',
    year: 2018,
    client: 'Hommage Clothing',
    category: 'Fashion Film',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
        { role: 'DOP', name: 'Yann Macherez' },
      ],
      right: [
        { role: 'Edit', name: 'Tristan Deschamps' },
      ],
    },
    imagePosition: 'left',
    featured: true,
    collapsed: true,
    aspectRatio: 1.78,
  },

  {
    id: 14,
    slug: 'hommage-back-to-1992-1',
    title: 'Hommage Clothing, Back to 1992 (Video No. 1)',
    description: 'First film in the Back to 1992 series for Hommage Clothing. Directed by Basile Deschamps. Early work, archive-inspired.',
    thumbnail: null,
    videoFile: '/videos/Hommage Clothing - Back to 1992 1.mp4',
    videoUrl: 'https://player.vimeo.com/video/269335097',
    videoType: 'vimeo',
    year: 2018,
    client: 'Hommage Clothing',
    category: 'Fashion Film',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
      ],
      right: [],
    },
    imagePosition: 'right',
    featured: true,
    collapsed: true,
    aspectRatio: 1.78,
  },

  {
    id: 15,
    slug: 'hommage-late-16-collection',
    title: "Hommage, Late '16 Collection",
    description: "Basile Deschamps' first fashion film. Made for Hommage Clothing's late 2016 collection with Tristan J. Deschamps and Cl\u00e9ment Pinaut.",
    thumbnail: null,
    videoFile: "/videos/Hommage - Late 16' Collection.mp4",
    videoUrl: 'https://player.vimeo.com/video/187173133',
    videoType: 'vimeo',
    year: 2016,
    client: 'Hommage Clothing',
    category: 'Fashion Film',
    credits: {
      left: [
        { role: 'Direction', name: 'Basile Deschamps' },
      ],
      right: [
        { role: 'With', name: 'Tristan J. Deschamps, Cl\u00e9ment Pinaut' },
      ],
    },
    imagePosition: 'left',
    featured: true,
    collapsed: true,
    aspectRatio: 1.78,
  },
];


// HELPER FUNCTIONS

export const getFeaturedFilms = () => {
  return films.filter((film) => film.featured);
};

export const getFilmsByCategory = (category) => {
  return films.filter((film) => film.category === category);
};

export const getAllCategories = () => {
  const categories = films.map((film) => film.category);
  return [...new Set(categories)];
};

export default films;
