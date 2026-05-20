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
  cautionCard: {
    background: 'var(--card-tone-caution-bg-color, #3a2a08)',
    borderColor: 'var(--card-tone-caution-border-color, #6a4a10)',
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
  link: { color: 'inherit', textDecoration: 'underline' },
};

export default function DeployTool() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [lastDeployedAt, setLastDeployedAt] = useState(null);

  const handleDeploy = useCallback(async () => {
    if (!DEPLOY_HOOK_URL) {
      setStatus('error');
      setMessage(
        'VITE_VERCEL_DEPLOY_HOOK_URL is not set. Add it to your Vercel project env vars (Settings → Environment Variables) and trigger one rebuild so the Studio bundle picks it up.',
      );
      return;
    }
    setStatus('deploying');
    setMessage('');
    try {
      const response = await fetch(DEPLOY_HOOK_URL, { method: 'POST' });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Vercel responded ${response.status}: ${body || 'no body'}`);
      }
      setStatus('success');
      setMessage('Vercel build queued. Check Vercel → Deployments for progress.');
      setLastDeployedAt(new Date());
      setTimeout(() => setStatus('idle'), 8000);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Unknown error');
    }
  }, []);

  const isDeploying = status === 'deploying';
  const isError = status === 'error';
  const isSuccess = status === 'success';

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
            style={{ ...styles.button, ...(isDeploying ? styles.buttonDisabled : null) }}
            onClick={handleDeploy}
            disabled={isDeploying}
          >
            {isDeploying ? 'Triggering…' : isSuccess ? '✓ Deploy triggered' : 'Deploy now'}
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

      <div style={{ ...styles.card, ...styles.cautionCard }}>
        <h2 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
          ⚠ Auto-webhook reminder
        </h2>
        <p style={{ ...styles.muted, marginBottom: 8 }}>
          This tool is designed to <strong>replace</strong> the auto-webhook in Sanity Manage. If
          both are active, every Publish triggers a deploy AND clicking here triggers a second one.
        </p>
        <p style={styles.muted}>
          To use only manual deploys, go to{' '}
          <a
            href="https://www.sanity.io/manage/project/e9pgmdfm/api/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            Sanity Manage → API → Webhooks
          </a>{' '}
          and toggle the webhook <strong>disabled</strong>.
        </p>
      </div>
    </div>
  );
}
