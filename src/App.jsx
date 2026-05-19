/**
 * App — top-level router.
 *
 * Two route trees:
 *   - /admin/*  → Sanity Studio (lazy-loaded, no site Layout)
 *   - /*        → Public site, wrapped in Layout (Navigation + Footer)
 *
 * The Studio is split out so its ~3MB bundle doesn't load on the public site.
 */

import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import Layout from './components/layout/Layout';
import Films from './pages/Films';
import Photos from './pages/Photos';

// Sanity Studio is heavy — code-split via React.lazy so the public bundle
// doesn't pay the cost.
const StudioPage = lazy(() => import('./pages/Studio'));


function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
      <h1 className="font-header text-6xl">404</h1>
      <p className="font-body text-muted text-lg">Page not found</p>
      <a href="/" className="font-header text-sm uppercase tracking-wider hover:opacity-70 transition-opacity">
        Back to home
      </a>
    </div>
  );
}


function PublicSite() {
  return (
    <Layout>
      <Routes>
        <Route index element={<Films />} />
        <Route path="photos" element={<Photos />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}


function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={null}>
            <StudioPage />
          </Suspense>
        }
      />
      <Route path="/*" element={<PublicSite />} />
    </Routes>
  );
}

export default App;
