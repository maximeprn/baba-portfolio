/**
 * ESLint configuration (legacy eslintrc format).
 *
 * Kept in the eslintrc `.cjs` format — deliberately NOT the newer flat
 * `eslint.config.js` — because the `lint` npm script passes `--ext js,jsx`,
 * a flag only the eslintrc loader understands. The `.cjs` extension is
 * required so this CommonJS file is parsed correctly inside a
 * `"type": "module"` package.
 *
 * The repo mixes browser code (src/, sanity/) with Node build config files
 * (vite.config.js, tailwind.config.js, postcss.config.js), so both
 * environments are enabled globally to avoid false `no-undef` errors on
 * `window` / `document` / `process` / `module`.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    // Disables `react-in-jsx-scope` — Vite uses the automatic JSX runtime,
    // so components never `import React` just to render JSX.
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  plugins: ['react-refresh'],
  ignorePatterns: [
    // Vite build output — never lint generated code.
    'dist',
    'build',
    // ESLint 8's parser (espree) cannot read the `with { type: 'json' }`
    // import attribute. videoShorts.js needs that attribute because the
    // cms:migrate-blob-to-mux script dynamically imports it under Node, and
    // Node ESM requires it for JSON imports. Lift this exclusion once the
    // project moves to ESLint 9 + flat config, which parses the attribute.
    'src/data/videoShorts.js',
  ],
  rules: {
    // This is a plain-JSX codebase — no PropTypes are declared anywhere, so
    // the prop-types check would flood every component with noise.
    'react/prop-types': 'off',
    // Allow intentionally-unused bindings prefixed with `_` — notably
    // array-destructured `useState` where only the setter is consumed.
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      },
    ],
    // Warn when a module exports non-components alongside a component, which
    // breaks Vite Fast Refresh during development.
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
};
