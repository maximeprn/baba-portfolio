/**
 * ============================================================================
 * MAIN ENTRY POINT
 * ============================================================================
 *
 * This is the first JavaScript file that runs when the app loads.
 * It's responsible for:
 * 1. Importing React and ReactDOM
 * 2. Importing the main App component
 * 3. Importing global styles
 * 4. Rendering the app into the DOM
 *
 * The HTML file (index.html) has a <div id="root"></div> element.
 * This file tells React to take control of that element and render our app inside it.
 *
 * ============================================================================
 */

// React is the library that lets us build user interfaces with components
import React from 'react';

// ReactDOM is the library that connects React to the browser's DOM
// createRoot is the modern way to render React 18+ applications
import ReactDOM from 'react-dom/client';

// BrowserRouter provides routing capabilities to our app
// It enables navigation between different pages/views without page reloads
import { BrowserRouter } from 'react-router-dom';

// Import the main App component - the root of our component tree
import App from './App';

// Import global styles - this loads our CSS variables, fonts, and Tailwind
// This MUST be imported for styles to work
import './styles/index.css';


/**
 * Create the React root and render the application
 *
 * document.getElementById('root') - finds the div with id="root" in index.html
 * createRoot() - creates a React root for that element
 * .render() - renders our React component tree into that root
 *
 * StrictMode is a development tool that:
 * - Highlights potential problems in your code
 * - Double-invokes certain functions to detect side effects
 * - Warns about deprecated APIs
 * It doesn't render anything visible and has no effect in production
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode wraps the entire app for development checks
  <React.StrictMode>
    {/*
      BrowserRouter wraps the app to enable client-side routing.
      It uses the browser's History API to keep UI in sync with the URL.

      Without this, we couldn't use <Link>, <Route>, or navigate
      between pages without full page reloads.
    */}
    <BrowserRouter>
      {/* The App component contains all our routes and pages */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
