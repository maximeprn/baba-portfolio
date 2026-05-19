/**
 * Custom Studio desk structure.
 *
 * - Singletons (siteSettings, heroOverlay, showreel, heroPhotos) are pinned to
 *   fixed document IDs matching their schema name so there can never be more
 *   than one. Paired with action filtering in sanity.config.js to remove
 *   delete/duplicate buttons.
 * - Collections (photoProject) appear as a divider-separated list at the
 *   bottom and are managed with Sanity's default document-type list (with
 *   default ordering set per schema's `orderings`).
 */

const SINGLETONS = [
  { name: 'siteSettings', title: 'Site settings', icon: '⚙️' },
  { name: 'heroOverlay', title: 'Hero overlay', icon: '🎬' },
  { name: 'showreel', title: 'Showreel', icon: '🎥' },
  { name: 'heroPhotos', title: 'Hero photos (Photos page)', icon: '🖼️' },
];

export const structure = (S) =>
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
      S.listItem()
        .title('📷  Photo projects')
        .id('photoProjects')
        .child(
          S.documentTypeList('photoProject')
            .title('Photo projects')
            .defaultOrdering([{ field: 'displayOrder', direction: 'asc' }]),
        ),
    ]);
