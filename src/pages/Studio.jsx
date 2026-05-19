/**
 * Sanity Studio mount point.
 *
 * Renders the embedded editor at /admin. Sanity handles auth (Google OAuth)
 * and the entire UI; we just provide the config object and let it own the
 * mounted DOM.
 *
 * NOTE: the Studio is a heavy bundle (~3MB gzipped) — code-split this in
 * App.jsx via React.lazy() so it doesn't bloat the public site.
 */

import { Studio } from 'sanity';
import config from '../../sanity.config';

export default function StudioPage() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff' }}>
      <Studio config={config} />
    </div>
  );
}
