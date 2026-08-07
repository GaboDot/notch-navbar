import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
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
  { name: 'Settings', activeIcon: icon('Settings'), inactiveIcon: icon('settings') },
];

const sevenTabs: NotchTab[] = Array.from({ length: 7 }, (_, i) => ({
  name: `Tab ${i}`,
  activeIcon: icon(`active-${i}`),
  inactiveIcon: icon(`inactive-${i}`),
}));

const circle = (container: HTMLElement): HTMLDivElement =>
  container.querySelector<HTMLDivElement>('div[style*="will-change"]')!;

// Position helpers for 7 tabs at CW=359 (5 slots: 4 visible + More)
const CW7 = 359;
const PAD = 8;
const SLOTS7 = 5;
const CIRCLE_R = 28;
const STEP7 = (CW7 - 2 * PAD) / SLOTS7;
const slotCenter7 = (i: number) => PAD + STEP7 * (i + 0.5);
const slotLeft7 = (i: number) => slotCenter7(i) - CIRCLE_R;

// Position helpers for 3 tabs at CW=300 (3 slots, no overflow)
const CW3 = 300;
const SLOTS3 = 3;
const STEP3 = (CW3 - 2 * PAD) / SLOTS3;
const slotCenter3 = (i: number) => PAD + STEP3 * (i + 0.5);
const slotLeft3 = (i: number) => slotCenter3(i) - CIRCLE_R;

// ─── Uncontrolled mode regression ────────────────────────────────────────

