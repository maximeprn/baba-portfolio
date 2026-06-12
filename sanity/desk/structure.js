/**
 * Custom Studio desk structure.
 *
 * - Collections (film, photoProject) come FIRST — they are Basile's daily
 *   work. Both use @sanity/orderable-document-list so he can drag-and-drop
 *   to reorder — the plugin manages the hidden `orderRank` field
 *   automatically. The fetcher sorts by orderRank.
 * - Singletons (siteSettings, heroOverlay, showreel, heroPhotos) are
 *   set-and-forget site config, grouped below a divider. They are pinned to
 *   fixed document IDs matching their schema name so there can never be more
 *   than one. Paired with action filtering in sanity.config.js to remove
 *   delete/duplicate buttons.
 * - Icons are passed via `.icon()` / the `icon` option (not baked into the
 *   title string) so panes, breadcrumbs and search render them consistently.
 */

import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';

const SINGLETONS = [
  { name: 'siteSettings', title: 'Site settings', icon: () => '⚙️' },
  { name: 'heroOverlay', title: 'Hero overlay', icon: () => '💬' },
  { name: 'showreel', title: 'Showreel', icon: () => '🎥' },
  { name: 'heroPhotos', title: 'Hero photos (Photos page)', icon: () => '🖼️' },
];

export const structure = (S, context) =>
  S.list()
    .title('Content')
    .items([
      orderableDocumentListDeskItem({
        type: 'film',
        title: 'Films',
        icon: () => '🎬',
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: 'photoProject',
        title: 'Photo projects',
        icon: () => '📷',
        S,
        context,
      }),
      S.divider(),
      ...SINGLETONS.map(({ name, title, icon }) =>
        S.listItem()
          .title(title)
          .icon(icon)
          .id(name)
          .child(
            S.document()
              .schemaType(name)
              // Pin the document ID so we always edit the same singleton instance.
              .documentId(name),
          ),
      ),
    ]);
