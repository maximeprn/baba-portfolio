/**
 * Photos page
 *
 * Floating gallery hero (flashing photo slideshow) + a list of featured photo
 * projects rendered as compact cards that expand inline into artistic galleries.
 * Single-expand enforcement (only one project expanded at a time) is owned here.
 *
 * Spec: .mdd/docs/05-featured-photo-cards.md
 */

import { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

import FloatingGalleryHero from '../components/photos/FloatingGalleryHero';
import FeaturedPhotoCard from '../components/photos/FeaturedPhotoCard';
import CollapsedPhotoCard from '../components/photos/CollapsedPhotoCard';
import Lightbox from '../components/ui/Lightbox';
import TitleSection from '../components/ui/TitleSection';

import {
  getFeaturedProjects,
  getNonFeaturedProjects,
  photoProjects,
} from '../data/photoProjects';

function Photos() {
  const featuredProjects = getFeaturedProjects();
  const otherProjects = getNonFeaturedProjects();

  // Single-expand orchestrator
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [closeSignals, setCloseSignals] = useState({});

  const handleWillExpand = useCallback((id) => {
    setExpandedProjectId((prev) => {
      if (prev !== null && prev !== id) {
        setCloseSignals((sigs) => ({ ...sigs, [prev]: (sigs[prev] || 0) + 1 }));
      }
      return id;
    });
  }, []);

  const handleDidCollapse = useCallback((id) => {
    setExpandedProjectId((prev) => (prev === id ? null : prev));
  }, []);

  // Lightbox state — bound to the currently expanded project so it can never
  // outlive its source. Closing/switching projects resets it.
  const [lightbox, setLightbox] = useState(null); // { projectId, index } | null
  const lightboxProject = lightbox
    ? photoProjects.find((p) => p.id === lightbox.projectId)
    : null;

  const handlePhotoClick = useCallback((project, photoIndex) => {
    setLightbox({ projectId: project.id, index: photoIndex });
  }, []);

  const handleLightboxClose = useCallback(() => setLightbox(null), []);
  const handleLightboxNavigate = useCallback(
    (newIndex) => setLightbox((l) => (l ? { ...l, index: newIndex } : l)),
    [],
  );

  // Reset Lightbox whenever the expanded project changes (or collapses to null).
  useEffect(() => {
    setLightbox((l) => {
      if (!l) return l;
      if (expandedProjectId === null) return null;
      if (l.projectId !== expandedProjectId) return null;
      return l;
    });
  }, [expandedProjectId]);

  // Background warm-up: after mount, fetch full-project galleries for all featured
  // projects so expansion reveals already-cached photos. Sequential with a small
  // stagger to avoid burst.
  useEffect(() => {
    let cancelled = false;
    const STAGGER_MS = 50;

    const warmProject = async (project) => {
      for (const photo of project.photos) {
        if (cancelled) return;
        const img = new Image();
        img.src = photo.src;
        await new Promise((resolve) => {
          const t = setTimeout(resolve, STAGGER_MS);
          img.onload = img.onerror = () => {
            clearTimeout(t);
            resolve();
          };
        });
      }
    };

    (async () => {
      // Defer slightly so the page paints + compact previews load eagerly first.
      await new Promise((r) => setTimeout(r, 600));
      for (const project of featuredProjects) {
        if (cancelled) return;
        await warmProject(project);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [featuredProjects]);

  // imagePosition alternates by display index in the featured array (L, R, L, R, …),
  // unless a project sets `imagePosition` explicitly in its data.
  const positionFor = (project, idx) =>
    project.imagePosition || (idx % 2 === 0 ? 'left' : 'right');

  return (
    <div className="flex flex-col items-center w-full">
      <Helmet>
        <title>Photos | Basile Deschamps</title>
        <meta
          name="description"
          content="Photo projects by Basile Deschamps — sports photography and visual storytelling."
        />
        <meta property="og:title" content="Photos | Basile Deschamps" />
      </Helmet>

      {/* HERO */}
      <FloatingGalleryHero />

      {/* FEATURED PROJECTS */}
      <div className="flex flex-col items-center w-full md:px-[100px]">
        <div className="h-10 md:h-16" aria-hidden="true" />

        {featuredProjects.map((project, idx) => (
          <div key={project.id} className="py-2.5 w-full max-w-[1320px]">
            <FeaturedPhotoCard
              project={project}
              index={idx}
              imagePosition={positionFor(project, idx)}
              onPhotoClick={handlePhotoClick}
              onWillExpand={handleWillExpand}
              onDidCollapse={handleDidCollapse}
              closeSignal={closeSignals[project.id] || 0}
            />
          </div>
        ))}

        {/* OTHER PROJECTS — non-featured projects rendered as collapsed
            single-row bands. Click expands directly into the same gallery
            view used by FeaturedPhotoCard. Single-expand state is shared
            with the featured cards above, so opening any card collapses
            whichever was previously open (Featured or Collapsed).
            Spec: .mdd/docs/06-collapsed-photo-cards.md */}
        {otherProjects.length > 0 && (
          <>
            <div className="h-32" aria-hidden="true" />
            <TitleSection title="Other Projects" />
            {otherProjects.map((project, idx) => (
              // Mobile-only spacing: the band stacks title + meta and used
              // to feel cramped between adjacent projects. mb-6 gives a
              // visible gap; on desktop the band is a tight 36px row so
              // we keep its zero-margin rhythm.
              <div key={project.id} className="w-full mb-6 md:mb-0 last:mb-0">
                <CollapsedPhotoCard
                  project={project}
                  index={idx}
                  onPhotoClick={handlePhotoClick}
                  onWillExpand={handleWillExpand}
                  onDidCollapse={handleDidCollapse}
                  closeSignal={closeSignals[project.id] || 0}
                />
              </div>
            ))}
          </>
        )}

        <div className="h-20" aria-hidden="true" />
      </div>

      {/* LIGHTBOX */}
      {lightboxProject && (
        <Lightbox
          photos={lightboxProject.photos}
          currentIndex={lightbox.index}
          isOpen={true}
          onClose={handleLightboxClose}
          onNavigate={handleLightboxNavigate}
        />
      )}
    </div>
  );
}

export default Photos;
