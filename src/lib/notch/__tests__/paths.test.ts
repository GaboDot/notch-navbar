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
      return [parseFloat(n[0]), parseFloat(n[1])];
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
