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
    <footer
      className="
        w-full                           /* Full width */
        max-w-container                  /* Capped at container max width */
        mx-auto                          /* Center horizontally */
        px-6                             /* Horizontal padding */
        py-8                             /* Vertical padding */
        mt-auto                          /* Push to bottom if page content is short */
      "
    >
      {/* Inner container for footer content */}
      <div
        className="
          flex                           /* Flexbox layout */
          flex-col                       /* Stack vertically on mobile */
          md:flex-row                    /* Side by side on medium+ screens */
          items-center                   /* Center items */
          justify-between                /* Space between on larger screens */
          gap-4                          /* Gap between items */
          pt-8                           /* Top padding */
          border-t                       /* Top border */
          border-border                  /* Use our border color variable */
        "
      >
        {/* COPYRIGHT SECTION */}
        <p
          className="
            font-body                    /* American Typewriter font */
            text-sm                      /* Small text */
            text-muted                   /* Muted gray color */
          "
        >
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
                className="
                  font-body
                  text-sm
                  text-primary           /* Black text */
                  hover:text-muted       /* Gray on hover */
                  transition-colors      /* Smooth color transition */
                  duration-150
                "
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
