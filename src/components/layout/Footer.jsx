/**
 * ============================================================================
 * FOOTER COMPONENT
 * ============================================================================
 *
 * The site footer displayed at the bottom of every page.
 *
 * CONTENTS:
 * - Copyright notice
 * - Social media links
 * - Optional additional links
 *
 * STYLING:
 * - Minimal, clean design
 * - Consistent with overall site aesthetic
 * - Uses site config for content
 *
 * ============================================================================
 */

// Import site configuration for footer content
import { siteConfig, getActiveSocialLinks } from '../../data/siteConfig';


/**
 * Footer Component
 *
 * Renders the site footer with copyright and social links.
 *
 * @returns {JSX.Element} The footer element
 */
function Footer() {
  // Get current year for copyright notice
  // This automatically updates each year
  const currentYear = new Date().getFullYear();

  // Get all active social links (filters out null values)
  const socialLinks = getActiveSocialLinks();

  // Destructure footer config
  const { copyright, showSocial } = siteConfig.footer;


  return (
    // <footer> is the semantic HTML element for page footers
    <footer className="w-full max-w-container mx-auto px-6 py-8 mt-auto">
      {/* Inner container for footer content */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
        {/* COPYRIGHT SECTION */}
        <p className="font-body text-sm text-muted">
          {/* The © symbol followed by year and copyright text */}
          © {currentYear} {copyright}
        </p>


        {/* SOCIAL LINKS SECTION */}
        {/* Only render if showSocial is true and there are social links */}
        {showSocial && socialLinks.length > 0 && (
          <div className="flex items-center gap-6">
            {socialLinks.map((social) => (
              // External links use <a> tag with security attributes
              <a
                key={social.name}
                href={social.url}
                // target="_blank" opens in new tab
                target="_blank"
                // rel="noopener noreferrer" is a security measure
                // - noopener: prevents the new page from accessing window.opener
                // - noreferrer: prevents sending the referrer header
                rel="noopener noreferrer"
                className="font-body text-sm text-primary hover:text-muted transition-colors duration-150"
                // Accessibility: Describe where the link goes
                aria-label={`Visit ${siteConfig.artist.name}'s ${social.name} profile`}
              >
                {social.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}

// Export for use in Layout component
export default Footer;
