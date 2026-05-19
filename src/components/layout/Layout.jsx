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
  // Hero pages get full-bleed content (no top/side padding) so the hero can
  // sit edge-to-edge under the fixed nav. Other pages keep the standard
  // padding and add pt-20 to clear the now-fixed nav.
  const { pathname } = useLocation();
  const isHeroPage = pathname === '/' || pathname === '/photos';

  return (
    // SmoothScrollProvider wraps everything for buttery smooth scrolling
    <SmoothScrollProvider smoothness={0.08}>
      {/* ScrollToTop handles navigation scroll behavior */}
      <ScrollToTop />

      {/* Outer container - full viewport height with flex column layout
          This ensures the footer stays at the bottom even with little content */}
      {/* overflow-x-clip (not -hidden) so it doesn't become a scroll container —
          otherwise it would override the viewport as the sticky-positioning
          ancestor for the hero pin and cause iOS jitter on native scroll. */}
      <div className="relative min-h-screen flex flex-col bg-background overflow-x-clip">
        {/* NAVIGATION — fixed-positioned and rendered via portal to document.body.
            Lives outside the smooth-scroll transformed wrapper so it stays stuck. */}
        <Navigation />

        {/* MAIN CONTENT AREA — full-bleed on hero pages, padded otherwise */}
        <main
          className={`flex-1 flex flex-col items-center w-full ${isHeroPage ? '' : 'pt-20 md:px-[100px]'}`}
        >
          {children}
        </main>


        {/* FOOTER — standard side padding on every page */}
        <div className="md:px-[100px]">
          <Footer />
        </div>
      </div>
    </SmoothScrollProvider>
  );
}

// Export for use in App.jsx
export default Layout;
