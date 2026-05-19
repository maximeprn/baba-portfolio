import { defineType, defineField } from 'sanity';

export const heroPhotos = defineType({
  name: 'heroPhotos',
  title: 'Hero photos (Photos page)',
  type: 'document',
  description:
    'Full-bleed flashing photo slideshow that fills the hero on /photos. Drag to reorder; the slideshow shuffles the order on each page load.',
  fields: [
    defineField({
      name: 'photos',
      title: 'Slideshow photos',
      description:
        'Drag to reorder. The runtime shuffles the order at page load — order here matters only as the canonical source.',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text (optional)',
              description: 'Brief description for accessibility / SEO. Leave blank if not relevant.',
              type: 'string',
            }),
          ],
        },
      ],
      validation: (Rule) => Rule.min(1).error('Add at least one photo so the slideshow has something to render.'),
    }),
  ],
  preview: {
    select: { count: 'photos.length' },
    prepare: ({ count }) => ({
      title: 'Hero photos (Photos page)',
      subtitle: count != null ? `${count} photo${count === 1 ? '' : 's'}` : 'Empty',
    }),
  },
});
