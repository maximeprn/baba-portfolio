/**
 * Shared inline styles for the Studio Deploy tool (DeployTool + DeployStatus).
 *
 * Plain React style objects + Sanity's CSS variables (var(--card-bg-color)
 * etc.) so the tool matches the Studio theme without pulling in @sanity/ui
 * as an extra dependency. Lives in its own module so the component files
 * only export components (react-refresh/only-export-components).
 */

export const styles = {
  page: {
    padding: '32px',
    maxWidth: 720,
    margin: '0 auto',
    fontFamily: 'inherit',
    color: 'var(--card-fg-color, #fff)',
  },
  h1: { margin: '0 0 8px 0', fontSize: 28, fontWeight: 600 },
  muted: { color: 'var(--card-muted-fg-color, #b3b3b3)', margin: 0 },
  card: {
    background: 'var(--card-bg-color, #1c1c1f)',
    border: '1px solid var(--card-border-color, #2e2e33)',
    borderRadius: 8,
    padding: 24,
    marginTop: 24,
  },
  primaryCard: {
    borderColor: 'var(--brand-primary, #156dff)',
  },
  button: {
    background: 'var(--brand-primary, #156dff)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 150ms',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  link: {
    color: 'var(--brand-primary, #156dff)',
    textDecoration: 'underline',
  },
  statusList: { margin: '8px 0 0 0', paddingLeft: 20, fontSize: 13, lineHeight: 1.7 },
  refresh: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: 13,
    color: 'var(--card-muted-fg-color, #b3b3b3)',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  messageError: {
    background: 'var(--card-tone-critical-bg-color, #3a0a0a)',
    border: '1px solid var(--card-tone-critical-border-color, #6a1a1a)',
    color: 'var(--card-tone-critical-fg-color, #ff8080)',
    padding: 12,
    borderRadius: 6,
    fontSize: 13,
    marginTop: 12,
  },
  messageSuccess: {
    background: 'var(--card-tone-positive-bg-color, #0a3a1a)',
    border: '1px solid var(--card-tone-positive-border-color, #1a6a3a)',
    color: 'var(--card-tone-positive-fg-color, #80ff80)',
    padding: 12,
    borderRadius: 6,
    fontSize: 13,
    marginTop: 12,
  },
};
