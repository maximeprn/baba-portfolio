/**
 * ============================================================================
 * SITE CONFIGURATION
 * ============================================================================
 *
 * This file contains all site-wide settings and content.
 * In the future, this data can come from a CMS instead.
 *
 * WHAT'S HERE:
 * - Artist information (name, bio, tagline)
 * - Contact information
 * - Social media links
 * - Navigation items
 * - SEO metadata
 *
 * TO UPDATE CONTENT:
 * Simply change the values in this file. The entire site will update.
 *
 * ============================================================================
 */

export const siteConfig = {
  // -------------------------------------------------------------------------
  // ARTIST INFORMATION
  // -------------------------------------------------------------------------
  // Basic info about the artist displayed across the site

  artist: {
    // Full name - displayed in hero section and footer
    name: 'Basile Deschamps',

    // First name only - used where space is limited
    firstName: 'Basile',

    // Last name only - used where space is limited
    lastName: 'Deschamps',

    // Tagline - displayed above the name in hero section
    tagline: 'Reinventing the Frame',

    // Short bio - displayed on About page and footer
    shortBio: 'Sports photographer and filmmaker exploring the poetry of athletic movement',

    // Profession/title
    title: 'Sports Photographer & Filmmaker',
  },


  // -------------------------------------------------------------------------
  // CONTACT INFORMATION
  // -------------------------------------------------------------------------
  // How people can reach out

  contact: {
    // Email address for contact form and display
    email: 'hello@basiledeschamps.com',

    // Phone number (optional - set to null if not wanted)
    phone: null,

    // Physical location (city, country)
    location: 'Paris, France',
  },


  // -------------------------------------------------------------------------
  // SOCIAL MEDIA LINKS
  // -------------------------------------------------------------------------
  // Social platforms - set to null to hide a platform

  social: {
    // Instagram profile URL
    instagram: 'https://instagram.com/basiledeschamps',

    // Vimeo profile for film work
    vimeo: 'https://vimeo.com/basiledeschamps',

    // LinkedIn (optional)
    linkedin: null,

    // Twitter/X (optional)
    twitter: null,

    // Behance (optional)
    behance: null,
  },


  // -------------------------------------------------------------------------
  // NAVIGATION
  // -------------------------------------------------------------------------
  // Main navigation menu items

  navigation: {
    // Items displayed on the left side of the nav
    left: [
      {
        label: 'ABOUT',
        path: '/about',
      },
    ],

    // Items displayed in the center of the nav (main sections)
    center: [
      {
        label: 'PHOTOS',
        path: '/photos',
      },
      {
        label: 'FILMS',
        path: '/',
      },
    ],

    // Items displayed on the right side of the nav
    right: [
      {
        label: 'GET IN TOUCH',
        path: '/contact',
      },
    ],
  },


  // -------------------------------------------------------------------------
  // SEO & METADATA
  // -------------------------------------------------------------------------
  // Information for search engines and social sharing

  seo: {
    // Default page title (shown in browser tab)
    title: 'Basile Deschamps | Film & Photography',

    // Meta description (shown in search results)
    description: 'Portfolio of Basile Deschamps - Visual artist specializing in film direction and photography. Reinventing the frame.',

    // Keywords for search engines
    keywords: ['film director', 'photographer', 'visual artist', 'Paris', 'commercial', 'documentary'],

    // Open Graph image for social sharing (URL to an image)
    ogImage: '/images/og-image.jpg',

    // Site URL (update when deployed)
    siteUrl: 'https://basiledeschamps.com',
  },


  // -------------------------------------------------------------------------
  // CONTACT FORM
  // -------------------------------------------------------------------------
  // Settings for the contact form

  contactForm: {
    // Formspree endpoint (create account at formspree.io)
    // Replace with your actual Formspree form ID
    formspreeId: 'YOUR_FORMSPREE_ID',

    // Form fields placeholder text
    placeholders: {
      name: 'Your name',
      email: 'Your email',
      subject: 'Subject',
      message: 'Your message...',
    },

    // Success message after form submission
    successMessage: 'Thank you for your message. I will get back to you soon!',

    // Error message if submission fails
    errorMessage: 'Something went wrong. Please try again or email directly.',
  },


  // -------------------------------------------------------------------------
  // FOOTER
  // -------------------------------------------------------------------------
  // Footer content

  footer: {
    // Copyright text (year is added automatically)
    copyright: 'Basile Deschamps. All rights reserved.',

    // Show social links in footer
    showSocial: true,

    // Additional footer links (optional)
    links: [
      // { label: 'Privacy Policy', path: '/privacy' },
      // { label: 'Terms', path: '/terms' },
    ],
  },
};


// -------------------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------------------
// These functions make it easier to use the config throughout the app

/**
 * Get all social media links that are not null
 * @returns {Array} Array of social media objects with name and url
 */
export const getActiveSocialLinks = () => {
  const { social } = siteConfig;

  // Filter out null values and format for display
  return Object.entries(social)
    .filter(([_, url]) => url !== null)
    .map(([name, url]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
      url,
    }));
};


/**
 * Get all navigation items flattened into a single array
 * @returns {Array} All navigation items
 */
export const getAllNavItems = () => {
  const { navigation } = siteConfig;
  return [
    ...navigation.left,
    ...navigation.center,
    ...navigation.right,
  ];
};


// Export as default for convenience
export default siteConfig;
