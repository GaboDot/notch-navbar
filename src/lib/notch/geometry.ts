/**
 * Auto-scale geometry for NotchNavbar.
 *
 * When many tabs crowd a small bar, the requested circle (CIRCLE_R=28) would
 * overlap neighboring tabs. These pure helpers clamp circle + gap so the
 * cutout arc always fits inside its own slot:
 *
 *   slot            = (size - 2·pad) / count
 *   effectiveCircleR = max(4, min(circleR, slot/2 - 6))  // floor 4, 6px breathing
 *   effectiveGap     = max(0, min(notchGap, slot/2 - effectiveCircleR))
 *   rc               = effectiveCircleR + effectiveGap   // ≤ slot/2 always
 *
 * No DOM, no React, no state — mirrors the math used by the component.
 */

export interface EffectiveGeometryOptions {
  /** Total available dimension: width (horizontal) or height (vertical) */
  size: number;
  /** Number of bar tab slots. Includes the More button when overflow occurs */
  count: number;
  /** Requested circle radius (= circleSize / 2) */
  circleR: number;
  /** Requested gap between circle edge and cutout arc */
  notchGap: number;
  /** Bar edge inset. Defaults to PAD (8) */
  pad?: number;
}

export interface EffectiveGeometry {
  /** Width/height of a single tab slot */
  slot: number;
  /** Circle radius after the slot-based clamp */
  effectiveCircleR: number;
  /** Gap after the clamp (keeps rc ≤ slot/2) */
  effectiveGap: number;
  /** Circle diameter (2 × effectiveCircleR) — drives --nn-circle-size */
  effectiveCircleSize: number;
  /** Cutout arc radius (= effectiveCircleR + effectiveGap) */
  rc: number;
}

export function computeEffectiveGeometry({
  size,
  count,
  circleR,
  notchGap,
  pad = 8,
}: EffectiveGeometryOptions): EffectiveGeometry {
  const slot = (size - 2 * pad) / count;

  // Keep 6px of clearance on each side of the circle inside the slot; never below 4.
  const effectiveCircleR = Math.max(4, Math.min(circleR, slot / 2 - 6));
  // Clamp the gap so rc never exceeds half the slot; never negative (tiny slots).
  const effectiveGap = Math.max(0, Math.min(notchGap, slot / 2 - effectiveCircleR));
  const effectiveCircleSize = effectiveCircleR * 2;

  return {
    slot,
    effectiveCircleR,
    effectiveGap,
    effectiveCircleSize,
    rc: effectiveCircleR + effectiveGap,
  };
}
