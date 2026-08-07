import { describe, it, expect } from 'vitest';
import { barPathH, barPathV, barPathVRTL, bevelPathH, bevelPathV, bevelPathVRTL } from '../paths';

// Caso degenerado: yc > rc (circulo no cabe en la barra) — solia generar NaN
describe('NaN guard regression (yc > rc)', () => {
  const paths = [
    barPathH(100, { W: 300, H: 60, rc: 30, yc: 40 }),          // yc(40) > rc(30)
    barPathV(100, { SH: 400, SW: 62, rc: 30, yc: 40 }),
    barPathVRTL(100, { SH: 400, SW: 62, rc: 30, yc: 40 }),
    bevelPathH(100, { W: 300, rc: 30, yc: 40 }),
    bevelPathV(100, { SH: 400, SW: 62, rc: 30, yc: 40 }),
    bevelPathVRTL(100, { SH: 400, SW: 62, rc: 30, yc: 40 }),
  ];

  it('no emite NaN en ningun path', () => {
    for (const p of paths) {
      expect(p).not.toMatch(/NaN/);
    }
  });

  it('emite numeros finitos', () => {
    for (const p of paths) {
      const nums = p.match(/-?\d+(\.\d+)?/g) || [];
      for (const n of nums) {
        expect(Number.isFinite(Number(n))).toBe(true);
      }
    }
  });
});
