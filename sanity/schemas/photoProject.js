import { defineType, defineField } from 'sanity';
import { orderRankField } from '@sanity/orderable-document-list';

/**
 * Photo project — a single shoot or campaign Basile wants to showcase on
 * the /photos page. NOT a singleton: this is a collection. Each project
 * has its own document. Editing UX is split into two groups:
 *   - "Content"  → fields Basile owns: title, copy, photos, year, etc.
 *   - "Layout"   → developer-only knobs (preview pattern, image position)
 *
 * Order on the page is controlled by `displayOrder` (lower = earlier).
 */

const CATEGORY_SUGGESTIONS = [
  'Editorial',
  'Commercial',
  'Sport',
  'Fashion',
  'Documentary',
  'Portrait',
  'Personal',
];

export const photoProject = defineType({
  name: 'photoProject',
  title: 'Photo project',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
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
      name: 'photos',
      title: 'Photos',
      description: 'Drag to reorder. Upload directly or pick from existing assets.',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
            }),
          ],
        },
      ],
      group: 'content',
      validation: (Rule) => Rule.min(1).warning('A project usually has at least one photo.'),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      description:
        'Show this project as a featured (large) card on the Photos page. Non-featured projects appear in the "Other projects" grid below.',
      type: 'boolean',
      initialValue: false,
      group: 'content',
    }),
    // Order is now controlled by drag-and-drop in the Studio list view
    // (via @sanity/orderable-document-list). The orderRank field below is
    // managed by the plugin — hidden from the editor UI but persisted on
    // every doc and used by the fetcher to sort projects.
    orderRankField({ type: 'photoProject' }),

    // ----------- Layout (advanced) -----------
    defineField({
      name: 'previewPattern',
      title: 'Preview pattern (0–15)',
      description:
        'Layout index in PhotoCardPreview.PATTERNS. The pattern\'s slot count must match the length of "Preview photos".',
      type: 'number',
      group: 'layout',
      validation: (Rule) => Rule.min(0).max(15).integer(),
    }),
    defineField({
      name: 'previewPhotoIndices',
      title: 'Preview photos (indices)',
      description:
        'Which photos appear in the compact card collage, by index into the photos array. Length must match the pattern\'s slot count.',
      type: 'array',
      of: [{ type: 'number' }],
      group: 'layout',
    }),
    defineField({
      name: 'imagePosition',
      title: 'Image position override',
      description:
        'For featured cards. Leave blank for auto (alternates left/right by index).',
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
      media: 'photos.0',
    },
    prepare: ({ title, year, featured, media }) => ({
      title: title || 'Untitled project',
      subtitle: [year, featured ? 'featured' : null].filter(Boolean).join(' · '),
      media,
    }),
  },
});
