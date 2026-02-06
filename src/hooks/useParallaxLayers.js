/**
 * ============================================================================
 * useParallaxLayers — Cursor-driven parallax for layered elements
 * ============================================================================
 *
 * Extracted from the parallax pattern in HeroSection.jsx.
 * Uses refs for direct DOM updates — no React re-renders per mouse move.
 *
 * Each depth layer gets a different parallax multiplier:
 *   Layer 0 (far):  0.3× — barely moves
 *   Layer 1 (mid):  0.6× — moderate movement
 *   Layer 2 (near): 1.0× — full cursor tracking
 *
 * Disabled on mobile and when prefers-reduced-motion is set.
 *
 * ============================================================================
 */

import { useRef, useEffect, useCallback } from 'react';
import { LAYER_PARALLAX } from '../data/galleryLayout';

// Max cursor offset in pixels (matches HeroSection feel)
const MAX_OFFSET_X = 40;
const MAX_OFFSET_Y = 25;

/**
 * @param {boolean} enabled - Whether parallax should be active
 * @returns {{ layerRefs: React.MutableRefObject<Map>, onMouseMove: function }}
 */
export default function useParallaxLayers(enabled = true) {
  // Map of layer index → array of DOM elements
  const layerElementsRef = useRef(new Map());
  // Current mouse offset (normalized -1 to 1)
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);

  /**
   * Register a DOM element for a given layer.
   * Returns a ref callback suitable for React's ref prop.
   */
  const registerElement = useCallback((layer) => {
    return (el) => {
      if (!layerElementsRef.current.has(layer)) {
        layerElementsRef.current.set(layer, []);
      }
      const arr = layerElementsRef.current.get(layer);
      if (el && !arr.includes(el)) {
        arr.push(el);
      }
    };
  }, []);

  /**
   * Remove all registered elements (called on unmount or re-render cleanup)
   */
  const clearElements = useCallback(() => {
    layerElementsRef.current.clear();
  }, []);

  /**
   * Apply transforms to all registered layer elements
   */
  const applyTransforms = useCallback(() => {
    const { x, y } = mouseRef.current;

    layerElementsRef.current.forEach((elements, layer) => {
      const multiplier = LAYER_PARALLAX[layer] ?? 0;
      const tx = x * MAX_OFFSET_X * multiplier;
      const ty = y * MAX_OFFSET_Y * multiplier;

      elements.forEach((el) => {
        if (el) {
          el.style.transform = `translate(${tx}px, ${ty}px)`;
        }
      });
    });

    rafRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseRef.current.x = (e.clientX - centerX) / centerX;
      mouseRef.current.y = (e.clientY - centerY) / centerY;

      // Coalesce into a single RAF
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(applyTransforms);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, applyTransforms]);

  return { registerElement, clearElements };
}
