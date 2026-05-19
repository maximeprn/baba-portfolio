/**
 * Custom Studio desk structure.
 *
 * Pins each singleton document to a fixed document ID matching its schema name
 * so there can never be more than one. This is paired with action filtering in
 * sanity.config.js to remove delete/duplicate buttons on these documents.
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
    .items(
      SINGLETONS.map(({ name, title, icon }) =>
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
    );
