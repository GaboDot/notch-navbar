/**
 * NotchNavbar geometry constants.
 * All values derived from verified mockups (notch-navbar-mockup.html, notch-sidebar-mockup.html).
 */

// --- Circle ---
/** Circle diameter in px */
export const CIRCLE_SIZE = 56;
/** Circle radius */
export const CIRCLE_R = CIRCLE_SIZE / 2; // 28

// --- Bar ---
/** Default bar thickness (height for horizontal, width for vertical) */
export const BAR_SIZE_DEFAULT = 56;

// --- Cutout ---
/** Gap between cutout arc and circle edge (px). rc = CIRCLE_R + NOTCH_GAP */
export const NOTCH_GAP = 7;
/** Cutout arc radius: concentric with circle, larger by NOTCH_GAP */
export const RC_DEFAULT = CIRCLE_R + NOTCH_GAP; // 35

// --- Corners ---
/** Border-radius for all 4 bar corners */
export const CORNER_RADIUS = 10;

// --- Fillet ---
/** Fillet angle offset beyond alpha (degrees). phi = alpha + FILET_DEG */
export const FILET_DEG = 4;
/** Control-point ratio along straight segment (0..1). Lower = tighter fillet */
export const EXP_O = 0.35;
/** Tangent length for arc control points */
export const ARC_TAN = 2.0;

// --- Layout ---
/** Horizontal tab inset from bar edges (px) */
export const PAD = 8;

// --- Circle center offset ---
/** yc: distance from circle center to bar's top edge (horizontal) or right edge (vertical) */
export const CENTER_OFFSET = 6;

// --- Animation ---
/** Default transition duration (ms) */
export const DURATION_DEFAULT = 350;

// --- Default colors ---
export const DEFAULT_COLORS = {
  activeIconColor: '#007AFF',
  inactiveIconColor: '#6B7280',
  circleFillColor: '#FFFFFF',
  barBackground: '#FFFFFF',
} as const;
