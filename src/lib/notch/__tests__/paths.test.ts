import { describe, it, expect } from 'vitest';
import {
  barPathH,
  barPathV,
  bevelPathH,
  bevelPathV,
  cutoutBoundaryH,
  cutoutBoundaryV,
  getTabPositions,
} from '../paths';

// ─── SVG path parsing helpers ─────────────────────────────────────────────────

/** Reduce a path string to its command letters only (e.g. "MLAZMCACZ") */
function commands(d: string): string {
  return d.replace(/\d+\.?\d*/g, ' ').replace(/[-\s,]+/g, '');
}

function cmdCount(d: string, cmd: string): number {
  return (commands(d).match(new RegExp(cmd, 'g')) ?? []).length;
}

/** All numbers in the path, in order */
function numbers(d: string): number[] {
  return (d.match(/-?\d+\.?\d*/g) ?? []).map(Number);
}

/** Start point of each subpath (each "M" segment) */
function subpathStarts(d: string): [number, number][] {
  return d
    .split('M')
    .slice(1)
    .map((seg) => {
      const n = seg.match(/-?\d+\.?\d*/g) ?? [];
      const x = n[0] ? parseFloat(n[0]) : 0;
      const y = n[1] ? parseFloat(n[1]) : 0;
      return [x, y];
    });
}

function expectClose(actual: number, expected: number, tol = 0.01): void {
  expect(Math.abs(actual - expected)).toBeLessThan(tol);
}

// ─── Shared geometry (mockup-verified) ────────────────────────────────────────

const H_OPTS = { W: 359, H: 56, rc: 35, yc: 6, r: 10 };
const V_OPTS = { SH: 400, SW: 56, rc: 35, yc: 6, r: 10 };
const HW0 = Math.sqrt(35 * 35 - 6 * 6); // ~34.4819 — unclamped half-width

describe('barPathH', () => {
  const d = barPathH(180, H_OPTS);

  it('starts with the rounded-rect top-left corner (M 10 0)', () => {
    expect(d.startsWith('M 10 0')).toBe(true);
  });

  it('contains the cutout arc with sweep 0 (A 35 35 0 0 0)', () => {
    expect(d).toContain('A 35 35 0 0 0');
  });

  it('closes with Z', () => {
    expect(d.endsWith('Z')).toBe(true);
  });

  it('has 2 subpaths: bar rect + cutout (M and Z counts)', () => {
    expect(cmdCount(d, 'M')).toBe(2);
    expect(cmdCount(d, 'Z')).toBe(2);
    expect(cmdCount(d, 'C')).toBe(2); // cutout fillets
    expect(cmdCount(d, 'A')).toBe(5); // 4 rect corners + 1 cutout arc
  });

  it('cutout subpath starts at the left junction (cx - hw, 0)', () => {
    const [, cutout] = subpathStarts(d);
    expectClose(cutout[0], 180 - HW0);
    expectClose(cutout[1], 0);
  });

  it('clamps the cutout half-width so it never enters the rounded corners', () => {
    // cx=36 → left clamp is cx - r = 26 → cutout mouth must stay at x >= 10
    const clamped = barPathH(36, H_OPTS);
    const [, cutout] = subpathStarts(clamped);
    expect(cutout[0]).toBeGreaterThanOrEqual(10);
    expectClose(cutout[0], 36 - 26); // hw clamped to 26
  });

  it('is deterministic: same input → identical output', () => {
    expect(barPathH(180, H_OPTS)).toBe(barPathH(180, H_OPTS));
  });
});

