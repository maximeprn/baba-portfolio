import { defineType, defineField } from 'sanity';
import { createElement } from 'react';
import { orderRankField } from '@sanity/orderable-document-list';

/**
 * Film — a single film/video project shown on the homepage (/).
 *
 * Single-tab layout, ordered top-to-bottom in the natural flow of authoring:
 *   1. Identity         — title, slug
 *   2. Story            — description, year, client, category
 *   3. Credits          — array of {side, role, name}
 *   4. Video            — Mux preview asset + Vimeo modal URL
 *   5. Display flags    — visible, featured
 *   6. Advanced (collapsed by default) — thumbnail override, aspectRatio
 *      override
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
 * `coalesce(featured, !collapsed)` in the meantime.
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
    {
      name: 'advanced',
      title: 'Advanced overrides',
      description:
        'Optional knobs. Leave blank to let Mux + the layout engine handle each setting automatically.',
      options: { collapsible: true, collapsed: true, columns: 1 },
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
      title: 'Vimeo URL (modal)',
      description:
        'Drives the full-screen Vimeo modal opened on click. Paste any Vimeo link — the normal share link (https://vimeo.com/<id>) works fine; the site converts it to the embeddable player automatically.',
      type: 'url',
      fieldset: 'video',
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
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      description:
        'Show this film as a featured (large) card on the homepage. Non-featured films appear in the "Other Projects" row at the bottom (small card, click to expand).',
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
