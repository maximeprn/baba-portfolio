/**
 * AnchorMiniMapInput — custom Studio input for the hero-overlay `anchor`
 * field (audit 2026-06-12, L3).
 *
 * Replaces the blind dropdown with a clickable 2×3 mini-map shaped like the
 * hero screen, so Basile places text spatially instead of decoding
 * "middle-right" in his head. The stored value is unchanged (the same
 * 'top-left' … 'bottom-right' strings), so validation, previews and the
 * renderer are untouched.
 *
 * Center anchors are deliberately absent — overlay text is never centered
 * (see heroOverlay.js).
 *
 * Styling: plain inline styles + Sanity CSS variables, same approach as the
 * Deploy tool — no extra UI dependency.
 */

import { useCallback } from 'react';
import { set } from 'sanity';

const ROWS = [
  ['top-left', 'top-right'],
  ['middle-left', 'middle-right'],
  ['bottom-left', 'bottom-right'],
];

const LABELS = {
  'top-left': 'Top left',
  'top-right': 'Top right',
  'middle-left': 'Middle left',
  'middle-right': 'Middle right',
  'bottom-left': 'Bottom left',
  'bottom-right': 'Bottom right',
};

const styles = {
  frame: {
    // A miniature of the hero viewport: 16:9-ish, screen-like border.
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr 1fr',
    gap: 6,
    padding: 8,
    maxWidth: 420,
    aspectRatio: '16 / 7',
    background: 'var(--card-bg-color, #101012)',
    border: '1px solid var(--card-border-color, #2e2e33)',
    borderRadius: 8,
  },
  cell: (selected, readOnly, alignRight) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: alignRight ? 'flex-end' : 'flex-start',
    padding: '4px 10px',
    fontSize: 12,
    lineHeight: 1.2,
    textAlign: alignRight ? 'right' : 'left',
    borderRadius: 5,
    border: selected
      ? '1px solid var(--brand-primary, #156dff)'
      : '1px dashed var(--card-border-color, #2e2e33)',
    background: selected ? 'var(--brand-primary, #156dff)' : 'transparent',
    color: selected ? '#fff' : 'var(--card-muted-fg-color, #b3b3b3)',
    fontWeight: selected ? 600 : 400,
    cursor: readOnly ? 'not-allowed' : 'pointer',
    opacity: readOnly && !selected ? 0.5 : 1,
    transition: 'background 120ms, color 120ms, border-color 120ms',
  }),
};

export default function AnchorMiniMapInput(props) {
  const { value, onChange, readOnly, elementProps } = props;

  const handlePick = useCallback(
    (anchor) => {
      if (readOnly || anchor === value) return;
      onChange(set(anchor));
    },
    [onChange, readOnly, value],
  );

  return (
    <div
      {...elementProps}
      role="radiogroup"
      aria-label="Position on the hero screen"
      style={styles.frame}
    >
      {ROWS.flat().map((anchor) => {
        const selected = value === anchor;
        const alignRight = anchor.endsWith('right');
        return (
          <button
            key={anchor}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={readOnly}
            onClick={() => handlePick(anchor)}
            style={styles.cell(selected, readOnly, alignRight)}
          >
            {LABELS[anchor]}
          </button>
        );
      })}
    </div>
  );
}
