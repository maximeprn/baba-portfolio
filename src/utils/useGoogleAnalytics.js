/**
 * Google Analytics 4 — init once, then send a page_view on every SPA route
 * change.
 *
 * - Reads VITE_GA_MEASUREMENT_ID at build time. Missing value = no-op
 *   (dev, previews without the env var, or if Basile ever wants to disable
 *   tracking — just unset the var and redeploy).
 * - Studio routes (/admin/*) are excluded: those are Basile editing his own
 *   content, not real audience traffic.
 * - GA's auto page_view is disabled (`send_page_view: false`) because in an
 *   SPA we want one page_view per react-router navigation, not just the
 *   initial document load.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

function initGa() {
  if (initialized || !GA_ID) return;
  initialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
}

export function useGoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!GA_ID) return;
    if (location.pathname.startsWith('/admin')) return;

    initGa();

    // Defer one tick so react-helmet-async has flushed the per-route <title>
    // before we sample document.title for the page_view event.
    const id = setTimeout(() => {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }, 0);

    return () => clearTimeout(id);
  }, [location.pathname, location.search]);
}
