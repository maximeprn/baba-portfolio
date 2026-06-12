/**
 * useDeployStatus — data side of the Studio Deploy tool.
 *
 * Answers two questions the deploy workflow makes invisible:
 *   1. "Do I have unpublished drafts?"  (publishing ≠ saving)
 *   2. "What have I published since my last deploy?"  (publishing ≠ live)
 *
 * Uses the Studio's authenticated client (`useClient`), so it sees exactly
 * what the logged-in editor sees. `lastDeployedAt` comes from localStorage
 * in DeployTool — per-browser, best-effort tracking.
 */

import { useCallback, useEffect, useState } from 'react';
import { useClient } from 'sanity';

// Keep in sync with the schema types in sanity/schemas/index.js AND the
// Sanity webhook GROQ filter (see CLAUDE.md → "Sanity webhook config").
export const CONTENT_TYPES = [
  'siteSettings',
  'heroOverlay',
  'showreel',
  'heroPhotos',
  'photoProject',
  'film',
];

// Published docs changed after `since`, newest first, plus the count of
// in-progress drafts. `coalesce(title, text, _type)` covers singletons that
// have no title field.
const CHANGED_QUERY = `{
  "changed": *[_type in $types && !(_id in path("drafts.**")) && _updatedAt > $since]
    | order(_updatedAt desc) { _id, _type, _updatedAt, "title": coalesce(title, _type) },
  "draftCount": count(*[_type in $types && _id in path("drafts.**")])
}`;

// No deploy recorded yet → only the drafts count is meaningful.
const DRAFTS_ONLY_QUERY = `{
  "changed": [],
  "draftCount": count(*[_type in $types && _id in path("drafts.**")])
}`;

export function useDeployStatus(lastDeployedAt) {
  const client = useClient({ apiVersion: '2024-12-01' });
  const [state, setState] = useState({
    loading: true,
    error: null,
    changed: [],
    draftCount: 0,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const since = lastDeployedAt ? lastDeployedAt.toISOString() : null;
      const result = since
        ? await client.fetch(CHANGED_QUERY, { types: CONTENT_TYPES, since })
        : await client.fetch(DRAFTS_ONLY_QUERY, { types: CONTENT_TYPES });
      setState({
        loading: false,
        error: null,
        changed: result?.changed ?? [],
        draftCount: result?.draftCount ?? 0,
      });
    } catch (err) {
      // Status is a convenience — never block the deploy button on it.
      console.warn('[DeployTool] status query failed →', err);
      setState((s) => ({ ...s, loading: false, error: err?.message || 'Status query failed' }));
    }
  }, [client, lastDeployedAt]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
