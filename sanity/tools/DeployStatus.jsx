/**
 * DeployStatus — presentation half of the Studio Deploy tool.
 *
 * Renders the "what's changed since your last deploy" panel from the data
 * provided by useDeployStatus. Shared styles live in deployStyles.js.
 */

import { styles } from './deployStyles';

const TYPE_LABELS = {
  siteSettings: 'Site settings',
  heroOverlay: 'Hero overlay',
  showreel: 'Showreel',
  heroPhotos: 'Hero photos',
  photoProject: 'Photo project',
  film: 'Film',
};

const MAX_LISTED_CHANGES = 8;

function changeLabel(doc) {
  const label = TYPE_LABELS[doc._type] || doc._type;
  // Singletons coalesce title → _type; don't print "Showreel — showreel".
  return doc.title && doc.title !== doc._type ? `${label} — ${doc.title}` : label;
}

export function DeployStatus({ lastDeployedAt, status }) {
  const { loading, error, changed, draftCount, refresh } = status;
  if (loading) return <p style={{ ...styles.muted, fontSize: 13 }}>Checking what’s changed…</p>;
  if (error) {
    return (
      <p style={{ ...styles.muted, fontSize: 13 }}>
        Couldn’t check for changes ({error}).{' '}
        <button type="button" style={styles.refresh} onClick={refresh}>Retry</button>
      </p>
    );
  }
  return (
    <div style={{ fontSize: 13 }}>
      {draftCount > 0 && (
        <p style={{ margin: '0 0 8px 0' }}>
          ✏️ {draftCount} draft{draftCount === 1 ? '' : 's'} with unpublished edits — publish
          {draftCount === 1 ? ' it' : ' them'} first, or {draftCount === 1 ? 'it' : 'they'} won’t
          go live.
        </p>
      )}
      {!lastDeployedAt ? (
        <p style={styles.muted}>
          No deploy recorded on this device yet — after your first click, this panel will list
          what’s been published since.
        </p>
      ) : changed.length === 0 ? (
        <p style={styles.muted}>
          ✅ Nothing published since your last deploy ({lastDeployedAt.toLocaleString()}) — the
          live site is up to date if that build succeeded.
        </p>
      ) : (
        <>
          <p style={{ margin: 0 }}>
            📦 {changed.length} document{changed.length === 1 ? '' : 's'} published since your
            last deploy ({lastDeployedAt.toLocaleString()}) — <strong>not live yet</strong>:
          </p>
          <ul style={styles.statusList}>
            {changed.slice(0, MAX_LISTED_CHANGES).map((doc) => (
              <li key={doc._id}>{changeLabel(doc)}</li>
            ))}
            {changed.length > MAX_LISTED_CHANGES && (
              <li>…and {changed.length - MAX_LISTED_CHANGES} more</li>
            )}
          </ul>
        </>
      )}
      <p style={{ margin: '8px 0 0 0' }}>
        <button type="button" style={styles.refresh} onClick={refresh}>Refresh</button>
      </p>
    </div>
  );
}
