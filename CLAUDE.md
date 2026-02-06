# BABA — Basile Deschamps Portfolio

Portfolio website for visual artist Basile Deschamps (film & photography).
React + Vite + Tailwind CSS, deployed on Vercel.

## Commands

- `npm run dev` — Start dev server (localhost:5173, auto-opens browser)
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build locally
- `npm run lint` — ESLint check (zero warnings policy)
- `npx playwright test` — Run E2E tests

## Architecture

```
src/
├── App.jsx              # Router: / (Films), /films/:slug, /photos, /photos/:slug, /about, /contact
├── main.jsx             # Entry point, wraps app in BrowserRouter + SmoothScrollContext
├── components/
│   ├── films/           # FilmCard, FeaturedFilmCard, VideoPlayer
│   ├── photos/          # ProjectCard, PhotoGrid
│   ├── layout/          # Navigation, Layout, Footer
│   └── ui/              # HeroSection, IntroSection, Divider, Lightbox
├── data/                # Content data files (films.js, photoProjects.js, siteConfig.js)
├── hooks/               # useStaggeredText (scroll-based word animation)
├── context/             # SmoothScrollContext (shared scroll position)
├── pages/               # Route page components
└── styles/              # index.css (CSS variables, font-face declarations)
```

## Key Files

- `src/data/siteConfig.js` — All site-wide content (artist info, nav, social links, SEO). Change content here, not in components.
- `src/data/films.js` / `src/data/photoProjects.js` — Portfolio content data
- `src/components/ui/HeroSection.jsx` — Most complex component: 3 simultaneous animations (scroll-based scale+pin, cursor parallax, CSS float). Separate mobile/desktop rendering paths.
- `tailwind.config.js` — Custom design tokens all backed by CSS variables from `index.css`

## Design System

- Fonts: `font-header` (Steps-Mono), `font-title` (Helvetica Now), `font-body` (American Typewriter)
- Colors: All via CSS variables (`--color-background`, `--color-text`, etc.)
- Custom sizes: `text-hero` (140px), `text-subheading`
- Import alias: `@/` maps to `src/` (configured in vite.config.js)

## Gotchas

- Use `svh` units (not `vh`) for mobile viewport heights — avoids iOS address bar issues
- Hero video (`/public/videos/hero-teaser.mp4`) is a large file; original content in `content/` is gitignored
- Bottom-aligned elements use absolute positioning with `bottom-[10vh]` + `left-0 right-0 z-0`
- HeroSection disables all animations when `prefers-reduced-motion: reduce` is set
- Contact form Formspree ID is still a placeholder (`YOUR_FORMSPREE_ID`)
- No 404 route yet (TODO in App.jsx)
