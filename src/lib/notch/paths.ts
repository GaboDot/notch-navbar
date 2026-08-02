/**
 * Pure path generators for NotchNavbar geometry.
 *
 * Every function returns an SVG path `d` string. No DOM, no React, no state.
 * Geometry is a 1:1 translation of the verified mockups:
 *   - notch-navbar-mockup.html  (horizontal)
 *   - notch-sidebar-mockup.html (vertical / mirrored)
 *
 * Key concepts:
 *   - Cutout is a concentric circular arc (rc = circleR + gap) centered at (cx, yc)
 *   - Fillets connect the flat bar edge to the arc via cubic beziers
 *   - phi = alpha + 4° where alpha = asin(yc/rc) — fillet starts just past the tangent
 *   - Vertical paths mirror x → SW-x so cutout sits on the RIGHT (internal) edge
 */

import { CORNER_RADIUS, EXP_O, ARC_TAN } from './constants';

// ─── Horizontal helpers ───────────────────────────────────────────────────────

/**
 * Cutout subpath for HORIZONTAL orientation (top edge).
 *
 * Geometry: fillet (cubic bezier from edge to arc) + concentric arc (sweep=0,
 * bulges DOWN into bar) + mirror fillet. Open path (no Z).
 *
 * @param cx - X center of the active tab
 * @param W  - bar width
 * @param rc - cutout arc radius (= CIRCLE_R + gap)
 * @param yc - Y center of circle relative to bar top edge
 * @param rtl - top-left corner radius (for hw clamping)
 * @param rtr - top-right corner radius (for hw clamping)
 */
function cutoutH(
  cx: number,
  W: number,
  rc: number,
  yc: number,
  rtl: number,
  rtr: number,
): string {
  // Half-width of cutout mouth (clamped so it doesn't enter rounded corners)
  const hw0 = Math.sqrt(rc * rc - yc * yc);
  const hw = Math.min(hw0, cx - rtl, W - rtr - cx);

  // Fillet angle: alpha = angle where arc crosses y=0, phi adds 4° for fillet
  const alpha = Math.asin(yc / rc);
  const phi = alpha + (4 * Math.PI) / 180;
  const s = Math.sin(phi);
  const c = Math.cos(phi);

  // Arc endpoints (where fillets meet the arc)
  const bx = cx - rc * c;   // left point x
  const by = yc + rc * s;   // left point y (= right point y, symmetric)
  const mx = cx + rc * c;   // right point x

  // Tangent direction at arc endpoint
  const tx = s;
  const ty = c;

  // Cubic control points — left fillet
  const p1x = cx - hw + EXP_O * (bx - (cx - hw));  // ctrl1: along edge
  const p2x = bx - ARC_TAN * tx;                     // ctrl2: tangent to arc
  const p2y = by - ARC_TAN * ty;

  // Cubic control points — right fillet (mirror)
  const q1x = mx + ARC_TAN * tx;
  const q1y = by - ARC_TAN * ty;
  const q2x = cx + hw - EXP_O * ((cx + hw) - mx);

  return (
    `M ${cx - hw} 0` +
    ` C ${p1x} 0 ${p2x} ${p2y} ${bx} ${by}` +
    ` A ${rc} ${rc} 0 0 0 ${mx} ${by}` +
    ` C ${q1x} ${q1y} ${q2x} 0 ${cx + hw} 0`
  );
}

// ─── Vertical helpers ─────────────────────────────────────────────────────────

/**
 * Cutout subpath for VERTICAL orientation (right edge, mirrored).
 *
 * Mirror: x → SW - x. Cutout at x=SW, bulges LEFT (into sidebar).
 * Arc sweep=0 (CCW top→bottom = bulges left). Verified with shoelace.
 *
 * @param ty  - Y center of the active tab
 * @param SH  - sidebar height
 * @param SW  - sidebar width
 * @param rc  - cutout arc radius
 * @param yc  - distance from circle center to right edge
 * @param rtr - top-right corner radius (for hw clamping)
 * @param rbr - bottom-right corner radius (for hw clamping)
 */
