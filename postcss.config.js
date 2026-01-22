/**
 * PostCSS Configuration File
 * ==========================
 * PostCSS is a tool that transforms CSS with JavaScript plugins.
 * It's like a "CSS processor" that runs after your CSS is written.
 *
 * We use it here to:
 * 1. Process Tailwind CSS directives (@tailwind, @apply, etc.)
 * 2. Add vendor prefixes automatically (autoprefixer)
 */

export default {
  // Plugins are processed in order from top to bottom
  plugins: {
    // Tailwind CSS Plugin
    // -------------------
    // This processes all Tailwind directives in your CSS:
    // - @tailwind base;      → Injects Tailwind's base/reset styles
    // - @tailwind components; → Injects component classes
    // - @tailwind utilities;  → Injects utility classes (flex, p-4, etc.)
    // - @apply               → Lets you use Tailwind classes in custom CSS
    tailwindcss: {},

    // Autoprefixer Plugin
    // -------------------
    // Automatically adds vendor prefixes for browser compatibility.
    // Example: 'display: flex' becomes:
    //   display: -webkit-box;
    //   display: -ms-flexbox;
    //   display: flex;
    // This ensures your CSS works in older browsers too.
    autoprefixer: {},
  },
};
