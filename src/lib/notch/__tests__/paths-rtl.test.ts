import { describe, it, expect } from 'vitest';
import {
  barPathV,
  barPathVRTL,
  bevelPathVRTL,
  cutoutBoundaryV,
  cutoutBoundaryVRTL,
} from '../paths';

// ─── SVG path parsing helpers (same as paths.test.ts) ─────────────────────────

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

function expectClose(actual: number, expected: number, tol = 0.01): void {
  expect(Math.abs(actual - expected)).toBeLessThan(tol);
}

/**
 * Arc endpoint of the FIRST `A ${rc} ${rc}` segment.
 * After the arc command the numbers are [rx, ry, rot, laf, sweep, x, y].
 */
function arcEnd(d: string): { x: number; y: number } {
  const idx = d.indexOf('A 35 35');
  const n = numbers(d.slice(idx));
  return { x: n[5], y: n[6] };
}

// ─── Shared geometry ──────────────────────────────────────────────────────────

const V_OPTS = { SH: 400, SW: 56, rc: 35, yc: 6 };
const TY = 100;
const HW0 = Math.sqrt(35 * 35 - 6 * 6); // ~34.4819 — unclamped half-width

// Arc x of the VRTL cutout: bx = yc + rc*sin(phi), phi = asin(6/35) + 4°
const PHI = Math.asin(6 / 35) + (4 * Math.PI) / 180;
const BX = 6 + 35 * Math.sin(PHI); // ~14.39 — bulges RIGHT from x=0

describe('cutoutBoundaryVRTL (vertical-RTL, left edge)', () => {
  const d = cutoutBoundaryVRTL(TY, V_OPTS);

  it('starts with M at x = 0 (left edge junction)', () => {
    const [x, y] = numbers(d).slice(0, 2);
    expect(x).toBe(0);
    expectClose(y, TY - HW0);
  });

  it('contains the cutout arc with sweep 1 (bulges RIGHT into sidebar)', () => {
    expect(d).toContain('A 35 35 0 0 1');
  });

  it('bulges RIGHT: arc x > 0 (cutout sits on the left edge)', () => {
    const { x } = arcEnd(d);
    expect(x).toBeGreaterThan(0);
    expectClose(x, BX);
  });

  it('ends at the bottom-left junction (x = 0)', () => {
    const [x, y] = numbers(d).slice(-2);
    expect(x).toBe(0);
    expectClose(y, TY + HW0);
  });

  it('is an open path (no Z)', () => {
    expect(cmdCount(d, 'Z')).toBe(0);
    expect(cmdCount(d, 'M')).toBe(1);
    expect(cmdCount(d, 'C')).toBe(2);
  });
});

describe('barPathVRTL / bevelPathVRTL (balanced structure)', () => {
  const bar = barPathVRTL(TY, V_OPTS);
  const bevel = bevelPathVRTL(TY, { SH: 400, SW: 56, rc: 35, yc: 6 });

  it('barPathVRTL: starts at the rounded-rect top-left corner (M 0 10)', () => {
    expect(bar.startsWith('M 0 10')).toBe(true);
  });

  it('barPathVRTL: balanced M/Z subpaths + cutout arc with sweep 1', () => {
    expect(cmdCount(bar, 'M')).toBe(2);
    expect(cmdCount(bar, 'M')).toBe(cmdCount(bar, 'Z'));
    expect(cmdCount(bar, 'A')).toBe(5); // 4 rect corners + 1 cutout arc
    expect(cmdCount(bar, 'C')).toBe(2); // cutout fillets
    expect(bar).toContain('A 35 35 0 0 1');
    expect(bar.endsWith('Z')).toBe(true);
  });

  it('bevelPathVRTL: starts at the top-left corner (M 10 0)', () => {
    expect(bevel.startsWith('M 10 0')).toBe(true);
  });

  it('bevelPathVRTL: single open subpath, cutout arc with sweep 1', () => {
    expect(cmdCount(bevel, 'M')).toBe(1);
    expect(cmdCount(bevel, 'Z')).toBe(0);
    expect(cmdCount(bevel, 'C')).toBe(2);
    expect(cmdCount(bevel, 'A')).toBe(3); // corner + cutout + corner
    expect(bevel).toContain('A 35 35 0 0 1');
  });

  it('bevelPathVRTL: ends at the bottom-left corner', () => {
    expect(bevel.endsWith('A 10 10 0 0 0 10 400')).toBe(true);
  });

  it('both deterministic', () => {
    expect(barPathVRTL(TY, V_OPTS)).toBe(barPathVRTL(TY, V_OPTS));
    expect(bevelPathVRTL(TY, { SH: 400, SW: 56, rc: 35, yc: 6 })).toBe(
      bevelPathVRTL(TY, { SH: 400, SW: 56, rc: 35, yc: 6 }),
    );
  });
});

describe('VRTL is the exact mirror of V (left edge ↔ right edge)', () => {
  const v = cutoutBoundaryV(TY, V_OPTS);
  const rtl = cutoutBoundaryVRTL(TY, V_OPTS);

  it('sweep differs: V sweep 0 (bulges left) vs VRTL sweep 1 (bulges right)', () => {
    expect(v).toContain('A 35 35 0 0 0');
    expect(rtl).toContain('A 35 35 0 0 1');
  });

  it('start/end junctions mirror: x: SW ↔ 0, y identical', () => {
    const vStart = numbers(v).slice(0, 2);
    const rStart = numbers(rtl).slice(0, 2);
    expectClose(rStart[0], 56 - vStart[0]);
    expectClose(rStart[1], vStart[1]);

    const vEnd = numbers(v).slice(-2);
    const rEnd = numbers(rtl).slice(-2);
    expectClose(rEnd[0], 56 - vEnd[0]);
    expectClose(rEnd[1], vEnd[1]);
  });

  it('arc endpoints mirror: VRTL arc x = SW - V arc x, y identical', () => {
    const vArc = arcEnd(v);
    const rArc = arcEnd(rtl);
    expectClose(rArc.x, 56 - vArc.x);
    expectClose(rArc.y, vArc.y);
  });

  it('mirror relation holds for the full bar paths (same rect, mirrored cutout)', () => {
    const bar = barPathV(TY, V_OPTS);
    const barRTL = barPathVRTL(TY, V_OPTS);
    // Both share the identical rounded-rect prefix
    expect(barRTL.startsWith(bar.slice(0, 20))).toBe(true);
    // The cutout arc is mirrored: VRTL arc x = SW - V arc x
    const vArc = arcEnd(bar);
    const rArc = arcEnd(barRTL);
    expectClose(rArc.x, 56 - vArc.x);
    expectClose(rArc.y, vArc.y);
  });
});
