import { defineType, defineField } from 'sanity';

export const showreel = defineType({
  name: 'showreel',
  title: 'Showreel',
  type: 'document',
  description:
    'Main hero video. Vimeo URL drives the click-through modal; the Mux upload drives the muted background loop.',
  fields: [
    defineField({
      name: 'vimeoUrl',
      title: 'Vimeo player URL',
      description: 'Format: https://player.vimeo.com/video/<id>',
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
    defineField({
      name: 'videoFile',
      title: 'Legacy video file path (Vercel Blob)',
      description:
        'Transitional fallback. Used only when the Mux upload above is empty. Will be removed once the hero video is on Mux.',
      type: 'string',
      readOnly: true,
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