describe('cutoutBoundaryH', () => {
  const d = cutoutBoundaryH(180, { W: 359, rc: 35, yc: 6 });

  it('starts with M at the left junction (cx - hw, 0)', () => {
    expect(d.startsWith('M')).toBe(true);
    const [x, y] = numbers(d).slice(0, 2);
    expectClose(x, 180 - HW0);
    expectClose(y, 0);
  });

  it('contains the cutout arc with sweep 0 (bulges down into bar)', () => {
    expect(d).toContain('A 35 35 0 0 0');
  });

  it('ends at the right junction (cx + hw, 0)', () => {
    const [x, y] = numbers(d).slice(-2);
    expectClose(x, 180 + HW0);
    expectClose(y, 0);
  });

  it('is an open path (no Z) — boundary only', () => {
    expect(cmdCount(d, 'Z')).toBe(0);
    expect(cmdCount(d, 'M')).toBe(1);
    expect(cmdCount(d, 'C')).toBe(2);
  });
});

describe('bevelPathH', () => {
  const d = bevelPathH(180, { W: 359, rc: 35, yc: 6 });

  it('starts at the top-left corner (M 0 10)', () => {
    expect(d.startsWith('M 0 10')).toBe(true);
  });

  it('draws a line toward the cutout left junction', () => {
    expect(d).toMatch(/L 145\.5\d*\s+0/);
  });

  it('includes the cutout contour (C fillets + A arc)', () => {
    expect(d).toContain('A 35 35 0 0 0');
    expect(cmdCount(d, 'C')).toBe(2);
  });

  it('ends at the top-right corner (A 10 10 0 0 1 359 10)', () => {
    expect(d.endsWith('A 10 10 0 0 1 359 10')).toBe(true);
  });

  it('is deterministic', () => {
    expect(bevelPathH(180, { W: 359, rc: 35, yc: 6 })).toBe(
      bevelPathH(180, { W: 359, rc: 35, yc: 6 }),
    );
  });
});

describe('cutoutBoundaryV (mirrored)', () => {
  const d = cutoutBoundaryV(100, { SH: 400, SW: 56, rc: 35, yc: 6 });

  it('starts with M at x = SW (right edge junction)', () => {
    const [x, y] = numbers(d).slice(0, 2);
    expectClose(x, 56); // SW
    expectClose(y, 100 - HW0);
  });

  it('contains the cutout arc with sweep 0', () => {
    expect(d).toContain('A 35 35 0 0 0');
  });

  it('bulges LEFT into the sidebar (arc x < SW)', () => {
    const arcIdx = d.indexOf('A 35 35 0 0 0');
    const after = numbers(d.slice(arcIdx));
    const arcX = after[0];
    expect(arcX).toBeLessThan(56); // bx = SW - (yc + rc*sin(phi)) < SW
  });

  it('ends at the bottom-right junction (x = SW)', () => {
    const [x, y] = numbers(d).slice(-2);
    expectClose(x, 56);
    expectClose(y, 100 + HW0);
  });
});

describe('barPathV / bevelPathV (balanced structure)', () => {
  const bar = barPathV(100, V_OPTS);
  const bevel = bevelPathV(100, V_OPTS);

  it('barPathV: balanced M/Z subpaths + cutout arc', () => {
    expect(cmdCount(bar, 'M')).toBe(cmdCount(bar, 'Z'));
    expect(cmdCount(bar, 'M')).toBe(2);
    expect(cmdCount(bar, 'A')).toBe(5);
    expect(cmdCount(bar, 'C')).toBe(2);
    expect(bar).toContain('A 35 35 0 0 0');
    expect(bar.endsWith('Z')).toBe(true);
  });

  it('bevelPathV: single open subpath starting at top-right (M 46 0)', () => {
    expect(bevel.startsWith('M 46 0')).toBe(true);
    expect(cmdCount(bevel, 'M')).toBe(1);
    expect(cmdCount(bevel, 'Z')).toBe(0);
    expect(cmdCount(bevel, 'C')).toBe(2);
    expect(cmdCount(bevel, 'A')).toBe(3); // corner + cutout + corner
    expect(bevel).toContain('A 35 35 0 0 0');
  });

  it('both deterministic', () => {
    expect(barPathV(100, V_OPTS)).toBe(barPathV(100, V_OPTS));
    expect(bevelPathV(100, V_OPTS)).toBe(bevelPathV(100, V_OPTS));
  });
});

