import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { NotchNavbar } from '@/components/notch-navbar/notch-navbar';
import type { NotchTab } from '@/lib/notch/types';

// Next.js <Link> is not available in the vitest/jsdom environment.
vi.mock('next/link', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const icon = (label: string) => <span data-testid={`icon-${label}`}>{label}</span>;

const tabs: NotchTab[] = [
  { name: 'Home', activeIcon: icon('Home'), inactiveIcon: icon('home') },
  { name: 'Profile', activeIcon: icon('Profile'), inactiveIcon: icon('profile') },
];

const sevenTabs: NotchTab[] = Array.from({ length: 7 }, (_, i) => ({
  name: `Tab ${i}`,
  activeIcon: icon(`active-${i}`),
  inactiveIcon: icon(`inactive-${i}`),
}));

/**
 * Locate the SVG paths in render order: [barPath, bevel, bevelShadow].
 * The bar path `d` is set by init() on mount (useEffect).
 */
const barPath = (container: HTMLElement): SVGGraphicsElement =>
  container.querySelector<SVGGraphicsElement>('svg path')!;

const bevelPath = (container: HTMLElement): SVGGraphicsElement =>
  container.querySelectorAll<SVGGraphicsElement>('svg path')[1];

/**
 * The notch circle: the only element with an inline `will-change` style.
 * (Class names are CSS-module hashed, so query by style instead.)
 */
const circle = (container: HTMLElement): HTMLDivElement =>
  container.querySelector<HTMLDivElement>('div[style*="will-change"]')!;

const tablist = (container: HTMLElement): HTMLElement =>
  container.querySelector('ul[role="tablist"]')!;

// ─── RTL horizontal ───────────────────────────────────────────────────────────

describe('NotchNavbar — RTL horizontal', () => {
  it('renders dir="rtl" on the root nav', () => {
    const { container } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} dir="rtl" />,
    );
    expect(container.querySelector('nav')).toHaveAttribute('dir', 'rtl');
  });

  it('defaults to dir="ltr" when dir is omitted', () => {
    const { container } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} />,
    );
    expect(container.querySelector('nav')).toHaveAttribute('dir', 'ltr');
  });

  it('mirrors the notch position: first (active) tab sits on the RIGHT side', () => {
    // Positions for 2 tabs @ 300px: LTR [79, 221] → RTL [221, 79].
    // Active tab 0 → circle left = pos - circleR(28).
    const { container, unmount } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} />,
    );
    expect(circle(container).style.left).toBe('51px'); // 79 - 28

    unmount();

    const { container: rtlContainer } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} dir="rtl" />,
    );
    expect(circle(rtlContainer).style.left).toBe('193px'); // 221 - 28
  });

  it('mirrors arrow-key navigation: ArrowLeft moves FORWARD in RTL', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        dir="rtl"
        onTabChange={onTabChange}
      />,
    );

    fireEvent.keyDown(screen.getAllByRole('tab')[0], { key: 'ArrowLeft' });

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith(tabs[1], 1);
    const tabsEl = screen.getAllByRole('tab');
    expect(tabsEl[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabsEl[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('mirrors arrow-key navigation: ArrowRight moves BACKWARD in RTL', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        dir="rtl"
        onTabChange={onTabChange}
      />,
    );

    // Move to tab 1 first, then ArrowRight should go back to tab 0
    fireEvent.keyDown(screen.getAllByRole('tab')[0], { key: 'ArrowLeft' });
    fireEvent.keyDown(screen.getAllByRole('tab')[1], { key: 'ArrowRight' });

    expect(onTabChange).toHaveBeenLastCalledWith(tabs[0], 0);
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('tablist keeps DOM order (aria-labels not reversed) + RTL direction class', () => {
    const { container } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} dir="rtl" />,
    );
    const ul = tablist(container);
    expect(ul.querySelectorAll('[role="tab"]')[0]).toHaveAttribute(
      'aria-label',
      'Home',
    );
    expect(ul.className).toContain('tabsHorizontalRTL');
  });
});

// ─── RTL vertical ─────────────────────────────────────────────────────────────

describe('NotchNavbar — RTL vertical (sidebar on the right)', () => {
  const vProps = {
    tabs,
    orientation: 'vertical' as const,
    containerWidth: 56,
    containerHeight: 400,
  };

  it('positions the sidebar on the RIGHT (style right:0, no left)', () => {
    const { container } = render(<NotchNavbar {...vProps} dir="rtl" />);
    const nav = container.querySelector('nav')!;
    expect(nav.style.right).toBe('0px');
    expect(nav.style.left).toBe('');
    expect(nav.style.width).toBe('56px');
    expect(nav.style.height).toBe('400px');
  });

  it('LTR vertical anchors the sidebar on the LEFT for contrast', () => {
    const { container } = render(<NotchNavbar {...vProps} />);
    const nav = container.querySelector('nav')!;
    expect(nav.style.left).toBe('0px');
    expect(nav.style.right).toBe('');
  });

  it('places the notch on the LEFT (inner) edge in RTL', () => {
    // RTL: circle left = CENTER_OFFSET (6). LTR: left = SW - 6 - 28 = 22.
    const { container, unmount } = render(<NotchNavbar {...vProps} dir="rtl" />);
    expect(circle(container).style.left).toBe('6px');

    unmount();

    const { container: ltrContainer } = render(<NotchNavbar {...vProps} />);
    expect(circle(ltrContainer).style.left).toBe('22px');
  });

  it('uses VRTL paths: cutout on left edge (sweep=1, starts M 0 10)', () => {
    const { container } = render(<NotchNavbar {...vProps} dir="rtl" />);
    const bar = barPath(container).getAttribute('d')!;
    const bevel = bevelPath(container).getAttribute('d')!;

    expect(bar.startsWith('M 0 10')).toBe(true);
    expect(bar).toContain('A 35 35 0 0 1'); // sweep 1 = bulges right into sidebar
    expect(bevel.startsWith('M 10 0')).toBe(true);
    expect(bevel).toContain('A 35 35 0 0 1');
  });

  it('LTR vertical keeps V paths: cutout on right edge (sweep=0)', () => {
    const { container } = render(<NotchNavbar {...vProps} />);
    const bar = barPath(container).getAttribute('d')!;
    expect(bar).toContain('A 35 35 0 0 0');
  });
});

