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
  it('7 tabs + default maxVisible 5 → renders 5 visible + 1 More (6 role="tab")', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    const tabEls = screen.getAllByRole('tab');
    expect(tabEls).toHaveLength(6);
    expect(tabEls[5]).toHaveAttribute('aria-label', 'More');
    expect(tabEls[5]).toHaveAttribute('aria-haspopup', 'menu');
    expect(tabEls[5]).toHaveAttribute('aria-expanded', 'false');
    // First 5 tabs are the real ones, in order
    expect(tabEls[0]).toHaveAttribute('aria-label', 'Tab 0');
    expect(tabEls[4]).toHaveAttribute('aria-label', 'Tab 4');
  });

  it('clicking More opens the card with exactly the 2 hidden tabs', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('tab')[5]);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    expect(screen.getAllByRole('menuitem')[0]).toHaveTextContent('Tab 5');
    expect(screen.getAllByRole('menuitem')[1]).toHaveTextContent('Tab 6');
  });

  it('clicking a hidden item calls onTabChange with the REAL index (item 6 → index 6)', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={sevenTabs}
        containerWidth={359}
        onTabChange={onTabChange}
      />,
    );

    fireEvent.click(screen.getAllByRole('tab')[5]); // open card
    fireEvent.click(screen.getAllByRole('menuitem')[1]); // hidden idx 1 → real 6

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith(sevenTabs[6], 6);
    // Card closes after selecting a hidden tab
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('clicking the More tab again toggles the card closed', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    fireEvent.click(screen.getAllByRole('tab')[5]);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('tab')[5]);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('Escape closes the More card', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    fireEvent.click(screen.getAllByRole('tab')[5]);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('custom maxVisible=3 with 5 tabs → 3 visible + 1 More (4 tabs)', () => {
    const fiveTabs = sevenTabs.slice(0, 5);
    render(
      <NotchNavbar tabs={fiveTabs} containerWidth={359} maxVisible={3} />,
    );

    const tabEls = screen.getAllByRole('tab');
    expect(tabEls).toHaveLength(4);
    expect(tabEls[3]).toHaveAttribute('aria-label', 'More');
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
