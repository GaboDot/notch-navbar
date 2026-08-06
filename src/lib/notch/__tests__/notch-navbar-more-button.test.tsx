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

const sevenTabs: NotchTab[] = Array.from({ length: 7 }, (_, i) => ({
  name: `Tab ${i}`,
  activeIcon: icon(`active-${i}`),
  inactiveIcon: icon(`inactive-${i}`),
}));

const circle = (container: HTMLElement): HTMLDivElement =>
  container.querySelector<HTMLDivElement>('div[style*="will-change"]')!;

/** Expected circle left for a slot at containerWidth=359, 5 bar slots, circleR=28. */
const CW = 359;
const PAD = 8;
const SLOTS = 5;
const CIRCLE_R = 28;
const STEP = (CW - 2 * PAD) / SLOTS;
const slotCenter = (i: number) => PAD + STEP * (i + 0.5);
const slotLeft = (i: number) => slotCenter(i) - CIRCLE_R;

describe('NotchNavbar — More button with notch', () => {
  it('clicking More sets aria-selected=true on More tab and false on previous active', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    const tabs = screen.getAllByRole('tab');
    // Tab 0 is active by default
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[4]).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(tabs[4]); // click More

    const tabsAfter = screen.getAllByRole('tab');
    // More slot now active
    expect(tabsAfter[4]).toHaveAttribute('aria-selected', 'true');
    // Previous active tab deactivated
    expect(tabsAfter[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking More then closing (toggle) reverts notch — previous tab active again', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    const tabs = screen.getAllByRole('tab');
    fireEvent.click(tabs[4]); // open More

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')[4]).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(screen.getAllByRole('tab')[4]); // close via toggle

    // Card closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    // Previous active tab restored
    const tabsAfter = screen.getAllByRole('tab');
    expect(tabsAfter[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabsAfter[4]).toHaveAttribute('aria-selected', 'false');
  });

  it('Escape closes card and reverts notch to previous active tab', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[4]).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking More with non-first active tab reverts to that tab on close', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={sevenTabs}
        containerWidth={359}
        onTabChange={onTabChange}
      />,
    );

    // Switch to Tab 2 first
    fireEvent.click(screen.getAllByRole('tab')[2]);
    expect(onTabChange).toHaveBeenCalledWith(sevenTabs[2], 2);

    // Open More
    fireEvent.click(screen.getAllByRole('tab')[4]);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')[4]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'false');

    // Close via Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    // Tab 2 should be active again
    expect(screen.getAllByRole('tab')[2]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab')[4]).toHaveAttribute('aria-selected', 'false');
  });

  it('selecting hidden tab keeps notch on More (no revert)', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={sevenTabs}
        containerWidth={359}
        onTabChange={onTabChange}
      />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    fireEvent.click(screen.getAllByRole('menuitem')[1]); // select Tab 5

    expect(onTabChange).toHaveBeenCalledWith(sevenTabs[5], 5);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // More tab stays active
    const tabs = screen.getAllByRole('tab');
    expect(tabs[4]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('circle icon: More slot shows moreIcon when moreActive (no hidden tab)', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={359} />,
    );

    const c = circle(container);
    const spans = c.querySelectorAll(':scope > span');

    // Before clicking More: first span active, last (More) not
    expect(spans[0].className).toContain('circleIconActive');
    expect(spans[4].className).not.toContain('circleIconActive');

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More

    const spansAfter = circle(container).querySelectorAll(':scope > span');
    // More slot now active in circle
    expect(spansAfter[4].className).toContain('circleIconActive');
    // Previous tab no longer active in circle
    expect(spansAfter[0].className).not.toContain('circleIconActive');
  });

  it('card is anchored with CSS var (--nn-more-pos) in positionStyle', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    fireEvent.click(screen.getAllByRole('tab')[4]);

    const card = screen.getByRole('menu');
    const style = card.getAttribute('style') ?? '';
    // Horizontal: uses left: var(--nn-more-pos)
    expect(style).toContain('var(--nn-more-pos)');
    expect(style).toContain('translateX(-50%)');
  });

  it('no overflow → More behavior not triggered (regression)', () => {
    const onTabChange = vi.fn();
    render(
      <NotchNavbar
        tabs={sevenTabs.slice(0, 5)}
        containerWidth={390}
        onTabChange={onTabChange}
      />,
    );

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    // No More button
    expect(tabs[4]).toHaveAttribute('aria-label', 'Tab 4');
    expect(tabs[4]).not.toHaveAttribute('aria-haspopup');

    // Clicking last tab works normally
    fireEvent.click(tabs[4]);
    expect(onTabChange).toHaveBeenCalledWith(sevenTabs[4], 4);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

// ─── Vertical card position tests ──────────────────────────────────────────

describe('NotchNavbar — vertical card position', () => {
  const VERTICAL_BAR = 56; // BAR_SIZE_DEFAULT

  it('vertical LTR: card has left = barSize + 8, uses --nn-more-pos + translateY', () => {
    render(
      <NotchNavbar tabs={sevenTabs} containerWidth={359} orientation="vertical" />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More

    const card = screen.getByRole('menu');
    const style = card.getAttribute('style') ?? '';
    expect(style).toContain(`left: ${VERTICAL_BAR + 8}px`);
    expect(style).toContain('var(--nn-more-pos)');
    expect(style).toContain('translateY(-50%)');
    // Must NOT have negative left
    expect(style).not.toContain('left: -');
  });

  it('vertical RTL: card has right = barSize + 8, uses --nn-more-pos + translateY', () => {
    render(
      <NotchNavbar
        tabs={sevenTabs}
        containerWidth={359}
        orientation="vertical"
        dir="rtl"
      />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More

    const card = screen.getByRole('menu');
    const style = card.getAttribute('style') ?? '';
    expect(style).toContain(`right: ${VERTICAL_BAR + 8}px`);
    expect(style).toContain('var(--nn-more-pos)');
    expect(style).toContain('translateY(-50%)');
    // Must NOT have negative right
    expect(style).not.toContain('right: -');
  });

  it('horizontal regression: card still uses left + translateX(-50%)', () => {
    render(<NotchNavbar tabs={sevenTabs} containerWidth={359} />);

    fireEvent.click(screen.getAllByRole('tab')[4]);

    const card = screen.getByRole('menu');
    const style = card.getAttribute('style') ?? '';
    expect(style).toContain('var(--nn-more-pos)');
    expect(style).toContain('translateX(-50%)');
    expect(style).toContain('bottom:');
  });
});

// ─── Circle position tests (imperative style.left) ─────────────────────────

describe('NotchNavbar — circle position after More interactions', () => {
  it('clicking More → circle moves to More slot', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW} />,
    );
    // Initial: circle on slot 0
    expect(circle(container).style.left).toBe(`${slotLeft(0)}px`);

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More

    expect(circle(container).style.left).toBe(`${slotLeft(4)}px`);
  });

  it('toggle-close → circle reverts to original active slot', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW} />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    expect(circle(container).style.left).toBe(`${slotLeft(4)}px`);

    fireEvent.click(screen.getAllByRole('tab')[4]); // toggle close

    expect(circle(container).style.left).toBe(`${slotLeft(0)}px`);
  });

  it('Escape → circle reverts to original active slot', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW} />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    expect(circle(container).style.left).toBe(`${slotLeft(4)}px`);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(circle(container).style.left).toBe(`${slotLeft(0)}px`);
  });

  it('outside click (pointerdown) → circle reverts to original active slot', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW} />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    expect(circle(container).style.left).toBe(`${slotLeft(4)}px`);

    // Simulate pointerdown outside the card (on document body)
    fireEvent.pointerDown(document.body);

    expect(circle(container).style.left).toBe(`${slotLeft(0)}px`);
  });

  it('selecting hidden tab → circle stays on More slot (no revert)', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW} />,
    );

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    fireEvent.click(screen.getAllByRole('menuitem')[2]); // select Tab 6

    expect(circle(container).style.left).toBe(`${slotLeft(4)}px`);
  });

  it('More open from non-first tab, Escape → circle reverts to that tab', () => {
    const { container } = render(
      <NotchNavbar tabs={sevenTabs} containerWidth={CW} />,
    );

    fireEvent.click(screen.getAllByRole('tab')[2]); // activate Tab 2
    expect(circle(container).style.left).toBe(`${slotLeft(2)}px`);

    fireEvent.click(screen.getAllByRole('tab')[4]); // open More
    expect(circle(container).style.left).toBe(`${slotLeft(4)}px`);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(circle(container).style.left).toBe(`${slotLeft(2)}px`);
  });
});
