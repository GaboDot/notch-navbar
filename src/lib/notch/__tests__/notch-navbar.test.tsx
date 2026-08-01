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