// ─── Labels (showLabels) ──────────────────────────────────────────────────────

describe('NotchNavbar — tab labels (showLabels)', () => {
  it('default (showLabels=false): no label text rendered in the tabs', () => {
    render(<NotchNavbar tabs={tabs} containerWidth={300} />);

    const tabButtons = screen.getAllByRole('tab');
    expect(within(tabButtons[0]).queryByText('Home')).not.toBeInTheDocument();
    expect(within(tabButtons[1]).queryByText('Profile')).not.toBeInTheDocument();
  });

  it('showLabels=true: label text is visible for every tab', () => {
    render(<NotchNavbar tabs={tabs} containerWidth={300} showLabels />);

    const tabButtons = screen.getAllByRole('tab');
    expect(within(tabButtons[0]).getByText('Home')).toBeInTheDocument();
    expect(within(tabButtons[1]).getByText('Profile')).toBeInTheDocument();
  });

  it('showLabels=true in vertical orientation renders labels too', () => {
    render(
      <NotchNavbar
        tabs={tabs}
        orientation="vertical"
        containerWidth={56}
        containerHeight={400}
        showLabels
      />,
    );

    const tabButtons = screen.getAllByRole('tab');
    expect(within(tabButtons[0]).getByText('Home')).toBeInTheDocument();
    expect(within(tabButtons[1]).getByText('Profile')).toBeInTheDocument();
  });

  it('More tab never shows a label, even with showLabels=true', () => {
    render(
      <NotchNavbar tabs={sevenTabs} containerWidth={359} showLabels />,
    );

    const tabButtons = screen.getAllByRole('tab');
    const moreTab = tabButtons[4];
    expect(moreTab).toHaveAttribute('aria-label', 'More');
    // More button has no visible label text (icon only)
    expect(within(moreTab).queryByText('More')).not.toBeInTheDocument();
    // Real visible tabs DO show their labels
    expect(within(tabButtons[0]).getByText('Tab 0')).toBeInTheDocument();
  });
});

// ─── Safe-area (vertical) ─────────────────────────────────────────────────────

describe('NotchNavbar — safe-area top/bottom (vertical)', () => {
  const vProps = {
    tabs,
    orientation: 'vertical' as const,
    containerWidth: 56,
  };

  it('applies topSpace/bottomSpace to the sidebar', () => {
    const { container } = render(
      <NotchNavbar {...vProps} topSpace={80} bottomSpace={40} />,
    );
    const nav = container.querySelector('nav')!;
    expect(nav.style.top).toBe('80px');
    expect(nav.style.bottom).toBe('40px');
    expect(nav.style.width).toBe('56px');
    // inset-based sizing: no fixed height
    expect(nav.style.height).toBe('');
  });

  it('applies the same insets to the tablist (tabsVerticalSafeArea)', () => {
    const { container } = render(
      <NotchNavbar {...vProps} topSpace={80} bottomSpace={40} />,
    );
    const ul = tablist(container);
    expect(ul.style.top).toBe('80px');
    expect(ul.style.bottom).toBe('40px');
    expect(ul.className).toContain('tabsVerticalSafeArea');
  });

  it('zero spaces → sidebar fills top-to-bottom (no insets)', () => {
    const { container } = render(<NotchNavbar {...vProps} containerHeight={400} />);
    const nav = container.querySelector('nav')!;
    expect(nav.style.top).toBe('0px');
    expect(nav.style.bottom).toBe('');
    expect(nav.style.height).toBe('400px');
  });

  it('horizontal IGNORES topSpace/bottomSpace entirely', () => {
    const { container } = render(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        topSpace={80}
        bottomSpace={40}
      />,
    );
    const nav = container.querySelector('nav')!;
    expect(nav.style.top).toBe('');
    expect(nav.style.bottom).toBe('0px'); // bottom: containerBottomSpace default 0
    expect(nav.style.height).toBe('56px');
    expect(nav.style.width).toBe('300px');

    const ul = tablist(container);
    expect(ul.style.top).toBe('');
    expect(ul.style.bottom).toBe('');
  });

  it('horizontal keeps default bottom bar behavior (bottom-anchored)', () => {
    const { container } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} containerBottomSpace={12} />,
    );
    const nav = container.querySelector('nav')!;
    expect(nav.style.bottom).toBe('12px');
    expect(nav.style.top).toBe('');
  });
});
