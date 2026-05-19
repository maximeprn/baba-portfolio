import { defineType, defineField } from 'sanity';

export const showreel = defineType({
  name: 'showreel',
  title: 'Showreel',
  type: 'document',
  description:
    'Main hero video. Vimeo URL drives the click-through modal; the file path drives the muted background loop.',
  fields: [
    defineField({
      name: 'vimeoUrl',
      title: 'Vimeo player URL',
      description: 'Format: https://player.vimeo.com/video/<id>',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'videoFile',
      title: 'Hero background video file',
      description:
        'Path under /videos/, e.g. /videos/Showreel 2021.mp4. The runtime swaps to a "- short.mp4" teaser cut when available.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'posterImage',
      title: 'Poster image (optional)',
      description: 'Fallback image shown while the video loads.',
      type: 'image',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Showreel' }),
  },
});
