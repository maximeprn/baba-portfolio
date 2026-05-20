/**
 * Vimeo URL utilities.
 *
 * Editors paste whatever Vimeo hands them in the Share dialog or address bar —
 * almost always a watch-page link like `https://vimeo.com/123456789`. That
 * page is served with `X-Frame-Options: DENY`, so it CANNOT be embedded in an
 * <iframe>; the browser shows "vimeo.com will not allow ... to display the
 * page if another site has embedded it."
 *
 * The embeddable player lives at `https://player.vimeo.com/video/<id>` and
 * sends permissive `frame-ancestors` headers. `toVimeoEmbedUrl` normalises any
 * Vimeo link into that form so the modal iframe always loads, regardless of
 * which URL shape the CMS editor pasted.
 */

/**
 * Parse a Vimeo URL into its numeric video id and optional privacy hash.
 *
 * Handles every Share-dialog and address-bar form:
 *   https://vimeo.com/123456789
 *   https://vimeo.com/123456789?fl=pl&fe=cm       (junk share params)
 *   https://vimeo.com/123456789/abcdef0123        (unlisted — hash in path)
 *   https://vimeo.com/channels/staffpicks/123456789
 *   https://vimeo.com/groups/name/videos/123456789
 *   https://player.vimeo.com/video/123456789
 *   https://player.vimeo.com/video/123456789?h=abcdef0123
 *
 * @param {string} rawUrl - any Vimeo URL
 * @returns {{ id: string, hash: string|null } | null} null if not a Vimeo URL
 */
export function parseVimeoUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') return null;

  let url;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  // Accept `vimeo.com` and any subdomain of it (e.g. `player.vimeo.com`).
  if (!/(^|\.)vimeo\.com$/i.test(url.hostname)) return null;

  // The numeric id is the first path segment that is a run of 6+ digits.
  // This skips path prefixes like `video`, `channels/<name>`, `groups/...`.
  const segments = url.pathname.split('/').filter(Boolean);
  const idIndex = segments.findIndex((seg) => /^\d{6,}$/.test(seg));
  if (idIndex === -1) return null;
  const id = segments[idIndex];

  // Privacy hash for unlisted videos: either the path segment immediately
  // after the id (watch-page form) or the `h` query param (player form).
  const hashFromPath = segments[idIndex + 1];
  const hash =
    url.searchParams.get('h') ||
    (hashFromPath && /^[a-z0-9]+$/i.test(hashFromPath) ? hashFromPath : null);

  return { id, hash };
}

/**
 * Convert any Vimeo URL into an embeddable player URL, merging in optional
 * extra query params (autoplay, title, byline...). The unlisted-video privacy
 * hash, when present, is preserved as the `h` param.
 *
 * @param {string} rawUrl - any Vimeo watch-page or player URL
 * @param {Record<string, string|number>} [params] - extra query params
 * @returns {string|null} embeddable URL, or null if the input isn't a Vimeo link
 */
export function toVimeoEmbedUrl(rawUrl, params = {}) {
  const parsed = parseVimeoUrl(rawUrl);
  if (!parsed) return null;

  const query = new URLSearchParams();
  if (parsed.hash) query.set('h', parsed.hash);
  for (const [key, value] of Object.entries(params)) {
    if (value != null) query.set(key, String(value));
  }

  const qs = query.toString();
  return `https://player.vimeo.com/video/${parsed.id}${qs ? `?${qs}` : ''}`;
}
