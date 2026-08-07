import type { ReactNode } from 'react';

export type Orientation = 'horizontal' | 'vertical';

export interface NotchTab {
  /** Unique tab identifier */
  name: string;
  /** Icon shown when tab is active (inside circle) */
  activeIcon: ReactNode;
  /** Icon shown when tab is inactive (inside bar) */
  inactiveIcon: ReactNode;
  /** Optional Next.js route — renders <Link> instead of <button> */
  href?: string;
}

export interface NotchNavbarProps {
  /** Tab definitions */
  tabs: NotchTab[];
  /** Callback when active tab changes */
  onTabChange?: (tab: NotchTab, index: number) => void;

  // --- Overflow ---
  /** Max visible tabs in the bar. Extra tabs go into a "More" card. Default 5 */
  maxVisible?: number;
  /** Label for the "More" tab (aria-label). Default "More" */
  moreLabel?: string;
  /** Icon for the "More" tab. Default: inline 3×3 grid SVG */
  moreIcon?: ReactNode;

  // --- Orientation ---
  /** 'horizontal' = bottom bar, 'vertical' = sidebar. Default 'horizontal' */
  orientation?: Orientation;

  // --- Colors (drive component via currentColor) ---
  /** Active icon color. Default '#007AFF' */
  activeIconColor?: string;
  /** Inactive icon color. Default '#6B7280' */
  inactiveIconColor?: string;
  /** Circle fill color. Default '#FFFFFF' */
  circleFillColor?: string;
  /** Bar/sidebar background. Default '#FFFFFF' */
  barBackground?: string;

  // --- Geometry ---
  /** Corner radius for all 4 corners. Default 10 */
  cornerRadius?: number;
  /** Gap between cutout arc and circle (px). Default 7 */
  notchGap?: number;
  /** Circle diameter (px). Default 56 */
  circleSize?: number;
  /** Bar thickness: height (horizontal) or width (vertical). Default 56 */
  barSize?: number;

  // --- Behavior ---
  /** Transition duration in ms. Default 350 */
  transitionSpeed?: number;
  /** Initially active tab index (uncontrolled mode). Default 0 */
  defaultActiveTabIndex?: number;
  /**
   * Controlled active tab index.
   *
   * - **Absent** (default): component is *uncontrolled*. The internal state
   *   starts at `defaultActiveTabIndex` and every click/keyboard activation
   *   updates it directly. `onTabChange` is a notification only.
   *
   * - **Present**: component is *controlled*. The active tab is derived from
   *   this prop. Clicking a tab calls `onTabChange` — the parent is expected
   *   to update `activeIndex` in response. The notch animates when the prop
   *   changes (e.g. browser back/forward, external navigation) without
   *   requiring a remount.
   *
   * If the value is out of range it is clamped to `[0, tabs.length - 1]`.
   */
  activeIndex?: number;
  /** Fixed width (horizontal). Omit for fluid + ResizeObserver */
  containerWidth?: number;
  /** Fixed height (vertical). Omit for fluid + ResizeObserver */
  containerHeight?: number;
  /** Bottom inset for horizontal (safe area). Default 0 */
  containerBottomSpace?: number;
  /** Extra className on root element */
  className?: string;
  // --- RTL ---
  /**
   * Text direction. 'ltr' (default) flows left-to-right; 'rtl' flows
   * right-to-left.
   *
   * **Horizontal**: tabs are visually reversed (first tab on the right) and
   * the notch/circle track the mirrored positions.
   *
   * **Vertical**: the sidebar positions on the **right** side of the viewport
   * and the notch sits on the **left** edge (inner edge) of the sidebar.
   *
   * Icon mirroring is *not* handled here — the consumer decides via CSS
   * `transform: scaleX(-1)` or by providing pre-flipped icons.
   *
   * @default 'ltr'
   */
  dir?: 'ltr' | 'rtl';

  // --- Labels ---
  /**
   * When `true`, each inactive tab shows its `name` as a label below the
   * icon inside the bar. Labels use 10px font, the inactive icon color at
   * reduced opacity, and center-align under the icon.
   *
   * In vertical orientation the label appears below the icon as well.
   *
   * The More-card always shows names regardless of this prop.
   *
   * @default false
   */
  showLabels?: boolean;

  // --- Safe-area (vertical) ---
  /**
   * Extra top inset (px) for the vertical sidebar. Useful for clearing the
   * device status bar or Dynamic Island.
   *
   * When omitted the sidebar starts at `top: 0` (horizontal mode ignores
   * this prop entirely).
   *
   * @default 0
   */
  topSpace?: number;
  /**
   * Extra bottom inset (px) for the vertical sidebar. Useful for clearing
   * the home indicator area on notched phones.
   *
   * When omitted the sidebar ends at `bottom: 0` (horizontal mode ignores
   * this prop entirely).
   *
   * @default 0
   */
  bottomSpace?: number;
}
