import { defineType, defineField } from 'sanity';

export const showreel = defineType({
  name: 'showreel',
  title: 'Showreel',
  type: 'document',
  fields: [
    defineField({
      name: 'vimeoUrl',
      title: 'Vimeo URL',
      // NOTE: the "Vimeo = modal, Mux = background loop" split is explained
      // here because document-level descriptions are not rendered by Studio
      // v4's form view.
      description:
        'Drives the full-screen modal opened from the hero (the Mux upload below drives the muted background loop). Paste any Vimeo link — the normal share link (https://vimeo.com/<id>) works; the site converts it to the embeddable player automatically.',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'videoMux',
      title: 'Hero background video (Mux)',
      description:
        'Drag-and-drop the showreel preview here. Mux transcodes to adaptive bitrate HLS and serves it via its own CDN.',
      type: 'mux.video',
    }),
    // Retired: the hero video is on Mux since 2026-05 (cms.json shows the
    // asset `ready`). Kept hidden so the stored value doesn't show an
    // "unknown field" warning; the loader still uses it as last-ditch
    // fallback when Mux is empty.
    defineField({
      name: 'videoFile',
      title: 'Legacy video file path (Vercel Blob)',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'posterImage',
      title: 'Poster image (optional override)',
      description:
        'Leave blank to use a frame Mux picks automatically. Set this for a specific frame or stylised poster.',
      type: 'image',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Showreel' }),
  },
});