function cutoutV(
  ty: number,
  SH: number,
  SW: number,
  rc: number,
  yc: number,
  rtr: number,
  rbr: number,
): string {
  const hw0 = Math.sqrt(rc * rc - yc * yc);
  const hw = Math.min(hw0, ty - rtr, SH - rbr - ty);

  const alpha = Math.asin(yc / rc);
  const phi = alpha + (4 * Math.PI) / 180;
  const s = Math.sin(phi);
  const c = Math.cos(phi);

  // Arc endpoints (mirrored x)
  const bx = SW - (yc + rc * s);   // x of arc point (same for top/bottom)
  const byOff = rc * c;             // y offset from ty

  // Control points — top fillet
  const p1y = ty - hw + EXP_O * (hw - rc * c);
  const p2x = bx + ARC_TAN * c;
  const p2y = ty - byOff - ARC_TAN * s;

  // Control points — bottom fillet
  const q1x = bx + ARC_TAN * c;
  const q1y = ty + byOff + ARC_TAN * s;
  const q2y = ty + hw - EXP_O * (hw - rc * c);

  return (
    `M ${SW} ${ty - hw}` +
    ` C ${SW} ${p1y} ${p2x} ${p2y} ${bx} ${ty - byOff}` +
    ` A ${rc} ${rc} 0 0 0 ${bx} ${ty + byOff}` +
    ` C ${q1x} ${q1y} ${SW} ${q2y} ${SW} ${ty + hw}`
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Options shared by horizontal cutout/bevel functions */
interface CutoutHOpts {
  W: number;
  rc: number;
  yc: number;
}

/** Options for horizontal bar path */
interface BarHOpts {
  W: number;
  H: number;
  rc: number;
  yc: number;
  /** Corner radius. Default CORNER_RADIUS */
  r?: number;
}

/** Options for horizontal bevel path */
interface BevelHOpts {
  W: number;
  rc: number;
  yc: number;
  /** Corner radius. Default CORNER_RADIUS */
  r?: number;
}

/** Options shared by vertical cutout/bevel functions */
interface CutoutVOpts {
  SH: number;
  SW: number;
  rc: number;
  yc: number;
}

/** Options for vertical bar path */
interface BarVOpts {
  SH: number;
  SW: number;
  rc: number;
  yc: number;
  /** Corner radius. Default CORNER_RADIUS */
  r?: number;
}

/** Options for vertical bevel path */
interface BevelVOpts {
  SH: number;
  SW: number;
  rc: number;
  yc: number;
  /** Corner radius. Default CORNER_RADIUS */
  r?: number;
}

/**
 * Horizontal cutout boundary (top edge).
 * Open subpath: fillet → arc → fillet. Used by bevelPathH.
 */
export function cutoutBoundaryH(cx: number, opts: CutoutHOpts): string {
  const { W, rc, yc } = opts;
  return cutoutH(cx, W, rc, yc, CORNER_RADIUS, CORNER_RADIUS);
}

/**
 * Horizontal bar path: rounded rect + evenodd cutout.
 * Apply `fill-rule: evenodd` in CSS/SVG to punch the hole.
 */
export function barPathH(cx: number, opts: BarHOpts): string {
  const { W, H, rc, yc, r = CORNER_RADIUS } = opts;

  // Rounded rect (clockwise)
  const rect =
    `M ${r} 0` +
    ` L ${W - r} 0` +
    ` A ${r} ${r} 0 0 1 ${W} ${r}` +
    ` L ${W} ${H - r}` +
    ` A ${r} ${r} 0 0 1 ${W - r} ${H}` +
    ` L ${r} ${H}` +
    ` A ${r} ${r} 0 0 1 0 ${H - r}` +
    ` L 0 ${r}` +
    ` A ${r} ${r} 0 0 1 ${r} 0` +
    ` Z`;

  // Cutout subpath (closed for evenodd)
  const cutout = cutoutH(cx, W, rc, yc, r, r);

  return `${rect} ${cutout} Z`;
}

/**
 * Horizontal bevel path: top edge with cutout (stroke only, no fill).
 * Traces: top-left corner → left edge → cutout → right edge → top-right corner.
 */
export function bevelPathH(cx: number, opts: BevelHOpts): string {
  const { W, rc, yc, r = CORNER_RADIUS } = opts;

  const hw0 = Math.sqrt(rc * rc - yc * yc);
  const hw = Math.min(hw0, cx - r, W - r - cx);
  const cutout = cutoutH(cx, W, rc, yc, r, r);

  return (
    `M 0 ${r}` +
    ` A ${r} ${r} 0 0 1 ${r} 0` +
    ` L ${cx - hw} 0` +
    ` ${cutout}` +
    ` L ${W - r} 0` +
    ` A ${r} ${r} 0 0 1 ${W} ${r}`
  );
}

/**
 * Vertical cutout boundary (right edge, mirrored).
 * Open subpath: fillet → arc → fillet. Used by bevelPathV.
 */
export function cutoutBoundaryV(ty: number, opts: CutoutVOpts): string {
  const { SH, SW, rc, yc } = opts;
  return cutoutV(ty, SH, SW, rc, yc, CORNER_RADIUS, CORNER_RADIUS);
}

/**
 * Vertical bar path: rounded rect + evenodd cutout on right edge.
 * Apply `fill-rule: evenodd` in CSS/SVG to punch the hole.
 */
export function barPathV(ty: number, opts: BarVOpts): string {
  const { SH, SW, rc, yc, r = CORNER_RADIUS } = opts;

  // Rounded rect (clockwise)
  const rect =
    `M 0 ${r}` +
    ` A ${r} ${r} 0 0 1 ${r} 0` +
    ` L ${SW - r} 0` +
    ` A ${r} ${r} 0 0 1 ${SW} ${r}` +
    ` L ${SW} ${SH - r}` +
    ` A ${r} ${r} 0 0 1 ${SW - r} ${SH}` +
    ` L ${r} ${SH}` +
    ` A ${r} ${r} 0 0 1 0 ${SH - r}` +
    ` Z`;

  // Cutout subpath (closed for evenodd)
  const cutout = cutoutV(ty, SH, SW, rc, yc, r, r);

  return `${rect} ${cutout} Z`;
}

/**
 * Vertical bevel path: right edge with cutout (stroke only, no fill).
 * Traces: top-right corner → cutout → bottom-right corner.
 */
export function bevelPathV(ty: number, opts: BevelVOpts): string {
  const { SH, SW, rc, yc, r = CORNER_RADIUS } = opts;

  const hw0 = Math.sqrt(rc * rc - yc * yc);
  const hw = Math.min(hw0, ty - r, SH - r - ty);

  // Inline cutout geometry (same as cutoutV)
  const alpha = Math.asin(yc / rc);
  const phi = alpha + (4 * Math.PI) / 180;
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const bx = SW - (yc + rc * s);
  const byOff = rc * c;
  const p1y = ty - hw + EXP_O * (hw - rc * c);
  const p2x = bx + ARC_TAN * c;
  const p2y = ty - byOff - ARC_TAN * s;
  const q1x = bx + ARC_TAN * c;
  const q1y = ty + byOff + ARC_TAN * s;
  const q2y = ty + hw - EXP_O * (hw - rc * c);

  return (
    `M ${SW - r} 0` +
    ` A ${r} ${r} 0 0 1 ${SW} ${r}` +
    ` L ${SW} ${ty - hw}` +
    ` C ${SW} ${p1y} ${p2x} ${p2y} ${bx} ${ty - byOff}` +
    ` A ${rc} ${rc} 0 0 0 ${bx} ${ty + byOff}` +
    ` C ${q1x} ${q1y} ${SW} ${q2y} ${SW} ${ty + hw}` +
    ` L ${SW} ${SH - r}` +
    ` A ${r} ${r} 0 0 1 ${SW - r} ${SH}`
  );
}

// ─── Vertical RTL helpers (left-edge cutout) ──────────────────────────────────

/**
 * Cutout subpath for VERTICAL-RTL orientation (left edge).
 *
 * Mirror of cutoutV: cutout at x=0, bulges RIGHT (into sidebar).
 * Arc sweep=1 (CW top→bottom = bulges right). Verified with shoelace.
 */
function cutoutVRTL(
  ty: number,
  SH: number,
  SW: number,
  rc: number,
  yc: number,
  rtl: number,
  rbl: number,
): string {
  const hw0 = Math.sqrt(rc * rc - yc * yc);
  const hw = Math.min(hw0, ty - rtl, SH - rbl - ty);

  const alpha = Math.asin(yc / rc);
  const phi = alpha + (4 * Math.PI) / 180;
  const s = Math.sin(phi);
  const c = Math.cos(phi);

  // Arc endpoints (at x = yc + rc*sin(phi), no SW mirror)
  const bx = yc + rc * s;
  const byOff = rc * c;

  // Control points — top fillet
  const p1y = ty - hw + EXP_O * (hw - rc * c);
  const p2x = bx - ARC_TAN * c;
  const p2y = ty - byOff - ARC_TAN * s;

  // Control points — bottom fillet
  const q1x = bx - ARC_TAN * c;
  const q1y = ty + byOff + ARC_TAN * s;
  const q2y = ty + hw - EXP_O * (hw - rc * c);

  return (
    `M 0 ${ty - hw}` +
    ` C 0 ${p1y} ${p2x} ${p2y} ${bx} ${ty - byOff}` +
    ` A ${rc} ${rc} 0 0 1 ${bx} ${ty + byOff}` +
    ` C ${q1x} ${q1y} 0 ${q2y} 0 ${ty + hw}`
  );
}

/** Options for vertical-RTL bar path */
interface BarVRTLOpts {
  SH: number;
  SW: number;
  rc: number;
  yc: number;
  r?: number;
}

/** Options for vertical-RTL bevel path */
interface BevelVRTLOpts {
  SH: number;
  SW: number;
  rc: number;
  yc: number;
  r?: number;
}

/**
 * Vertical-RTL cutout boundary (left edge).
 * Open subpath: fillet → arc → fillet.
 */
export function cutoutBoundaryVRTL(ty: number, opts: { SH: number; SW: number; rc: number; yc: number }): string {
  const { SH, SW, rc, yc } = opts;
  return cutoutVRTL(ty, SH, SW, rc, yc, CORNER_RADIUS, CORNER_RADIUS);
}

/**
 * Vertical-RTL bar path: rounded rect + evenodd cutout on left edge.
 * Apply `fill-rule: evenodd` in CSS/SVG to punch the hole.
 */
export function barPathVRTL(ty: number, opts: BarVRTLOpts): string {
  const { SH, SW, rc, yc, r = CORNER_RADIUS } = opts;

  const rect =
    `M 0 ${r}` +
    ` A ${r} ${r} 0 0 1 ${r} 0` +
    ` L ${SW - r} 0` +
    ` A ${r} ${r} 0 0 1 ${SW} ${r}` +
    ` L ${SW} ${SH - r}` +
    ` A ${r} ${r} 0 0 1 ${SW - r} ${SH}` +
    ` L ${r} ${SH}` +
    ` A ${r} ${r} 0 0 1 0 ${SH - r}` +
    ` Z`;

  const cutout = cutoutVRTL(ty, SH, SW, rc, yc, r, r);

  return `${rect} ${cutout} Z`;
}

/**
 * Vertical-RTL bevel path: left edge with cutout (stroke only, no fill).
 * Traces: top-left corner → cutout → bottom-left corner.
 */
export function bevelPathVRTL(ty: number, opts: BevelVRTLOpts): string {
  const { SH, rc, yc, r = CORNER_RADIUS } = opts;

  const hw0 = Math.sqrt(rc * rc - yc * yc);
  const hw = Math.min(hw0, ty - r, SH - r - ty);

  const alpha = Math.asin(yc / rc);
  const phi = alpha + (4 * Math.PI) / 180;
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const bx = yc + rc * s;
  const byOff = rc * c;
  const p1y = ty - hw + EXP_O * (hw - rc * c);
  const p2x = bx - ARC_TAN * c;
  const p2y = ty - byOff - ARC_TAN * s;
  const q1x = bx - ARC_TAN * c;
  const q1y = ty + byOff + ARC_TAN * s;
  const q2y = ty + hw - EXP_O * (hw - rc * c);

  return (
    `M ${r} 0` +
    ` A ${r} ${r} 0 0 0 0 ${r}` +
    ` L 0 ${ty - hw}` +
    ` C 0 ${p1y} ${p2x} ${p2y} ${bx} ${ty - byOff}` +
    ` A ${rc} ${rc} 0 0 1 ${bx} ${ty + byOff}` +
    ` C ${q1x} ${q1y} 0 ${q2y} 0 ${ty + hw}` +
    ` L 0 ${SH - r}` +
    ` A ${r} ${r} 0 0 0 ${r} ${SH}`
  );
}

/**
 * Compute evenly-spaced tab center positions.
 *
 * Formula: pad + (size - 2*pad) / count * (i + 0.5)
 *
 * Horizontal: size=barWidth, pad=PAD(8)
 * Vertical:   size=barHeight, pad=custom (or use fixed tab layout in component)
 *
 * @param count - number of tabs
 * @param size  - total available dimension (width or height)
 * @param pad   - inset from each edge
 * @returns array of center positions
 */
export function getTabPositions(count: number, size: number, pad: number): number[] {
  const positions: number[] = [];
  const step = (size - 2 * pad) / count;
  for (let i = 0; i < count; i++) {
    positions.push(pad + step * (i + 0.5));
  }
  return positions;
}
