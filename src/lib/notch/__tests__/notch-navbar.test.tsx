import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('NotchNavbar (smoke)', () => {
  it('renders a tablist with 2 tabs', () => {
    render(<NotchNavbar tabs={tabs} containerWidth={300} />);

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('marks the first tab active by default', () => {
    render(<NotchNavbar tabs={tabs} containerWidth={300} />);

    const tabsEl = screen.getAllByRole('tab');
    expect(tabsEl[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabsEl[0]).toHaveAttribute('tabindex', '0');
    expect(tabsEl[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabsEl[1]).toHaveAttribute('tabindex', '-1');
  });

  it('calls onTabChange with (tab, index) on tab click', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        onTabChange={onTabChange}
      />,
    );

    fireEvent.click(screen.getAllByRole('tab')[1]);

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith(tabs[1], 1);
  });

  it('switches aria-selected after clicking another tab', () => {
    render(<NotchNavbar tabs={tabs} containerWidth={300} />);

    fireEvent.click(screen.getAllByRole('tab')[1]);

    const tabsEl = screen.getAllByRole('tab');
    expect(tabsEl[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabsEl[1]).toHaveAttribute('aria-selected', 'true');
  });
});

// ─── More card (overflow) ─────────────────────────────────────────────────────

const sevenTabs: NotchTab[] = Array.from({ length: 7 }, (_, i) => ({
  name: `Tab ${i}`,
  activeIcon: icon(`active-${i}`),
  inactiveIcon: icon(`inactive-${i}`),
}));

describe('NotchNavbar — More card overflow', () => {
  it('7 tabs + default maxVisible 5 → renders 4 visible + 1 More (5 role="tab")', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    const tabEls = screen.getAllByRole('tab');
    expect(tabEls).toHaveLength(5);
    expect(tabEls[4]).toHaveAttribute('aria-label', 'More');
    expect(tabEls[4]).toHaveAttribute('aria-haspopup', 'menu');
    expect(tabEls[4]).toHaveAttribute('aria-expanded', 'false');
    // First 4 tabs are the real ones, in order
    expect(tabEls[0]).toHaveAttribute('aria-label', 'Tab 0');
    expect(tabEls[3]).toHaveAttribute('aria-label', 'Tab 3');
  });

  it('clicking More opens the card with exactly the 3 hidden tabs', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('tab')[4]);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(screen.getAllByRole('menuitem')[0]).toHaveTextContent('Tab 4');
    expect(screen.getAllByRole('menuitem')[1]).toHaveTextContent('Tab 5');
    expect(screen.getAllByRole('menuitem')[2]).toHaveTextContent('Tab 6');
  });

  it('clicking a hidden item calls onTabChange with the REAL index (item 5 → index 5)', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={sevenTabs}
        containerWidth={359}
        onTabChange={onTabChange}
      />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open card
    fireEvent.click(screen.getAllByRole('menuitem')[1]); // hidden idx 1 → real 5

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith(sevenTabs[5], 5);
    // Card closes after selecting a hidden tab
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('clicking the More tab again toggles the card closed', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    fireEvent.click(screen.getAllByRole('tab')[4]);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('tab')[4]);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('Escape closes the More card', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    fireEvent.click(screen.getAllByRole('tab')[4]);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('custom maxVisible=3 with 5 tabs → 2 visible + 1 More (3 tabs)', () => {
    const fiveTabs = sevenTabs.slice(0, 5);
    render(
      <NotchNavbar tabs={fiveTabs} containerWidth={359} maxVisible={3} />,
    );

    const tabEls = screen.getAllByRole('tab');
    expect(tabEls).toHaveLength(3);
    expect(tabEls[2]).toHaveAttribute('aria-label', 'More');
  });
});

// ─── Overflow slot sizing (bug fix) ─────────────────────────────────────────

describe('NotchNavbar — overflow slot sizing', () => {
  it('6 tabs + maxVisible=5 → renders 5 slots, not 6', () => {
    const sixTabs = sevenTabs.slice(0, 6);
    render(<NotchNavbar tabs={sixTabs} containerWidth={390} />);

    const tabEls = screen.getAllByRole('tab');
    expect(tabEls).toHaveLength(5);
    // Last slot is More
    expect(tabEls[4]).toHaveAttribute('aria-label', 'More');
  });

  it('slot size does NOT change when going from 5 to 6+ tabs (circle stays 56px)', () => {
    // 5 tabs: 5 slots, no More
    const { container: c5, unmount: u5 } = render(
      <NotchNavbar tabs={sevenTabs.slice(0, 5)} containerWidth={390} />,
    );
    const circle5 = c5.querySelector<HTMLDivElement>('div[style*="will-change"]')!;
    const size5 = circle5.style.width;
    u5();

    // 7 tabs: still 5 slots (4 + More)
    const { container: c7 } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={390} />,
    );
    const circle7 = c7.querySelector<HTMLDivElement>('div[style*="will-change"]')!;
    const size7 = circle7.style.width;

    expect(size5).toBe(size7);
    expect(size5).toBe('56px');
  });

  it('selecting hidden tab positions notch on More slot', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={sevenTabs}
        containerWidth={390}
        onTabChange={onTabChange}
      />,
    );

    // Open More, select Tab 6 (hidden idx 2)
    fireEvent.click(screen.getAllByRole('tab')[4]);
    fireEvent.click(screen.getAllByRole('menuitem')[2]);

    expect(onTabChange).toHaveBeenCalledWith(sevenTabs[6], 6);
    // More tab should now be active (aria-selected)
    const tabEls = screen.getAllByRole('tab');
    expect(tabEls[4]).toHaveAttribute('aria-selected', 'true');
  });

  it('maxVisible=3 with 7 tabs → 3 slots (2 visible + More), no shrink', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={390} maxVisible={3} />,
    );

    const tabEls = screen.getAllByRole('tab');
    expect(tabEls).toHaveLength(3);
    expect(tabEls[2]).toHaveAttribute('aria-label', 'More');

    // Circle should be 56px (no shrink with 3 slots)
    const circle = container.querySelector<HTMLDivElement>('div[style*="will-change"]')!;
    expect(circle.style.width).toBe('56px');
  });

  it('no overflow (tabs.length <= maxVisible) → behavior unchanged', () => {
    render(<NotchNavbar tabs={sevenTabs.slice(0, 5)} containerWidth={390} />);

    const tabEls = screen.getAllByRole('tab');
    expect(tabEls).toHaveLength(5);
    // No More button
    expect(tabEls[4]).toHaveAttribute('aria-label', 'Tab 4');
    expect(tabEls[4]).not.toHaveAttribute('aria-haspopup');
  });
});

