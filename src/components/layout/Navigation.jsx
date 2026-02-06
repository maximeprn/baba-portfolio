/**
 * ============================================================================
 * NAVIGATION COMPONENT
 * ============================================================================
 *
 * The main navigation bar displayed at the top of every page.
 *
 * LAYOUT:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  ABOUT                    PHOTOS    FILMS                  GET IN TOUCH │
 * └────────────────────────────────────────────────────────────────────────┘
 *    (left)                   (center - main links)               (right)
 *
 * FEATURES:
 * - Responsive design (collapses on mobile)
 * - Active state highlighting for current page
 * - Smooth hover effects
 * - Uses site config for navigation items
 *
 * ============================================================================
 */

// Link component for client-side navigation (no page reload)
// useLocation hook to know which page we're currently on
import { Link, useLocation } from 'react-router-dom';

// Import navigation configuration from site config
import { siteConfig } from '../../data/siteConfig';


/**
 * Navigation Component
 *
 * Renders the main site navigation with three sections:
 * - Left: Secondary links (About)
 * - Center: Main section links (Photos, Films)
 * - Right: Call-to-action (Get in Touch)
 *
 * @returns {JSX.Element} The navigation bar
 */
function Navigation() {
  // useLocation gives us information about the current URL
  // We use it to highlight the active navigation item
  const location = useLocation();

  // Destructure navigation config for cleaner code
  const { left, center, right } = siteConfig.navigation;


  /**
   * Check if a navigation item is currently active
   *
   * @param {string} path - The path of the nav item
   * @returns {boolean} True if this is the current page
   */
  const isActive = (path) => {
    // Exact match for homepage
    if (path === '/') {
      return location.pathname === '/';
    }
    // For other pages, check if the current path starts with the nav path
    // This keeps "Films" highlighted even on /films/project-name
    return location.pathname.startsWith(path);
  };


  return (
    // <header> is the semantic HTML element for page headers/navigation
    // We use Tailwind classes for styling
    <header
      className="
        relative                         /* For absolute positioning of mobile nav */
        z-30                             /* Above hero text (z-0) and media (z-10) */
        w-[90vw] md:w-full               /* 90vw on mobile to match video width */
        max-w-container                  /* But capped at our max container width */
        mx-auto                          /* Center horizontally */
        h-20                             /* Fixed height (80px) */
        px-0 md:px-6                     /* No padding on mobile, 24px on desktop */
        flex                             /* Flexbox for layout */
        items-center                     /* Vertically center children */
        justify-center                   /* Center the nav element */
      "
    >
      {/* <nav> is the semantic element for navigation links */}
      <nav
        className="
          w-full                         /* Full width of header */
          flex                           /* Flexbox layout */
          items-center                   /* Vertically center items */
          justify-between                /* Space items across the width */
          px-0 md:px-5                   /* No padding on mobile, 20px on desktop */
        "
        // Accessibility: Identifies this as the main navigation
        role="navigation"
        aria-label="Main navigation"
      >
        {/* LEFT SECTION - Secondary links like "About" */}
        <div className="flex items-center">
          {left.map((item) => (
            // Link is React Router's component for navigation
            // It renders an <a> tag but handles clicks to prevent page reload
            <Link
              key={item.path}
              to={item.path}
              className={`
                nav-link                 /* Our custom nav link style from CSS */
                transition-opacity       /* Smooth opacity transition */
                duration-150             /* 150ms transition duration */
                ${isActive(item.path)
                  ? 'opacity-100'        /* Full opacity if active */
                  : 'opacity-100 hover:opacity-70'  /* Fade on hover if not active */
                }
              `}
              // Accessibility: Indicate current page to screen readers
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>


        {/* CENTER SECTION - Main navigation (Photos, Films) - Desktop only */}
        <div className="hidden md:flex items-center justify-center gap-4">
          {center.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                font-header              /* Helvetica Now Display font */
                font-normal              /* 400 weight */
                uppercase                /* Uppercase text */
                transition-all           /* Smooth transitions for all properties */
                duration-150             /* 150ms transition */
                ${isActive(item.path)
                  ? 'text-[1rem] opacity-100'        /* Active: 20px (1.25rem) */
                  : 'text-[0.75rem] opacity-100 hover:opacity-70'  /* Inactive: 14px (0.875rem) */
                }
              `}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>


        {/* RIGHT SECTION - Call to action like "Get in Touch" */}
        <div className="flex items-center">
          {right.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                nav-link
                transition-opacity
                duration-150
                ${isActive(item.path)
                  ? 'opacity-100'
                  : 'opacity-100 hover:opacity-70'
                }
              `}
              aria-current={isActive(item.path) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

// Export for use in Layout component
export default Navigation;
