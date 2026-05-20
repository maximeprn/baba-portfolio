import { defineType, defineField } from 'sanity';
import { orderRankField } from '@sanity/orderable-document-list';

/**
 * Film — a single film/video project shown on the homepage (/).
 *
 * Editing UX uses three groups:
 *   - "Content" → fields Basile owns: title, copy, credits, year, flags.
 *   - "Media"   → thumbnail image + video pointers (Vimeo URL + Blob path).
 *   - "Layout"  → developer-only knobs (image side, advanced overrides).
 *
 * Ordering is drag-and-drop via @sanity/orderable-document-list. The plugin
 * manages the hidden `orderRank` field. The fetcher sorts by orderRank asc.
 *
 * Two independent display flags drive how a film renders:
 *   - collapsed=false + featured=true  → FeaturedFilmCard (video preview)
 *   - collapsed=false + featured=false → FilmCard (medium card)
 *   - collapsed=true                   → CollapsedFilmCard in "Other Projects"
 * `collapsed` wins when both are true.
 */

const CATEGORY_SUGGESTIONS = [
  'Commercial',
  'Documentary',
  'Documentary / Sport',
  'Fashion Film',
  'Fashion / Behind the Scenes',
  'Music Video',
  'Music / Short Film',
  'Spec Commercial',
  'Branded Documentary',
  'Showreel',
];

export const film = defineType({
  name: 'film',
  title: 'Film',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'media', title: 'Media' },
    { name: 'layout', title: 'Layout (advanced)' },
  ],
  fields: [
    // ----------- Content -----------
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      description: 'Auto-generates from the title. Click "Generate" if you change the title later.',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      group: 'content',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      group: 'content',
      validation: (Rule) => Rule.min(2000).max(2100).integer(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      description: 'Free text — pick from a common one or type your own.',
      type: 'string',
      options: { list: CATEGORY_SUGGESTIONS.map((c) => ({ title: c, value: c })) },
      group: 'content',
    }),
    defineField({
      name: 'credits',
      title: 'Credits',
      description:
        'Each row shows up in the left OR right credits column under the film. Add as many rows as you like; "side" controls which column.',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          name: 'creditItem',
          title: 'Credit',
          fields: [
            defineField({
              name: 'side',
              title: 'Column',
              type: 'string',
              options: {
                list: [
                  { title: 'Left', value: 'left' },
                  { title: 'Right', value: 'right' },
                ],
                layout: 'radio',
              },
              initialValue: 'left',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'role',
              title: 'Role',
              description: 'e.g. Direction, Music, DOP, Edit, Production.',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { side: 'side', role: 'role', name: 'name' },
            prepare: ({ side, role, name }) => ({
              title: `${role || '—'}: ${name || '—'}`,
              subtitle: side === 'right' ? '→ right column' : '← left column',
            }),
          },
        },
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured (video preview card)',
      description:
        'Show as a large card with an autoplaying video preview. When OFF, the film renders as a smaller card with the thumbnail. Only applies when "Collapsed" is OFF.',
      type: 'boolean',
      initialValue: true,
      group: 'content',
    }),
    defineField({
      name: 'collapsed',
      title: 'Collapsed (in "Other Projects")',
      description:
        'Move this film to the "Other Projects" row at the bottom of the page (small card, click to expand). Wins over "Featured".',
      type: 'boolean',
      initialValue: false,
      group: 'content',
    }),

    // ----------- Media -----------
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail (poster image)',
      description:
        'Shown on non-featured and collapsed cards. Featured cards autoplay the video instead but use this as the loading poster.',
      type: 'image',
      options: { hotspot: true },
      group: 'media',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Vimeo player URL',
      description:
        'Drives the click-through modal. Format: https://player.vimeo.com/video/<id>',
      type: 'url',
      group: 'media',
      validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'videoType',
      title: 'Video type',
      type: 'string',
      options: {
        list: [
          { title: 'Vimeo (recommended)', value: 'vimeo' },
          { title: 'MP4 (direct)', value: 'mp4' },
        ],
        layout: 'radio',
      },
      initialValue: 'vimeo',
      group: 'media',
    }),
    defineField({
      name: 'videoFile',
      title: 'Video file path',
      description:
        'Path under /videos/ — e.g. "/videos/Veja Condor 3.mp4". The file lives on Vercel Blob; this string is the rewrite target. Leave blank if the film has no autoplaying preview.',
      type: 'string',
      group: 'media',
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Aspect ratio',
      description:
        'Width / height ratio of the card preview. Defaults to 1.78 (16:9). Common values: 1.78, 1.33, 1.25.',
      type: 'number',
      initialValue: 1.78,
      group: 'media',
      validation: (Rule) => Rule.positive(),
    }),

    orderRankField({ type: 'film' }),

    // ----------- Layout (advanced) -----------
    defineField({
      name: 'imagePosition',
      title: 'Image position override',
      description:
        'For featured cards. Controls whether the video preview sits on the left or right. Leave blank for auto (alternates by row).',
      type: 'string',
      options: {
        list: [
          { title: 'Auto', value: '' },
          { title: 'Left', value: 'left' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
      },
      group: 'layout',
    }),
  ],
  orderings: [
    {
      name: 'titleAsc',
      title: 'Title (A → Z)',
      by: [{ field: 'title', direction: 'asc' }],
    },
    {
      name: 'yearDesc',
      title: 'Year (newest first)',
      by: [{ field: 'year', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      year: 'year',
      featured: 'featured',
      collapsed: 'collapsed',
      media: 'thumbnail',
    },
    prepare: ({ title, year, featured, collapsed, media }) => {
      const tags = [];
      if (collapsed) tags.push('collapsed');
      else if (featured) tags.push('featured');
      return {
        title: title || 'Untitled film',
        subtitle: [year, ...tags].filter(Boolean).join(' · '),
        media,
      };
    },
  },
});
