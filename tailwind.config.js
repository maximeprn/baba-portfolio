/**
 * Tailwind CSS Configuration
 * ==========================
 * This file customizes Tailwind CSS for our specific design system.
 * All design tokens (colors, fonts, spacing) are defined here using CSS variables,
 * which makes them easy to change in one place and CMS-ready for the future.
 */

/** @type {import('tailwindcss').Config} */
export default {
  // Content Configuration
  // ---------------------
  // Tells Tailwind which files to scan for class names
  // Only classes found in these files will be included in the final CSS
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // Theme Configuration
  // -------------------
  // Extends Tailwind's default theme with our custom design tokens
  theme: {
    extend: {
      // Custom Font Families
      // --------------------
      // These map to CSS variables defined in index.css
      // Usage: className="font-header" or className="font-body"
      fontFamily: {
        // Headers and navigation - Steps-Mono
        'header': 'var(--font-header)',
        // Project titles - Helvetica Now
        'title': 'var(--font-title)',
        // Body text - American Typewriter
        'body': 'var(--font-body)',
      },

      // Custom Colors
      // -------------
      // All colors use CSS variables for easy CMS integration
      // Usage: className="bg-background" or className="text-primary"
      colors: {
        // Main background color (white)
        'background': 'var(--color-background)',
        // Primary text color (black)
        'primary': 'var(--color-text)',
        // Muted/secondary text color (gray)
        'muted': 'var(--color-text-muted)',
        // Accent color for hover states and highlights
        'accent': 'var(--color-accent)',
        // Border/divider color
        'border': 'var(--color-border)',
      },

      // Custom Font Sizes
      // -----------------
      // Extends the default Tailwind font sizes with our design system
      // Usage: className="text-hero" for the big BASILE DESCHAMPS text
      fontSize: {
        // Hero text (140px) - for the main name display
        'hero': ['var(--text-hero)', { lineHeight: '1' }],
        // Subheading size
        'subheading': ['var(--text-subheading)', { lineHeight: '1.2' }],
      },

      // Custom Spacing
      // --------------
      // Extends Tailwind's spacing scale with our custom values
      // Usage: className="p-section" or className="gap-content"
      spacing: {
        // Extra large section padding
        'section': 'var(--spacing-section)',
        // Content gap
        'content': 'var(--spacing-content)',
      },

      // Custom Max Widths
      // -----------------
      // For consistent content containers
      maxWidth: {
        // Main content container (matches your 1440px design)
        'container': 'var(--max-width-container)',
        // Narrower content width
        'content': 'var(--max-width-content)',
      },

      // Custom Letter Spacing
      // ---------------------
      // For the typography style in your design
      letterSpacing: {
        // Wide tracking for titles
        'wide': '0.15em',
        // Extra wide for small caps
        'wider': '0.2em',
      },

      // Animation Keyframes
      // -------------------
      // Custom animations for the site
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Floating animation for hero video
        // Creates gentle up-and-down movement
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
      },

      // Animation Utilities
      // -------------------
      // Usage: className="animate-fade-in"
      animation: {
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        // Floating animation - 6s duration for gentle motion
        'float': 'float 6s ease-in-out infinite',
      },
    },
  },

  // Plugins
  // -------
  // Tailwind plugins extend functionality
  // We'll add plugins here if needed (like forms, typography, etc.)
  plugins: [],
};