describe('getTabPositions', () => {
  it('5 tabs in a 359px bar (PAD 8) — mockup-verified centers', () => {
    const positions = getTabPositions(5, 359, 8);
    expect(positions).toHaveLength(5);
    const expected = [42.3, 110.9, 179.5, 248.1, 316.7];
    positions.forEach((p, i) => {
      expectClose(p, expected[i], 0.5);
    });
  });

  it('5 tabs in a 640px bar (PAD 8)', () => {
    const positions = getTabPositions(5, 640, 8);
    const expected = [70.4, 195.2, 320, 444.8, 569.6];
    positions.forEach((p, i) => {
      expectClose(p, expected[i], 0.5);
    });
  });

  it('single tab centers exactly in the middle', () => {
    const [p] = getTabPositions(1, 359, 8);
    expectClose(p, 179.5, 0.01);
  });

  it('is deterministic', () => {
    expect(getTabPositions(5, 359, 8)).toEqual(getTabPositions(5, 359, 8));
  });
});

// ─── Auto-scale: cutout with reduced rc must fit inside its slot ─────────────
// Component clamps effectiveCircleR/effectiveGap (geometry.ts) so rc ≤ slot/2.
// The cutout mouth (2·hw, hw = sqrt(rc² - yc²)) must then stay within the slot.

describe('reduced rc (auto-scale) — cutout fits in the tab slot', () => {
  // From computeEffectiveGeometry(W=359, PAD=8): 7 tabs → slot 49 / rc 24.5
  const SLOT_7 = 49;
  const RC_7 = 24.5;
  // 10 tabs → slot 34.3 / rc 17.15
  const SLOT_10 = 34.3;
  const RC_10 = 17.15;

  it('barPathH with rc = 24.5 (7 tabs): cutout mouth is smaller than the 49px slot', () => {
    const cx = 180;
    const d = barPathH(cx, { W: 359, H: 56, rc: RC_7, yc: 6, r: 10 });

    const [, cutout] = subpathStarts(d);
    const hw = cx - cutout[0];
    const mouth = 2 * hw;

    expectClose(hw, Math.sqrt(RC_7 ** 2 - 6 ** 2), 0.01);
    expect(mouth).toBeLessThan(SLOT_7);
    expect(d).toContain('A 24.5 24.5 0 0 0');
  });

  it('barPathH with rc = 17.15 (10 tabs): mouth stays inside the 34.3px slot', () => {
    const cx = 180;
    const d = barPathH(cx, { W: 359, H: 56, rc: RC_10, yc: 6, r: 10 });

    const [, cutout] = subpathStarts(d);
    const hw = cx - cutout[0];

    expectClose(hw, Math.sqrt(RC_10 ** 2 - 6 ** 2), 0.01);
    expect(2 * hw).toBeLessThan(SLOT_10);
  });

  it('bevelPathH with rc = 24.5: left junction stays inside the slot bounds', () => {
    const cx = 180;
    const d = bevelPathH(cx, { W: 359, rc: RC_7, yc: 6 });

    const m = d.match(/L (\d+\.?\d*) 0/);
    const leftJunction = m ? parseFloat(m[1]) : 0;
    const hw = cx - leftJunction;

    expectClose(hw, Math.sqrt(RC_7 ** 2 - 6 ** 2), 0.01);
    expect(2 * hw).toBeLessThan(SLOT_7);
    expect(d).toContain('A 24.5 24.5 0 0 0');
  });

  it('rc is always ≤ slot/2 across counts → mouth ≤ slot (no neighbor overlap)', () => {
    // Structural check on the geometry contract, not the component.
    for (const [slot, rc] of [
      [68.6, 34.3], // 5 tabs
      [49, 24.5], // 7 tabs
      [34.3, 17.15], // 10 tabs
    ]) {
      expect(rc).toBeLessThanOrEqual(slot / 2 + 1e-9);
      const hw = Math.sqrt(rc ** 2 - 6 ** 2);
      expect(2 * hw).toBeLessThanOrEqual(slot);
    }
  });
});
