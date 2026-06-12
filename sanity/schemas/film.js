import { defineType, defineField } from 'sanity';
import { createElement } from 'react';
import { orderRankField } from '@sanity/orderable-document-list';

/**
 * Film — a single film/video project shown on the homepage (/).
 *
 * Tab groups mirror photoProject so the editor learns ONE layout:
 *   - "Content"  → everything Basile owns, in the natural authoring flow:
 *     identity (title, slug) → story → credits → video → display flags.
 *     Fieldsets inside the tab keep the visual rhythm.
 *   - "Advanced" → optional override knobs (thumbnail, aspect ratio) that
 *     default to Mux's auto-probed values when left empty.
 *
 * One display flag drives placement (same vocabulary as photoProject):
 *   - featured=true  → FeaturedFilmCard (video preview, video left/right
 *                      alternates by row index)
 *   - featured=false → CollapsedFilmCard in the "Other Projects" row
 *
 * `featured` replaced the inverted legacy `collapsed` flag (2026-06-12).
 * Two-phase rename: `collapsed` is kept as a hidden retired field until the
 * branch is merged + deployed, then `cms:migrate-film-featured -- --prune`
 * removes it from the documents. The fetcher reads
 * `coalesce(!collapsed, featured, false)` in the meantime.
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

// Named presets for the aspect-ratio override. Editors think "16:9", not
// 1.78. The set covers every value currently stored in the dataset
// (1.78 ×14 — an artifact of the original import — plus 1.33 and 1.25).
const ASPECT_RATIO_OPTIONS = [
  { title: '16:9 — widescreen (1.78)', value: 1.78 },
  { title: '1.85:1 — cinema flat (1.85)', value: 1.85 },
  { title: '2.39:1 — anamorphic / scope (2.39)', value: 2.39 },
  { title: '2:1 — univisium (2)', value: 2 },
  { title: '4:3 — classic TV (1.33)', value: 1.33 },
  { title: '5:4 (1.25)', value: 1.25 },
  { title: '1:1 — square (1)', value: 1 },
  { title: '4:5 — portrait (0.8)', value: 0.8 },
  { title: '9:16 — vertical (0.56)', value: 0.5625 },
];

// List-preview media fallback: when no override thumbnail is set (the normal
// case), show the Mux auto-poster so the Films list isn't a column of blank
// squares. Plain createElement — schema files are .js, not .jsx.
const muxPosterMedia = (playbackId) => {
  function MuxPosterPreview() {
    return createElement('img', {
      src: `https://image.mux.com/${playbackId}/thumbnail.jpg?width=320&height=320&fit_mode=smartcrop&time=0.5`,
      alt: '',
      style: { width: '100%', height: '100%', objectFit: 'cover' },
    });
  }
  return MuxPosterPreview;
};

export const film = defineType({
  name: 'film',
  title: 'Film',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'advanced', title: 'Advanced (overrides)' },
  ],
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
      options: { columns: 1 },
    },
  ],
  // A film with no video at all can neither autoplay a preview nor open the
  // Vimeo modal — warn (not block) so a draft can still be saved early.
  validation: (Rule) =>
    Rule.custom((doc) => {
      if (doc?.videoMux?.asset || doc?.videoUrl) return true;
      return 'This film has no video yet — add a Mux preview and/or a Vimeo URL before showing it on the site.';
    }).warning(),
  fields: [
    // ---------- Identity ----------
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

    // ---------- Story ----------
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      fieldset: 'story',
      group: 'content',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      fieldset: 'story',
      group: 'content',
      validation: (Rule) => Rule.min(2000).max(2100).integer(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
      fieldset: 'story',
      group: 'content',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      description: 'Free text — pick from a common one or type your own.',
      type: 'string',
      options: { list: CATEGORY_SUGGESTIONS.map((c) => ({ title: c, value: c })) },
      fieldset: 'story',
      group: 'content',
    }),

    // ---------- Credits ----------
    defineField({
      name: 'credits',
      title: 'Credits',
      description:
        'Each row shows up in the left OR right credits column under the film. Add as many rows as you like; "Column" controls which side.',
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

    // ---------- Video ----------
    defineField({
      name: 'videoMux',
      title: 'Preview video (Mux)',
      description:
        'Autoplaying preview shown on the homepage card. Drop a .mov/.mp4 here and Mux will transcode + serve via adaptive bitrate streaming. Encoding takes ~30s after upload completes.',
      type: 'mux.video',
      fieldset: 'video',
      group: 'content',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Vimeo URL (modal)',
      description:
        'Drives the full-screen Vimeo modal opened on click. Paste any Vimeo link — the normal share link (https://vimeo.com/<id>) works fine; the site converts it to the embeddable player automatically.',
      type: 'url',
      fieldset: 'video',
      group: 'content',
      validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
    }),

    // ---------- Display ----------
    defineField({
      name: 'visible',
      title: 'Show on site',
      description:
        'Toggle off to hide this film from the homepage without unpublishing the document.',
      type: 'boolean',
      initialValue: true,
      fieldset: 'display',
      group: 'content',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      description:
        'Show this film as a featured (large) card on the homepage. Non-featured films appear in the "Other Projects" row at the bottom (small card, click to expand).',
      type: 'boolean',
      initialValue: false,
      fieldset: 'display',
      group: 'content',
    }),

    // ---------- Advanced (overrides) ----------
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail (override)',
      description:
        'Optional custom poster. Leave blank to use a frame Mux picks automatically.',
      type: 'image',
      options: { hotspot: true },
      group: 'advanced',
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Aspect ratio (override)',
      description:
        'Leave empty to use the uploaded video\'s native aspect ratio (recommended — use the field\'s ⋮ menu → "Reset value" to clear). Pick a shape only to force a different card shape.',
      type: 'number',
      options: { list: ASPECT_RATIO_OPTIONS },
      group: 'advanced',
      validation: (Rule) => Rule.positive(),
    }),
    orderRankField({ type: 'film' }),

    // --- Retired fields -----------------------------------------------------
    // `collapsed` was the inverted predecessor of `featured`. Kept hidden so
    // pre-migration documents don't show "unknown field" warnings; removed
    // from the documents by `cms:migrate-film-featured -- --prune` once the
    // featured-aware build is live on production.
    defineField({ name: 'collapsed', type: 'boolean', hidden: true }),
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
      visible: 'visible',
      media: 'thumbnail',
      playbackId: 'videoMux.asset.playbackId',
    },
    prepare: ({ title, year, featured, collapsed, visible, media, playbackId }) => {
      // Transition fallback: while the retired `collapsed` flag is on the doc
      // it stays the source of truth (docs carry orphaned pre-CMS `featured`
      // values — see cms:migrate-film-featured). After the prune: `featured`.
      const isFeatured = collapsed == null ? !!featured : !collapsed;
      return {
        title: title || 'Untitled film',
        subtitle: [
          visible === false ? '🚫 Hidden' : null,
          year,
          isFeatured ? '★ Featured' : null,
        ]
          .filter(Boolean)
          .join(' · '),
        media: media?.asset ? media : playbackId ? muxPosterMedia(playbackId) : undefined,
      };
    },
  },
});
