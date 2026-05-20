import { defineType, defineField } from 'sanity';
import { orderRankField } from '@sanity/orderable-document-list';

/**
 * Film — a single film/video project shown on the homepage (/).
 *
 * Single-tab layout, ordered top-to-bottom in the natural flow of authoring:
 *   1. Identity         — title, slug
 *   2. Story            — description, year, client, category
 *   3. Credits          — array of {side, role, name}
 *   4. Video            — Mux preview asset + Vimeo modal URL
 *   5. Display flags    — featured, collapsed
 *   6. Advanced (collapsed by default) — thumbnail override, aspectRatio
 *      override, imagePosition override
 *
 * Two display flags drive how a film renders:
 *   - collapsed=false + featured=true  → FeaturedFilmCard (video preview)
 *   - collapsed=false + featured=false → FilmCard (medium card)
 *   - collapsed=true                   → CollapsedFilmCard in "Other Projects"
 * `collapsed` wins when both are true.
 *
 * Ordering is drag-and-drop via @sanity/orderable-document-list. The plugin
 * manages the hidden `orderRank` field. The fetcher sorts by orderRank asc.
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
  fieldsets: [
    {
      name: 'story',
      title: 'Story',
      options: { columns: 1 },
    },
    {
      name: 'video',
      title: 'Video',
      options: { columns: 1 },
    },
    {
      name: 'display',
      title: 'Display',
      options: { columns: 2 },
    },
    {
      name: 'advanced',
      title: 'Advanced overrides',
      description:
        'Optional knobs. Leave blank to let Mux + the layout engine handle each setting automatically.',
      options: { collapsible: true, collapsed: true, columns: 1 },
    },
  ],
  fields: [
    // ---------- Identity ----------
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      description: 'Auto-generates from the title. Click "Generate" if you change the title later.',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),

    // ---------- Story ----------
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      fieldset: 'story',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      fieldset: 'story',
      validation: (Rule) => Rule.min(2000).max(2100).integer(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
      fieldset: 'story',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      description: 'Free text — pick from a common one or type your own.',
      type: 'string',
      options: { list: CATEGORY_SUGGESTIONS.map((c) => ({ title: c, value: c })) },
      fieldset: 'story',
    }),

    // ---------- Credits ----------
    defineField({
      name: 'credits',
      title: 'Credits',
      description:
        'Each row shows up in the left OR right credits column under the film. Add as many rows as you like; "Column" controls which side.',
      type: 'array',
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

    // ---------- Video ----------
    defineField({
      name: 'videoMux',
      title: 'Preview video (Mux)',
      description:
        'Autoplaying preview shown on the homepage card. Drop a .mov/.mp4 here and Mux will transcode + serve via adaptive bitrate streaming. Encoding takes ~30s after upload completes.',
      type: 'mux.video',
      fieldset: 'video',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Vimeo player URL (modal)',
      description:
        'Drives the full-screen Vimeo modal opened on click. Format: https://player.vimeo.com/video/<id>',
      type: 'url',
      fieldset: 'video',
      validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
    }),

    // ---------- Display flags ----------
    defineField({
      name: 'featured',
      title: 'Featured',
      description:
        'Show as a large card with an autoplaying video preview. When OFF, the film renders as a smaller card with the thumbnail. Only applies when "Collapsed" is OFF.',
      type: 'boolean',
      initialValue: true,
      fieldset: 'display',
    }),
    defineField({
      name: 'collapsed',
      title: 'Collapsed',
      description:
        'Move this film to the "Other Projects" row at the bottom (small card, click to expand). Wins over "Featured".',
      type: 'boolean',
      initialValue: false,
      fieldset: 'display',
    }),

    // ---------- Advanced overrides ----------
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail (override)',
      description:
        'Optional custom poster. Leave blank to use a frame Mux picks automatically.',
      type: 'image',
      options: { hotspot: true },
      fieldset: 'advanced',
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Aspect ratio (override)',
      description:
        'Leave blank to use the uploaded video\'s native aspect ratio. Set this to force a different card shape — e.g. 1.78 (16:9), 1.33 (4:3), 1.25 (5:4).',
      type: 'number',
      fieldset: 'advanced',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'imagePosition',
      title: 'Image position (override)',
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
      fieldset: 'advanced',
    }),

    orderRankField({ type: 'film' }),
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
