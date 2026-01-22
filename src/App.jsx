/**
 * ============================================================================
 * APP COMPONENT - Main Application Router
 * ============================================================================
 *
 * This is the root component of the application.
 * It defines all the routes (URLs) and which page components to show for each.
 *
 * WHAT THIS FILE DOES:
 * - Wraps everything in a Layout component (navigation + footer)
 * - Defines URL routes and their corresponding page components
 * - Uses React Router for client-side navigation
 *
 * ROUTES:
 * /              → Films page (homepage)
 * /films/:slug   → Individual film detail page
 * /photos        → Photo projects listing
 * /photos/:slug  → Individual photo project gallery
 * /about         → About page
 * /contact       → Contact page
 *
 * ============================================================================
 */

// Import routing components from React Router
// Routes: Container for all Route definitions
// Route: Defines a single URL path and its component
import { Routes, Route } from 'react-router-dom';

// Import the Layout component that wraps all pages
// This provides consistent navigation and footer across the site
import Layout from './components/layout/Layout';

// Import all page components
// Each page is a separate component in the /pages folder
import Films from './pages/Films';
import FilmDetail from './pages/FilmDetail';
import Photos from './pages/Photos';
import PhotoProject from './pages/PhotoProject';
import About from './pages/About';
import Contact from './pages/Contact';


/**
 * App Component
 *
 * The main application component that sets up routing.
 * This component is rendered by main.jsx inside BrowserRouter.
 *
 * @returns {JSX.Element} The complete application with routing
 */
function App() {
  return (
    // Layout wraps all pages - provides Navigation and Footer
    // Every page will have the same header and footer
    <Layout>
      {/*
        Routes component - container for all route definitions
        Only ONE route will match and render at a time
      */}
      <Routes>
        {/*
          Each Route defines:
          - path: The URL pattern to match
          - element: The React component to render when path matches

          The order doesn't matter for exact paths, but more specific
          paths should come before catch-all paths
        */}

        {/* Homepage - Films listing
            path="/" matches the root URL (e.g., www.basiledeschamps.com/)
            This is the landing page showing all film projects */}
        <Route path="/" element={<Films />} />

        {/* Film Detail Page
            path="/films/:slug" - the :slug is a URL parameter
            It captures whatever comes after /films/ in the URL

            Examples:
            /films/decathlon-cocreation → slug = "decathlon-cocreation"
            /films/my-project → slug = "my-project"

            The FilmDetail component can access this via useParams() hook */}
        <Route path="/films/:slug" element={<FilmDetail />} />

        {/* Photos listing page
            Shows all photo projects as a grid of cards */}
        <Route path="/photos" element={<Photos />} />

        {/* Photo Project Gallery
            Similar to film detail, :slug captures the project name
            Shows the full gallery for a specific photo project */}
        <Route path="/photos/:slug" element={<PhotoProject />} />

        {/* About page
            Static page with artist biography and information */}
        <Route path="/about" element={<About />} />

        {/* Contact page
            Contains contact form and contact information */}
        <Route path="/contact" element={<Contact />} />

        {/*
          TODO: Add a 404 page for unknown routes
          <Route path="*" element={<NotFound />} />

          The "*" wildcard matches any URL that hasn't matched above
          This would show a "Page Not Found" message
        */}
      </Routes>
    </Layout>
  );
}

// Export the App component as the default export
// This is imported in main.jsx
export default App;
