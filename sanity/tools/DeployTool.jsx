/**
 * Studio "Deploy" tool.
 *
 * Replaces the auto-webhook workflow: instead of every Publish in Studio
 * triggering a Vercel rebuild, Basile clicks Deploy in this tool when he's
 * ready. One button = one deploy.
 *
 * Auto-webhook setup is meant to be DISABLED in Sanity Manage when this
 * tool is in use (otherwise both will fire).
 *
 * Security: the Vercel deploy hook URL is bundled into the Studio JS
 * (via VITE_VERCEL_DEPLOY_HOOK_URL). The bundle is technically public
 * (served from /admin before OAuth), so a determined attacker could
 * extract the URL and trigger redeploys at the 60/hour rate limit. The
 * risk is low for a portfolio — no data leak, just a build-quota burn —
 * but if it becomes a problem, swap to a Vercel Function intermediary
 * that checks a session cookie.
 *
 * Visual style: plain React + Sanity's CSS variables (var(--card-bg-color)
 * etc.) so the tool matches the Studio theme without pulling in @sanity/ui
 * as an extra dependency.
 */

import { useState, useCallback } from 'react';

const DEPLOY_HOOK_URL = import.meta.env.VITE_VERCEL_DEPLOY_HOOK_URL;

const styles = {
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

export default function DeployTool() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [lastDeployedAt, setLastDeployedAt] = useState(null);

  // Vercel's deploy hook dedupes back-to-back triggers when a build is
  // already running. The response is 200 either way (queued OR ignored),
  // so we lock the button for a "cool-down" after each click to make
  // Basile wait for the in-flight build to finish.
  const COOLDOWN_SECONDS = 90;
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const handleDeploy = useCallback(async () => {
    const urlHint = DEPLOY_HOOK_URL
      ? `${new URL(DEPLOY_HOOK_URL).origin}/…${DEPLOY_HOOK_URL.slice(-8)}`
      : '(empty)';

    if (!DEPLOY_HOOK_URL) {
      setStatus('error');
      setMessage(
        'VITE_VERCEL_DEPLOY_HOOK_URL is not set in the JS bundle. Locally: check .env has the line and restart `npm run dev`. In Vercel: confirm the var is set for Production AND trigger one redeploy so the new bundle picks it up.',
      );
      console.warn('[DeployTool] URL is empty:', { urlHint, raw: DEPLOY_HOOK_URL });
      return;
    }
    setStatus('deploying');
    setMessage('');
    console.log('[DeployTool] POST →', urlHint);
    try {
      const response = await fetch(DEPLOY_HOOK_URL, { method: 'POST' });
      console.log('[DeployTool] fetch →', response.status, response.ok ? 'ok' : 'not ok');

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Vercel responded ${response.status}: ${body || 'no body'}`);
      }

      setStatus('success');
      setMessage(
        `Vercel returned 200 (build hook triggered). NOTE: if a previous build is still running, this trigger may have been silently de-duplicated. Watch Vercel → Deployments for a new entry within ~30s.`,
      );
      setLastDeployedAt(new Date());

      // Lock the button for the cool-down so back-to-back clicks don't get
      // silently swallowed by Vercel's dedupe behaviour.
      setCooldownLeft(COOLDOWN_SECONDS);
      const interval = setInterval(() => {
        setCooldownLeft((n) => {
          if (n <= 1) {
            clearInterval(interval);
            setStatus('idle');
            return 0;
          }
          return n - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('[DeployTool] fetch failed →', err);
      setStatus('error');
      const isLikelyCorsBlock =
        err instanceof TypeError && /fetch/i.test(err.message);
      setMessage(
        isLikelyCorsBlock
          ? `Cross-origin fetch blocked by your browser before Vercel could respond. The deploy hook may have still been triggered — check Vercel → Deployments to confirm. (Original error: ${err.message})`
          : `Fetch to ${urlHint} failed: ${err.message || 'Unknown error'}. Common causes: wrong/expired deploy hook URL, an ad-blocker intercepting api.vercel.com, or network issue.`,
      );
    }
  }, []);

  const isDeploying = status === 'deploying';
  const isError = status === 'error';
  const isCoolingDown = cooldownLeft > 0;
  const buttonDisabled = isDeploying || isCoolingDown;
  const buttonLabel = isDeploying
    ? 'Triggering…'
    : isCoolingDown
      ? `Wait ${cooldownLeft}s for current build…`
      : 'Deploy now';

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>🚀 Deploy to production</h1>
      <p style={styles.muted}>
        Push the latest published content to the live site. Each click triggers one Vercel build.
      </p>

      <div style={{ ...styles.card, ...styles.primaryCard }}>
        <p style={{ margin: '0 0 16px 0' }}>
          Click <strong>Deploy now</strong> when you&apos;ve published everything you want to ship.
          Builds usually take 30–90 seconds.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{ ...styles.button, ...(buttonDisabled ? styles.buttonDisabled : null) }}
            onClick={handleDeploy}
            disabled={buttonDisabled}
          >
            {buttonLabel}
          </button>
          {lastDeployedAt && (
            <span style={{ ...styles.muted, fontSize: 13 }}>
              Last triggered: {lastDeployedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
        {message && (
          <div style={isError ? styles.messageError : styles.messageSuccess}>{message}</div>
        )}
      </div>

    </div>
  );
}
