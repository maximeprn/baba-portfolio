import { defineType, defineField } from 'sanity';
import { orderRankField } from '@sanity/orderable-document-list';
import { PATTERNS } from '../../src/components/photos/previewPatterns';

/**
 * Photo project — a single shoot or campaign Basile wants to showcase on
 * the /photos page. NOT a singleton: this is a collection. Each project
 * has its own document. Editing UX is split into two groups:
 *   - "Content"  → fields Basile owns: title, copy, photos, year, etc.
 *   - "Layout"   → developer-only knobs (preview pattern + mobile fallback)
 *
 * Order on the page is controlled by drag-and-drop in the Studio list view:
 * @sanity/orderable-document-list manages the hidden `orderRank` field and
 * the fetcher sorts by it ascending.
 *
 * The layout knobs are guarded by cross-field validation against the shared
 * pattern table (src/components/photos/previewPatterns.js): the indices
 * array must match the pattern's slot count and reference existing photos —
 * violations used to surface only as a broken collage on the live site.
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

// Dropdown options: one entry per pattern, named after its layout.
const PATTERN_OPTIONS = PATTERNS.map((p, i) => ({
  title: `${i} — ${p.name}`,
  value: i,
}));

// Cross-field validation for an indices array against its pattern field —
// a factory so the desktop and mobile pairs share the same rules.
const indicesMatchPattern = (patternFieldName, patternFieldTitle) => (indices, context) => {
  if (!Array.isArray(indices) || indices.length === 0) return true; // empty is fine — preview simply not used
  const doc = context.document ?? {};
  const pattern = doc[patternFieldName];
  if (typeof pattern !== 'number') {
    return `Set "${patternFieldTitle}" first — these photo numbers have no layout to fill.`;
  }
  const slotCount = PATTERNS[pattern]?.slots?.length;
  if (slotCount && indices.length !== slotCount) {
    return `Pattern ${pattern} (${PATTERNS[pattern].name}) shows exactly ${slotCount} photo${
      slotCount === 1 ? '' : 's'
    } — you picked ${indices.length}.`;
  }
  const photoCount = Array.isArray(doc.photos) ? doc.photos.length : 0;
  const bad = indices.filter(
    (i) => typeof i !== 'number' || !Number.isInteger(i) || i < 0 || i >= photoCount,
  );
  if (bad.length) {
    return `Photo number${bad.length > 1 ? 's' : ''} ${bad.join(', ')} do${
      bad.length > 1 ? "n't" : "esn't"
    } exist — this project has ${photoCount} photo${photoCount === 1 ? '' : 's'} (numbered 0–${Math.max(photoCount - 1, 0)}).`;
  }
  return true;
};

// Warn (not block) when a pattern is set but its indices are missing — the
// site falls back gracefully, but the editor's intent is unfulfilled.
const patternNeedsIndices = (indicesFieldName, indicesFieldTitle) => (pattern, context) => {
  if (typeof pattern !== 'number') return true;
  const indices = context.document?.[indicesFieldName];
  if (Array.isArray(indices) && indices.length > 0) return true;
  const slotCount = PATTERNS[pattern]?.slots?.length;
  return `Also fill "${indicesFieldTitle}" — this pattern shows ${slotCount ?? 'N'} photo${
    slotCount === 1 ? '' : 's'
  }. Until then the pattern is ignored.`;
};

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
      name: 'visible',
      title: 'Show on site',
      description:
        'Toggle off to hide this project from the Photos page without unpublishing the document.',
      type: 'boolean',
      initialValue: true,
      group: 'content',
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
      title: 'Preview pattern',
      description:
        'Collage layout for the compact card. The number of "Preview photos" below must match the pattern\'s photo count.',
      type: 'number',
      group: 'layout',
      options: { list: PATTERN_OPTIONS },
      validation: (Rule) => [
        Rule.min(0).max(PATTERNS.length - 1).integer(),
        Rule.custom(patternNeedsIndices('previewPhotoIndices', 'Preview photos (indices)')).warning(),
      ],
    }),
    defineField({
      name: 'previewPhotoIndices',
      title: 'Preview photos (indices)',
      description:
        'Which photos appear in the compact card collage, by position in the photos list above (the first photo is 0).',
      type: 'array',
      of: [{ type: 'number' }],
      group: 'layout',
      validation: (Rule) =>
        Rule.custom(indicesMatchPattern('previewPattern', 'Preview pattern')),
    }),
    defineField({
      name: 'previewMobilePattern',
      title: 'Mobile preview pattern',
      description:
        'When the viewport is below "Mobile breakpoint", swap the desktop preview pattern for this one. Typical use: pattern 10 (single full-bleed) so featured cards collapse from a side-by-side comparison to one photo on narrow screens.',
      type: 'number',
      group: 'layout',
      options: { list: PATTERN_OPTIONS },
      validation: (Rule) => [
        Rule.min(0).max(PATTERNS.length - 1).integer(),
        Rule.custom(
          patternNeedsIndices('previewMobilePhotoIndices', 'Mobile preview photos (indices)'),
        ).warning(),
      ],
    }),
    defineField({
      name: 'previewMobilePhotoIndices',
      title: 'Mobile preview photos (indices)',
      description:
        'Photo numbers used when the mobile pattern is active (the first photo is 0).',
      type: 'array',
      of: [{ type: 'number' }],
      group: 'layout',
      validation: (Rule) =>
        Rule.custom(indicesMatchPattern('previewMobilePattern', 'Mobile preview pattern')),
    }),
    defineField({
      name: 'previewMobileBreakpoint',
      title: 'Mobile breakpoint (px)',
      description:
        'Max-width below which the mobile pattern + mobile photos apply. The featured side-by-side comparison was originally set to 1349 so it collapsed on tablets too.',
      type: 'number',
      group: 'layout',
      validation: (Rule) => Rule.min(0).integer(),
    }),
    defineField({
      name: 'previewAspectRatio',
      title: 'Preview aspect ratio',
      description:
        'Optional CSS aspect-ratio override for the compact card (e.g. "5 / 4", "16 / 9"). Leave blank to derive from the first photo + the biggest slot.',
      type: 'string',
      group: 'layout',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return true;
          return /^\s*\d+(\.\d+)?(\s*\/\s*\d+(\.\d+)?)?\s*$/.test(value)
            ? true
            : 'Use the form "5 / 4" or "16 / 9" (or a single number like "1.25").';
        }).warning(),
    }),
    defineField({
      name: 'previewMaxHeight',
      title: 'Preview max-height',
      description:
        'Optional CSS max-height cap for the compact card (e.g. "60vh"). Keeps very tall cards from dominating the viewport.',
      type: 'string',
      group: 'layout',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return true;
          return /^\s*\d+(\.\d+)?(px|vh|svh|dvh|rem|em|%)\s*$/.test(value)
            ? true
            : 'Use a CSS length like "60vh", "480px" or "32rem".';
        }).warning(),
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
      visible: 'visible',
      media: 'photos.0',
    },
    prepare: ({ title, year, featured, visible, media }) => ({
      title: title || 'Untitled project',
      subtitle: [
        visible === false ? '🚫 Hidden' : null,
        year,
        featured ? '★ Featured' : null,
      ]
        .filter(Boolean)
        .join(' · '),
      media,
    }),
  },
});