describe('NotchNavbar — uncontrolled mode regression', () => {
  it('renders active tab 0 by default (no activeIndex prop)', () => {
    render(<NotchNavbar tabs={tabs} containerWidth={300} />);
    const tabEls = screen.getAllByRole('tab');
    expect(tabEls[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabEls[0]).toHaveAttribute('tabindex', '0');
    expect(tabEls[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabEls[1]).toHaveAttribute('tabindex', '-1');
  });

  it('defaultActiveTabIndex=1 activates tab 1 (no activeIndex prop)', () => {
    render(<NotchNavbar tabs={tabs} containerWidth={300} defaultActiveTabIndex={1} />);
    const tabEls = screen.getAllByRole('tab');
    expect(tabEls[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabEls[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('click switches active tab and calls onTabChange', () => {
    const onTabChange = vi.fn();
    render(<NotchNavbar tabs={tabs} containerWidth={300} onTabChange={onTabChange} />);

    fireEvent.click(screen.getAllByRole('tab')[2]);

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith(tabs[2], 2);
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('circle moves on click (uncontrolled)', () => {
    const { container } = render(<NotchNavbar tabs={tabs} containerWidth={300} />);
    const initialLeft = circle(container).style.left;

    fireEvent.click(screen.getAllByRole('tab')[1]);

    expect(circle(container).style.left).not.toBe(initialLeft);
  });

  it('More overflow works in uncontrolled mode', () => {
    const onTabChange = vi.fn();
    render(<NotchNavbar tabs={sevenTabs} containerWidth={CW7} onTabChange={onTabChange} />);

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('menuitem')[1]); // select Tab 5
    expect(onTabChange).toHaveBeenCalledWith(sevenTabs[5], 5);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // More tab stays active (hidden tab)
    expect(screen.getAllByRole('tab')[4]).toHaveAttribute('aria-selected', 'true');
  });
});

// ─── Controlled mode: render and rerender ─────────────────────────────────

describe('NotchNavbar — controlled mode: render and rerender', () => {
  it('renders activeIndex=0 correctly', () => {
    const { container } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={0} />,
    );
    const tabEls = screen.getAllByRole('tab');
    expect(tabEls[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabEls[0]).toHaveAttribute('tabindex', '0');
    expect(tabEls[1]).toHaveAttribute('aria-selected', 'false');
    expect(tabEls[1]).toHaveAttribute('tabindex', '-1');
    expect(circle(container).style.left).toBe(`${slotLeft3(0)}px`);
  });

  it('rerender activeIndex 0→2 moves notch and updates aria', () => {
    const { container, rerender } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={0} transitionSpeed={0} />,
    );
    expect(circle(container).style.left).toBe(`${slotLeft3(0)}px`);

    rerender(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={2} transitionSpeed={0} />,
    );

    // ARIA updated
    const tabEls = screen.getAllByRole('tab');
    expect(tabEls[2]).toHaveAttribute('aria-selected', 'true');
    expect(tabEls[2]).toHaveAttribute('tabindex', '0');
    expect(tabEls[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabEls[0]).toHaveAttribute('tabindex', '-1');

    // Circle moved to slot 2
    expect(circle(container).style.left).toBe(`${slotLeft3(2)}px`);
  });

  it('activeIndex out of range is clamped safely', () => {
    const { container } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={99} transitionSpeed={0} />,
    );
    // Clamped to tabs.length - 1 = 2
    const tabEls = screen.getAllByRole('tab');
    expect(tabEls[2]).toHaveAttribute('aria-selected', 'true');
    expect(circle(container).style.left).toBe(`${slotLeft3(2)}px`);
  });

  it('negative activeIndex is clamped to 0', () => {
    const { container } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={-5} transitionSpeed={0} />,
    );
    const tabEls = screen.getAllByRole('tab');
    expect(tabEls[0]).toHaveAttribute('aria-selected', 'true');
    expect(circle(container).style.left).toBe(`${slotLeft3(0)}px`);
  });
});

// ─── Controlled mode: click notifies parent, no internal divergence ──────

describe('NotchNavbar — controlled mode: click behavior', () => {
  it('click calls onTabChange with tab and index', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        activeIndex={0}
        onTabChange={onTabChange}
        transitionSpeed={0}
      />,
    );

    fireEvent.click(screen.getAllByRole('tab')[1]);

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith(tabs[1], 1);
  });

  it('click does NOT change active tab until parent updates activeIndex', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        activeIndex={0}
        onTabChange={onTabChange}
        transitionSpeed={0}
      />,
    );

    fireEvent.click(screen.getAllByRole('tab')[1]);

    // Parent hasn't updated yet — tab 0 still active
    const tabEls = screen.getAllByRole('tab');
    expect(tabEls[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabEls[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('click + parent update = correct final state (simulated controlled flow)', () => {
    const onTabChange = vi.fn();

    // Simulate parent: click → onTabChange → parent sets activeIndex
    const { rerender } = render(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        activeIndex={0}
        onTabChange={onTabChange}
        transitionSpeed={0}
      />,
    );

    fireEvent.click(screen.getAllByRole('tab')[1]);
    expect(onTabChange).toHaveBeenCalledWith(tabs[1], 1);

    // Parent updates activeIndex
    rerender(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        activeIndex={1}
        onTabChange={onTabChange}
        transitionSpeed={0}
      />,
    );

    const tabEls = screen.getAllByRole('tab');
    expect(tabEls[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabEls[0]).toHaveAttribute('aria-selected', 'false');
  });
});

// ─── Controlled mode: external navigation (back/forward) ─────────────────

describe('NotchNavbar — controlled mode: external navigation', () => {
  it('external rerender (simulated back navigation) moves notch', () => {
    const { container, rerender } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={2} transitionSpeed={0} />,
    );
    expect(circle(container).style.left).toBe(`${slotLeft3(2)}px`);

    // Simulate browser back → activeIndex=0
    rerender(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={0} transitionSpeed={0} />,
    );

    expect(circle(container).style.left).toBe(`${slotLeft3(0)}px`);
    const tabEls = screen.getAllByRole('tab');
    expect(tabEls[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabEls[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('multiple sequential external changes update correctly', () => {
    const { container, rerender } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={0} transitionSpeed={0} />,
    );

    // Forward navigation: 0 → 1 → 2 → 1
    rerender(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={1} transitionSpeed={0} />,
    );
    expect(circle(container).style.left).toBe(`${slotLeft3(1)}px`);

    rerender(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={2} transitionSpeed={0} />,
    );
    expect(circle(container).style.left).toBe(`${slotLeft3(2)}px`);

    rerender(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={1} transitionSpeed={0} />,
    );
    expect(circle(container).style.left).toBe(`${slotLeft3(1)}px`);
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
  });
});

// ─── Controlled mode: overflow with hidden tabs ──────────────────────────

describe('NotchNavbar — controlled mode: overflow', () => {
  it('activeIndex on hidden tab → More is the active bar slot', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW7} activeIndex={6} transitionSpeed={0} />,
    );

    // More tab (index 4) is active
    const tabEls = screen.getAllByRole('tab');
    expect(tabEls[4]).toHaveAttribute('aria-selected', 'true');
    expect(tabEls[0]).toHaveAttribute('aria-selected', 'false');

    // Circle on More slot
    expect(circle(container).style.left).toBe(`${slotLeft7(4)}px`);
  });

  it('controlled change from visible to hidden tab', () => {
    const { container, rerender } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW7} activeIndex={0} transitionSpeed={0} />,
    );
    expect(circle(container).style.left).toBe(`${slotLeft7(0)}px`);

    // Switch to hidden tab 6
    rerender(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW7} activeIndex={6} transitionSpeed={0} />,
    );

    expect(circle(container).style.left).toBe(`${slotLeft7(4)}px`);
    expect(screen.getAllByRole('tab')[4]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('controlled change from hidden to visible tab', () => {
    const { container, rerender } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW7} activeIndex={6} transitionSpeed={0} />,
    );
    expect(circle(container).style.left).toBe(`${slotLeft7(4)}px`);

    // Switch back to visible tab 1
    rerender(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW7} activeIndex={1} transitionSpeed={0} />,
    );

    expect(circle(container).style.left).toBe(`${slotLeft7(1)}px`);
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab')[4]).toHaveAttribute('aria-selected', 'false');
  });

  it('controlled: clicking hidden tab calls onTabChange with real index', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={sevenTabs}
        containerWidth={CW7}
        activeIndex={0}
        onTabChange={onTabChange}
        transitionSpeed={0}
      />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    fireEvent.click(screen.getAllByRole('menuitem')[1]); // select Tab 5

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith(sevenTabs[5], 5);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

// ─── Controlled mode: More button behavior preserved ─────────────────────

describe('NotchNavbar — controlled mode: More behavior', () => {
  it('More opens card without calling onTabChange', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={sevenTabs}
        containerWidth={CW7}
        activeIndex={0}
        onTabChange={onTabChange}
        transitionSpeed={0}
      />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('More moves notch to More slot (visual only)', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW7} activeIndex={0} transitionSpeed={0} />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]);

    expect(circle(container).style.left).toBe(`${slotLeft7(4)}px`);
    // More tab has aria-selected=true
    expect(screen.getAllByRole('tab')[4]).toHaveAttribute('aria-selected', 'true');
  });

  it('toggle close More reverts notch to original active slot', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW7} activeIndex={2} transitionSpeed={0} />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    expect(circle(container).style.left).toBe(`${slotLeft7(4)}px`);

    fireEvent.click(screen.getAllByRole('tab')[4]); // toggle close

    expect(circle(container).style.left).toBe(`${slotLeft7(2)}px`);
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab')[4]).toHaveAttribute('aria-selected', 'false');
  });

  it('Escape closes card and reverts notch', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW7} activeIndex={1} transitionSpeed={0} />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(circle(container).style.left).toBe(`${slotLeft7(1)}px`);
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
  });
});

// ─── Controlled mode: no double animation ────────────────────────────────

describe('NotchNavbar — controlled mode: no double animation', () => {
  it('click + immediate parent update animates once (transitionSpeed=0 for determinism)', () => {
    const { container, rerender } = render(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={0} transitionSpeed={0} />,
    );

    const initialLeft = circle(container).style.left;

    // Simulate: click tab 1 → parent immediately updates activeIndex
    fireEvent.click(screen.getAllByRole('tab')[1]);
    rerender(
      <NotchNavbar tabs={tabs} containerWidth={300} activeIndex={1} transitionSpeed={0} />,
    );

    // Circle should be at slot 1, not at slot 0 (would indicate no animation happened)
    // and not at some intermediate position (would indicate double animation)
    expect(circle(container).style.left).toBe(`${slotLeft3(1)}px`);
    expect(circle(container).style.left).not.toBe(initialLeft);
  });
});

// ─── Controlled mode: keyboard navigation ────────────────────────────────

describe('NotchNavbar — controlled mode: keyboard', () => {
  it('ArrowRight calls onTabChange in controlled mode', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        activeIndex={0}
        onTabChange={onTabChange}
        transitionSpeed={0}
      />,
    );

    fireEvent.keyDown(screen.getAllByRole('tab')[0], { key: 'ArrowRight' });

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith(tabs[1], 1);
  });

  it('keyboard + parent update = correct state', () => {
    const onTabChange = vi.fn();
    const { rerender } = render(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        activeIndex={0}
        onTabChange={onTabChange}
        transitionSpeed={0}
      />,
    );

    fireEvent.keyDown(screen.getAllByRole('tab')[0], { key: 'ArrowRight' });
    expect(onTabChange).toHaveBeenCalledWith(tabs[1], 1);

    // Parent updates
    rerender(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        activeIndex={1}
        onTabChange={onTabChange}
        transitionSpeed={0}
      />,
    );

    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
  });
});

