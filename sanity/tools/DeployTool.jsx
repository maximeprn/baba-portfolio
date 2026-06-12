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
 * Workflow signals (2026-06-12 audit, H4):
 *   - The last deploy trigger is persisted in localStorage (per browser),
 *     so it survives reloads.
 *   - On load, useDeployStatus lists documents published since that moment
 *     ("you have undeployed changes") and counts in-progress drafts
 *     ("publish before deploying or it won't go live"). UI in
 *     DeployStatus.jsx.
 *   - The success area links straight to Vercel's deployments list. Set
 *     VITE_VERCEL_DEPLOYMENTS_URL for a direct project link; falls back to
 *     the generic dashboard.
 *
 * Security: the Vercel deploy hook URL is bundled into the Studio JS
 * (via VITE_VERCEL_DEPLOY_HOOK_URL). The bundle is technically public
 * (served from /admin before OAuth), so a determined attacker could
 * extract the URL and trigger redeploys at the 60/hour rate limit. The
 * risk is low for a portfolio — no data leak, just a build-quota burn —
 * but if it becomes a problem, swap to a Vercel Function intermediary
 * that checks a session cookie.
 */

import { useState, useCallback } from 'react';
import { useDeployStatus } from './useDeployStatus';
import { DeployStatus } from './DeployStatus';
import { styles } from './deployStyles';

const DEPLOY_HOOK_URL = import.meta.env.VITE_VERCEL_DEPLOY_HOOK_URL;
const DEPLOYMENTS_URL =
  import.meta.env.VITE_VERCEL_DEPLOYMENTS_URL || 'https://vercel.com/dashboard';

const LAST_DEPLOY_KEY = 'baba.lastDeployTriggeredAt';

const readStoredDeployTime = () => {
  try {
    const raw = window.localStorage.getItem(LAST_DEPLOY_KEY);
    const parsed = raw ? new Date(raw) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  } catch {
    return null; // private mode / blocked storage — tracking just disables
  }
};

const storeDeployTime = (date) => {
  try {
    window.localStorage.setItem(LAST_DEPLOY_KEY, date.toISOString());
  } catch {
    /* best-effort */
  }
};

export default function DeployTool() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [lastDeployedAt, setLastDeployedAt] = useState(readStoredDeployTime);
  const deployStatus = useDeployStatus(lastDeployedAt);

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
        'Vercel returned 200 (build hook triggered). NOTE: if a previous build is still running, this trigger may have been silently de-duplicated — confirm a new entry appears within ~30s.',
      );
      const now = new Date();
      setLastDeployedAt(now); // also re-runs the status query via the hook
      storeDeployTime(now);

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
          ? `Cross-origin fetch blocked by your browser before Vercel could respond. The deploy hook may have still been triggered — check the Vercel deployments list to confirm. (Original error: ${err.message})`
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

      <div style={styles.card}>
        <DeployStatus lastDeployedAt={lastDeployedAt} status={deployStatus} />
      </div>

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
          <a href={DEPLOYMENTS_URL} target="_blank" rel="noreferrer" style={{ ...styles.link, fontSize: 13 }}>
            Open Vercel deployments ↗
          </a>
          {lastDeployedAt && (
            <span style={{ ...styles.muted, fontSize: 13 }}>
              Last triggered: {lastDeployedAt.toLocaleString()}
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
