/**
 * ============================================================================
 * DIVIDER COMPONENT
 * ============================================================================
 *
 * A simple horizontal line used to separate sections of content.
 * Based on the divider in your design mockup.
 *
 * USAGE:
 * <Divider />                    // Default full-width divider
 * <Divider className="my-8" />   // With custom margin
 *
 * ============================================================================
 */

/**
 * Divider Component
 *
 * Renders a horizontal line to separate content sections.
 *
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes to apply
 * @returns {JSX.Element} A horizontal divider line
 */
function Divider({ className = '' }) {
  return (
    // Wrapper div with padding for consistent spacing
    <div
      className={`
        w-full                           /* Full width of container */
        max-w-container                  /* But capped at max container width */
        px-6                             /* Horizontal padding matches layout */
        py-1                             /* Minimal vertical padding */
        ${className}                     /* Any additional classes passed in */
      `}
      // Accessibility: role="separator" tells screen readers this is decorative
      role="separator"
      // aria-hidden="true" hides it from screen readers entirely
      // (since it's purely visual, not conveying information)
      aria-hidden="true"
    >
      {/* The actual line element */}
      <div
        className="
          w-full                         /* Full width within padding */
          h-px                           /* 1 pixel height */
          bg-border                      /* Use border color from CSS variables */
        "
      />
    </div>
  );
}

// Export for use in other components
export default Divider;
