/**
 * ============================================================================
 * NAVIGATION COMPONENT
 * ============================================================================
 *
 * Absolute-positioned nav at the very top of every page. It scrolls away
 * with the page content (it is NOT position:fixed). Two link colors:
 *
 * - Hero pages (/, /photos): white text — overlays the hero image/video.
 * - All other pages: dark text — overlays the page header in flow.
 *
 * ============================================================================
 */

import { Link, useLocation } from 'react-router-dom';

import { siteConfig } from '../../data/siteConfig';


function Navigation() {
  const location = useLocation();
  const { center } = siteConfig.navigation;

  const isHeroPage = location.pathname === '/' || location.pathname === '/photos';
  const linkColor = isHeroPage ? 'text-white' : 'text-[var(--color-text)]';

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header
      className="absolute top-0 inset-x-0 z-30 h-20 flex items-center justify-center pointer-events-none"
    >
      <nav
        className="w-full max-w-container mx-auto px-4 md:px-6 flex items-center justify-center pointer-events-auto"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-center gap-12 md:gap-16">
          {center.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={[
                  'inline-block font-header font-medium tracking-[0.08em] group/nav-link',
                  active ? 'text-[18px]' : 'text-[16px]',
                  linkColor,
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <span className="px-2 py-0.5 box-decoration-clone transition-colors duration-150 group-hover/nav-link:bg-white group-hover/nav-link:text-black">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

export default Navigation;
