/**
 * Custom Studio desk structure.
 *
 * - Singletons (siteSettings, heroOverlay, showreel, heroPhotos) are pinned to
 *   fixed document IDs matching their schema name so there can never be more
 *   than one. Paired with action filtering in sanity.config.js to remove
 *   delete/duplicate buttons.
 * - Collections (photoProject) use @sanity/orderable-document-list so Basile
 *   can drag-and-drop projects to reorder them — the plugin manages the
 *   hidden `orderRank` field automatically. The fetcher sorts by orderRank.
 */

import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';

const SINGLETONS = [
  { name: 'siteSettings', title: 'Site settings', icon: '⚙️' },
  { name: 'heroOverlay', title: 'Hero overlay', icon: '🎬' },
  { name: 'showreel', title: 'Showreel', icon: '🎥' },
  { name: 'heroPhotos', title: 'Hero photos (Photos page)', icon: '🖼️' },
];

export const structure = (S, context) =>
  S.list()
    .title('Content')
    .items([
      ...SINGLETONS.map(({ name, title, icon }) =>
        S.listItem()
          .title(`${icon}  ${title}`)
          .id(name)
          .child(
            S.document()
              .schemaType(name)
              // Pin the document ID so we always edit the same singleton instance.
              .documentId(name),
          ),
      ),
      S.divider(),
      orderableDocumentListDeskItem({
        type: 'photoProject',
        title: '📷  Photo projects',
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: 'film',
        title: '🎬  Films',
        S,
        context,
      }),
    ]);