// ─── Circle icon visibility (More slot bug fix) ───────────────────────────────

describe('NotchNavbar — circle icon visibility (More slot bug)', () => {
  const circle = (container: HTMLElement): HTMLDivElement =>
    container.querySelector<HTMLDivElement>('div[style*="will-change"]')!;

  it('visible tab active (defaultActiveTabIndex=0) → More icon NOT visible in circle; active tab icon IS', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={359} />,
    );

    const c = circle(container);
    const spans = c.querySelectorAll(':scope > span');
    expect(spans).toHaveLength(5);

    // Exactly 1 span has circleIconActive
    const activeSpans = Array.from(spans).filter((s) =>
      s.className.includes('circleIconActive'),
    );
    expect(activeSpans).toHaveLength(1);

    // That active span is the first one (Tab 0), not the last one (More slot)
    expect(spans[0].className).toContain('circleIconActive');
    // More slot (last span) must NOT be active
    expect(spans[4].className).not.toContain('circleIconActive');
  });

  it('hidden tab active (select Tab 6) → More slot icon IS visible in circle', () => {
    const onTabChange = vi.fn();
    const { container } = render(
      <NotchNavbar
        tabs={sevenTabs}
        containerWidth={359}
        onTabChange={onTabChange}
      />,
    );

    // Select hidden Tab 6 via More sheet
    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    fireEvent.click(screen.getAllByRole('menuitem')[2]); // Tab 6

    expect(onTabChange).toHaveBeenCalledWith(sevenTabs[6], 6);

    const c = circle(container);
    const spans = c.querySelectorAll(':scope > span');
    expect(spans).toHaveLength(5);

    // Exactly 1 span has circleIconActive — the More slot (last)
    const activeSpans = Array.from(spans).filter((s) =>
      s.className.includes('circleIconActive'),
    );
    expect(activeSpans).toHaveLength(1);
    expect(spans[4].className).toContain('circleIconActive');
    // First span (Tab 0) must NOT be active
    expect(spans[0].className).not.toContain('circleIconActive');
  });

  it('no overflow (5 tabs) → exactly 1 active icon in circle, no duplicate', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs.slice(0, 5)} containerWidth={390} />,
    );

    const c = circle(container);
    const spans = c.querySelectorAll(':scope > span');
    expect(spans).toHaveLength(5);

    const activeSpans = Array.from(spans).filter((s) =>
      s.className.includes('circleIconActive'),
    );
    expect(activeSpans).toHaveLength(1);
    expect(spans[0].className).toContain('circleIconActive');
  });
});

describe('NotchNavbar — guard', () => {
  it('1 tab → renders "Add at least 2 tabs" status, no tablist', () => {
    render(<NotchNavbar tabs={[sevenTabs[0]]} containerWidth={359} />);

    expect(screen.getByRole('status')).toHaveTextContent('Add at least 2 tabs');
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
