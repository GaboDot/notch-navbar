import { describe, it, expect } from 'vitest';
import { computeEffectiveGeometry } from '../geometry';

// Shared geometry — mirrors constants.ts defaults
const PAD = 8;
const CIRCLE_R = 28; // CIRCLE_SIZE / 2
const NOTCH_GAP = 7;
const W = 359;

describe('computeEffectiveGeometry — auto-scale', () => {
  it('count 5 (W=359): circle fits unchanged (effR = 28), gap clamps to 6.3', () => {
    const g = computeEffectiveGeometry({
      size: W,
      count: 5,
      circleR: CIRCLE_R,
      notchGap: NOTCH_GAP,
      pad: PAD,
    });

    expect(g.slot).toBeCloseTo(68.6, 3); // (359 - 16) / 5
    expect(g.effectiveCircleR).toBe(CIRCLE_R); // min(28, 34.3 - 6) → no shrink
    expect(g.effectiveGap).toBeCloseTo(6.3, 3); // min(7, 34.3 - 28)
    expect(g.effectiveCircleSize).toBe(56);
    expect(g.rc).toBeCloseTo(34.3, 3); // 28 + 6.3 ≤ slot/2
  });

  it('count 7 (W=359): circle shrinks to 18.5, gap to 6 → rc = 24.5 fits the slot', () => {
    const g = computeEffectiveGeometry({
      size: W,
      count: 7,
      circleR: CIRCLE_R,
      notchGap: NOTCH_GAP,
      pad: PAD,
    });

    expect(g.slot).toBeCloseTo(49, 3); // (359 - 16) / 7
    expect(g.effectiveCircleR).toBeCloseTo(18.5, 3); // min(28, 24.5 - 6)
    expect(g.effectiveGap).toBe(6); // min(7, 24.5 - 18.5)
    expect(g.effectiveCircleSize).toBeCloseTo(37, 3);
    expect(g.rc).toBeCloseTo(24.5, 3); // cutout arc ≤ slot/2 (49/2 = 24.5)
  });

  it('count 10 (W=359): circle shrinks further to 11.15 → rc = 17.15', () => {
    const g = computeEffectiveGeometry({
      size: W,
      count: 10,
      circleR: CIRCLE_R,
      notchGap: NOTCH_GAP,
      pad: PAD,
    });

    expect(g.slot).toBeCloseTo(34.3, 3); // (359 - 16) / 10
    expect(g.effectiveCircleR).toBeCloseTo(11.15, 3); // min(28, 17.15 - 6)
    expect(g.effectiveGap).toBe(6); // min(7, 17.15 - 11.15)
    expect(g.effectiveCircleSize).toBeCloseTo(22.3, 3);
    expect(g.rc).toBeCloseTo(17.15, 3); // ≤ slot/2 (17.15)
  });

  it('large slot + small circle: gap stays at notchGap (7), no clamp', () => {
    const g = computeEffectiveGeometry({
      size: W,
      count: 5,
      circleR: 20, // smaller than the 28 default → plenty of room
      notchGap: NOTCH_GAP,
      pad: PAD,
    });

    expect(g.effectiveCircleR).toBe(20);
    expect(g.effectiveGap).toBe(NOTCH_GAP); // min(7, 34.3 - 20) = 7
    expect(g.rc).toBe(27);
  });

  it('invariants hold for counts 5/7/10: effR ≤ circleR, gap ≤ notchGap, rc ≤ slot/2', () => {
    for (const count of [5, 7, 10]) {
      const g = computeEffectiveGeometry({
        size: W,
        count,
        circleR: CIRCLE_R,
        notchGap: NOTCH_GAP,
        pad: PAD,
      });

      expect(g.effectiveCircleR).toBeLessThanOrEqual(CIRCLE_R);
      expect(g.effectiveGap).toBeLessThanOrEqual(NOTCH_GAP);
      expect(g.rc).toBeCloseTo(g.effectiveCircleR + g.effectiveGap, 9);
      expect(g.effectiveCircleSize).toBeCloseTo(g.effectiveCircleR * 2, 9);
      // Cutout arc never exceeds half the slot → the notch can't overlap neighbors
      expect(g.rc).toBeLessThanOrEqual(g.slot / 2 + 1e-9);
    }
  });

  it('vertical orientation: uses height as size (same math)', () => {
    const g = computeEffectiveGeometry({
      size: 400,
      count: 7,
      circleR: CIRCLE_R,
      notchGap: NOTCH_GAP,
      pad: PAD,
    });

    expect(g.slot).toBeCloseTo((400 - 2 * PAD) / 7, 6);
    expect(g.effectiveCircleR).toBeCloseTo(Math.min(CIRCLE_R, (400 - 2 * PAD) / 7 / 2 - 6), 3);
    expect(g.rc).toBeLessThanOrEqual(g.slot / 2 + 1e-9);
  });

  it('defaults pad to PAD (8)', () => {
    const withDefault = computeEffectiveGeometry({
      size: W,
      count: 5,
      circleR: CIRCLE_R,
      notchGap: NOTCH_GAP,
    });
    const explicit = computeEffectiveGeometry({
      size: W,
      count: 5,
      circleR: CIRCLE_R,
      notchGap: NOTCH_GAP,
      pad: PAD,
    });

    expect(withDefault).toEqual(explicit);
  });

  it('custom pad (vertical sidebar): slot uses the given inset', () => {
    const g = computeEffectiveGeometry({
      size: 640,
      count: 6,
      circleR: CIRCLE_R,
      notchGap: NOTCH_GAP,
      pad: 12,
    });

    expect(g.slot).toBeCloseTo((640 - 24) / 6, 6);
  });
});
