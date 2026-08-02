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
  /** Initially active tab index. Default 0 */
  defaultActiveTabIndex?: number;
  /** Fixed width (horizontal). Omit for fluid + ResizeObserver */
  containerWidth?: number;
  /** Fixed height (vertical). Omit for fluid + ResizeObserver */
  containerHeight?: number;
  /** Bottom inset for horizontal (safe area). Default 0 */
  containerBottomSpace?: number;
  /** Extra className on root element */
  className?: string;
  /**
   * Fixed tab slot size (px). When provided, each tab occupies exactly this
   * width (horizontal) or height (vertical) and gaps are equal between them.
   * When omitted, tabs fill the bar evenly (flex: 1).
   */
  tabSize?: number;
}
