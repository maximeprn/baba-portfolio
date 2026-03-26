# BABA — Basile Deschamps Portfolio

Portfolio website for visual artist Basile Deschamps (film & photography).
React + Vite + Tailwind CSS, deployed on Vercel.

## Setup

```bash
npm install
npm run dev
```

**Note:** This project uses JavaScript/JSX (not TypeScript), overriding global defaults.

## Commands

- `npm run dev` — Start dev server (localhost:5173, auto-opens browser)
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build locally
- `npm run lint` — ESLint check (zero warnings policy)
- `npx playwright test` — Run E2E tests

## Architecture

```
src/
├── App.jsx              # Router: / (Films), /photos, /photos/:slug, /about, /contact, /* (404)
├── main.jsx             # Entry point, wraps app in BrowserRouter
├── components/
│   ├── films/           # FilmCard, FeaturedFilmCard, FilmModal
│   ├── photos/          # ProjectCard, PhotoGrid, FloatingGalleryHero
│   ├── layout/          # Navigation, Layout, Footer
│   └── ui/              # HeroSection, PersistentHeroText, Divider, Lightbox
├── data/                # Content data files (films.js, photoProjects.js, siteConfig.js)
├── context/             # SmoothScrollContext (shared scroll position, smooth scroll on desktop)
├── pages/               # Route page components
└── styles/              # index.css (CSS variables, font-face declarations)
```

## Key Files

- `src/data/siteConfig.js` — All site-wide content (artist info, nav, social links, SEO). Change content here, not in components.
- `src/data/films.js` / `src/data/photoProjects.js` — Portfolio content data
- `src/components/ui/HeroSection.jsx` — Fullscreen sticky video hero. Separate mobile/desktop rendering paths.
- `src/components/films/FilmModal.jsx` — Shared fullscreen Vimeo overlay (used by both film detail and showreel)
- `src/components/ui/PersistentHeroText.jsx` — Split-color artist name overlay (white on video, black on background)
- `tailwind.config.js` — Custom design tokens all backed by CSS variables from `index.css`

## Design System

- Fonts: `font-header` (Helvetica Now Display), `font-title` (Helvetica Now Display), `font-body` (Helvetica Now Text)
- Colors: All via CSS variables (`--color-background`, `--color-text`, etc.)
- Custom sizes: `text-hero` (140px), `text-subheading`
- Import alias: `@/` maps to `src/` (configured in vite.config.js)

## Gotchas

- Use Flexbox for all component layouts — never use `position: absolute` to place sibling elements (text, images, videos) side by side. Use `flex-row` / `flex-row-reverse` for left/right alternation and `gap` for guaranteed spacing.
- Use `svh` units (not `vh`) for mobile viewport heights — avoids iOS address bar issues
- Hero video (`/public/videos/hero-teaser.mp4`) is a large file; original content in `content/` is gitignored
- Bottom-aligned elements use absolute positioning with `bottom-[10vh]` + `left-0 right-0 z-0`
- Global `prefers-reduced-motion: reduce` in index.css disables all animations site-wide
- Contact page is a simple link page (email + social links), no form
- Film detail uses modal overlay (FilmModal), not a separate route
- Photo images must be in `public/photos/` — paths in photoProjects.js use `/photos/...`
