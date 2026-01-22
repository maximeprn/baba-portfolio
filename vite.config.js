/**
 * Vite Configuration File
 * =======================
 * Vite is our build tool - it bundles and serves our React application.
 * This file tells Vite how to process our code.
 */

// Import the 'defineConfig' helper from Vite for better TypeScript support
import { defineConfig } from 'vite';

// Import the React plugin - this enables Vite to understand JSX syntax
// and React-specific features like Fast Refresh (hot reloading)
import react from '@vitejs/plugin-react';

// Export the configuration object
// defineConfig() provides autocomplete and type checking in your editor
export default defineConfig({
  // Plugins array - extensions that add functionality to Vite
  plugins: [
    // The React plugin does several things:
    // 1. Transforms JSX into regular JavaScript
    // 2. Enables Fast Refresh (updates components without losing state)
    // 3. Handles React-specific optimizations
    react()
  ],

  // Server configuration for development
  server: {
    // The port number where the dev server runs (http://localhost:5173)
    port: 5173,
    // Automatically open the browser when you run 'npm run dev'
    open: true
  },

  // Build configuration for production
  build: {
    // Output directory for the built files
    outDir: 'dist',
    // Generate source maps for easier debugging in production
    sourcemap: true
  },

  // Resolve configuration - how Vite finds and imports files
  resolve: {
    // Alias shortcuts for cleaner imports
    // Instead of: import Something from '../../../components/Something'
    // You can do: import Something from '@/components/Something'
    alias: {
      '@': '/src'
    }
  }
});
