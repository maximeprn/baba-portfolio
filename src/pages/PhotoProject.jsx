import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import PhotoGrid from '../components/photos/PhotoGrid';
import Lightbox from '../components/ui/Lightbox';
import { getProjectBySlug } from '../data/photoProjects';

/**
 * PhotoProject — Full gallery view for a single photo project.
 * Left sidebar with project info, scrolling photo grid on right.
 */
function PhotoProject() {
  const { slug } = useParams();
  const project = getProjectBySlug(slug);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (photo, index) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h1 className="font-title text-2xl">Project not found</h1>
        <p className="font-body text-muted">The project you're looking for doesn't exist.</p>
        <Link
          to="/photos"
          className="font-header text-sm uppercase tracking-wide hover:opacity-70 transition-opacity"
        >
          Back to Photos
        </Link>
      </div>
    );
  }

  const { title, description, year, client, category, location, photos } = project;

  return (
    <>
      <div className="flex flex-col lg:flex-row w-full max-w-container px-6 py-8 gap-8 lg:gap-12">
        {/* LEFT SIDEBAR — sticky project info */}
        <aside className="w-full lg:w-80 lg:flex-shrink-0 lg:sticky lg:top-24 lg:self-start">
          <header className="flex flex-col gap-4">
            <h1 className="font-title text-3xl md:text-4xl font-bold tracking-wide">
              {title}
            </h1>

            <p className="font-body text-base leading-relaxed text-muted max-w-2xl">
              {description}
            </p>

            <div className="flex flex-wrap gap-4 font-body text-sm text-muted">
              {year && <span>{year}</span>}
              {client && <><span>•</span><span>{client}</span></>}
              {category && <><span>•</span><span>{category}</span></>}
              {location && <><span>•</span><span>{location}</span></>}
            </div>

            <p className="font-header text-xs uppercase tracking-wide text-muted">
              {photos.length} photos
            </p>
          </header>
        </aside>

        {/* RIGHT — Photo Grid */}
        <section className="flex-1" aria-label="Photo gallery">
          <PhotoGrid photos={photos} onPhotoClick={openLightbox} />
        </section>
      </div>

      <div className="h-20" aria-hidden="true" />

      <Lightbox
        photos={photos}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}

export default PhotoProject;
