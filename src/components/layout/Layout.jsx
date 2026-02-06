/**
 * ============================================================================
 * LAYOUT COMPONENT
 * ============================================================================
 *
 * The Layout component wraps every page in the application.
 * It provides a consistent structure across all pages:
 *
 * ┌─────────────────────────────────────────┐
 * │           NAVIGATION                     │
 * ├─────────────────────────────────────────┤
 * │                                          │
 * │                                          │
 * │           PAGE CONTENT                   │
 * │         (children prop)                  │
 * │                                          │
 * │                                          │
 * ├─────────────────────────────────────────┤
 * │             FOOTER                       │
 * └─────────────────────────────────────────┘
 *
 * FEATURES:
 * - Consistent navigation on every page
 * - Consistent footer on every page
 * - Proper flexbox layout ensures footer stays at bottom
 * - Semantic HTML structure
 *
 * ============================================================================
 */

import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Import the Navigation and Footer components
import Navigation from './Navigation';
import Footer from './Footer';
import PersistentHeroText from '../ui/PersistentHeroText';
import { SmoothScrollProvider, useSmoothScrollContext } from '../../context/SmoothScrollContext';


/**
 * ScrollToTop Component
 * Scrolls to top when navigating to non-homepage routes
 * Must be inside SmoothScrollProvider to access scroll context
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  const { scrollTo } = useSmoothScrollContext();

  useLayoutEffect(() => {
    // Only scroll to top for detail pages, not the main Films page
    // This preserves scroll position when going back to Films
    if (pathname !== '/') {
      scrollTo(0, true);
    }
  }, [pathname, scrollTo]);

  return null;
}


/**
 * Layout Component
 *
 * Wraps page content with navigation and footer.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The page content to render
 * @returns {JSX.Element} The complete page layout
 *
 * USAGE:
 * In App.jsx, all routes are wrapped in Layout:
 *
 * <Layout>
 *   <Routes>
 *     <Route path="/" element={<Films />} />
 *     ...
 *   </Routes>
 * </Layout>
 *
 * The page component (Films, About, etc.) becomes the "children" prop
 */
function Layout({ children }) {
  const { pathname } = useLocation();
  const showHeroText = pathname === '/' || pathname === '/photos';

  return (
    // SmoothScrollProvider wraps everything for buttery smooth scrolling
    <SmoothScrollProvider smoothness={0.08}>
      {/* ScrollToTop handles navigation scroll behavior */}
      <ScrollToTop />

      {/* Outer container - full viewport height with flex column layout
          This ensures the footer stays at the bottom even with little content */}
      <div
        className="
          relative                         /* Positioning context for PersistentHeroText */
          min-h-screen                     /* At least full viewport height */
          flex                             /* Flexbox container */
          flex-col                         /* Stack children vertically */
          bg-background                    /* Background color from CSS variable */
        "
      >
        {/* NAVIGATION - Always at the top */}
        <Navigation />

        {/* PERSISTENT HERO TEXT - Stays put during Films↔Photos navigation */}
        {showHeroText && <PersistentHeroText />}


        {/* MAIN CONTENT AREA
            The <main> element is the semantic HTML5 element for the main content
            It helps screen readers identify the primary content area

            flex-1 (or flex-grow) makes this section expand to fill available space
            This pushes the footer to the bottom when content is short
        */}
        <main
          className="
            flex-1                         /* Grow to fill available space */
            flex                           /* Flexbox for centering content */
            flex-col                       /* Stack children vertically */
            items-center                   /* Center children horizontally */
            w-full                         /* Full width */
          "
        >
          {/*
            children is whatever gets passed between the <Layout> tags
            In our case, it's the page component from React Router

            Example: When visiting /about
            - React Router matches the /about route
            - Renders <About /> as children
            - Layout wraps it with nav and footer
          */}
          {children}
        </main>


        {/* FOOTER - Always at the bottom */}
        <Footer />
      </div>
    </SmoothScrollProvider>
  );
}

// Export for use in App.jsx
export default Layout;