// ─── Controlled mode: vertical/RTL ───────────────────────────────────────

describe('NotchNavbar — controlled mode: vertical/RTL', () => {
  it('controlled + vertical: rerender moves notch', () => {
    const { container, rerender } = render(
      <NotchNavbar
        tabs={tabs}
        orientation="vertical"
        containerWidth={56}
        containerHeight={400}
        activeIndex={0}
        transitionSpeed={0}
      />,
    );

    const initialTop = circle(container).style.top;

    rerender(
      <NotchNavbar
        tabs={tabs}
        orientation="vertical"
        containerWidth={56}
        containerHeight={400}
        activeIndex={2}
        transitionSpeed={0}
      />,
    );

    expect(circle(container).style.top).not.toBe(initialTop);
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
  });

  it('controlled + RTL: rerender moves notch', () => {
    const { container, rerender } = render(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        dir="rtl"
        activeIndex={0}
        transitionSpeed={0}
      />,
    );

    const initialLeft = circle(container).style.left;

    rerender(
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        dir="rtl"
        activeIndex={2}
        transitionSpeed={0}
      />,
    );

    expect(circle(container).style.left).not.toBe(initialLeft);
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
  });
});

// ─── Controlled mode: full integration with wrapper component ────────────

describe('NotchNavbar — controlled mode: full integration', () => {
  /** Simulates a parent that manages activeIndex via useState */
  function ControlledWrapper({
    initialIndex = 0,
    onTabChange,
  }: {
    initialIndex?: number;
    onTabChange?: (tab: NotchTab, index: number) => void;
  }) {
    const [idx, setIdx] = useState(initialIndex);
    return (
      <NotchNavbar
        tabs={tabs}
        containerWidth={300}
        activeIndex={idx}
        transitionSpeed={0}
        onTabChange={(tab, index) => {
          setIdx(index);
          onTabChange?.(tab, index);
        }}
      />
    );
  }

  it('full controlled flow: click → parent state → rerender → correct UI', () => {
    const onTabChange = vi.fn();
    const { container } = render(<ControlledWrapper onTabChange={onTabChange} />);

    // Initial: tab 0 active
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
    expect(circle(container).style.left).toBe(`${slotLeft3(0)}px`);

    // Click tab 2
    fireEvent.click(screen.getAllByRole('tab')[2]);

    expect(onTabChange).toHaveBeenCalledWith(tabs[2], 2);

    // After React re-render: tab 2 active, circle moved
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'false');
    expect(circle(container).style.left).toBe(`${slotLeft3(2)}px`);
  });

  it('full controlled flow: multiple clicks update correctly', () => {
    const onTabChange = vi.fn();
    const { container } = render(<ControlledWrapper onTabChange={onTabChange} />);

    fireEvent.click(screen.getAllByRole('tab')[1]);
    expect(circle(container).style.left).toBe(`${slotLeft3(1)}px`);

    fireEvent.click(screen.getAllByRole('tab')[2]);
    expect(circle(container).style.left).toBe(`${slotLeft3(2)}px`);

    fireEvent.click(screen.getAllByRole('tab')[0]);
    expect(circle(container).style.left).toBe(`${slotLeft3(0)}px`);

    expect(onTabChange).toHaveBeenCalledTimes(3);
  });
});
