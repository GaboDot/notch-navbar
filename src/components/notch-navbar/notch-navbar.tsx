'use client';

import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import Link from 'next/link';
import type { NotchNavbarProps } from '@/lib/notch/types';
import {
  barPathH,
  barPathV,
  bevelPathH,
  bevelPathV,
  getTabPositions,
} from '@/lib/notch/paths';
import {
  CENTER_OFFSET,
  PAD,
  DURATION_DEFAULT,
  BAR_SIZE_DEFAULT,
  CIRCLE_SIZE,
  NOTCH_GAP,
  CORNER_RADIUS,
  DEFAULT_COLORS,
} from '@/lib/notch/constants';
import styles from './notch-navbar.module.scss';

/* ── Stable callback ref (React 19 compatible) ─────────────────────── */

function useStableCallback<T extends (...args: never[]) => void>(cb?: T): T {
  const ref = useRef(cb);
  useLayoutEffect(() => {
    ref.current = cb;
  });
  return useCallback((...args: Parameters<T>) => {
    ref.current?.(...args);
  }, []) as T;
}

/* ── Easing ────────────────────────────────────────────────────────── */

function easeExpoOut(t: number): number {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}

/* ── Component ─────────────────────────────────────────────────────── */

export function NotchNavbar({
  tabs,
  onTabChange,
  orientation = 'horizontal',
  activeIconColor = DEFAULT_COLORS.activeIconColor,
  inactiveIconColor = DEFAULT_COLORS.inactiveIconColor,
  circleFillColor = DEFAULT_COLORS.circleFillColor,
  barBackground = DEFAULT_COLORS.barBackground,
  cornerRadius = CORNER_RADIUS,
  notchGap = NOTCH_GAP,
  circleSize = CIRCLE_SIZE,
  barSize = BAR_SIZE_DEFAULT,
  transitionSpeed = DURATION_DEFAULT,
  defaultActiveTabIndex = 0,
  containerWidth,
  containerHeight,
  containerBottomSpace = 0,
  className,
  tabSize,
}: NotchNavbarProps) {
  const isHorizontal = orientation === 'horizontal';
  const circleR = circleSize / 2;

  /* ── Refs ──────────────────────────────────────────────────────── */

  const containerRef = useRef<HTMLDivElement>(null);
  const barPathRef = useRef<SVGPathElement>(null);
  const bevelRef = useRef<SVGPathElement>(null);
  const bevelShadowRef = useRef<SVGPathElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* ── State ─────────────────────────────────────────────────────── */

  const [containerW, setContainerW] = useState(containerWidth ?? 390);
  const [containerH, setContainerH] = useState(containerHeight ?? barSize);
  const [activeIndex, setActiveIndex] = useState(
    Math.min(defaultActiveTabIndex, tabs.length - 1),
  );

  /* ── Refs for animation ───────────────────────────────────────── */

  const animatingRef = useRef(false);
  const currentPosRef = useRef(0);
  const activeIndexRef = useRef(activeIndex);

  useLayoutEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  /* ── Stable onTabChange ───────────────────────────────────────── */

  const stableOnTabChange = useStableCallback(onTabChange);

  /* ── Reduced motion ───────────────────────────────────────────── */

  const reducedMotionRef = useRef(false);

  /* ── Tab positions ────────────────────────────────────────────── */

  const tabPositionsRef = useRef<number[]>([]);

  const computePositions = useCallback(
    (size: number): number[] => {
      if (tabSize) {
        const count = tabs.length;
        const totalTabs = count * tabSize;
        const gap = count > 1 ? (size - 2 * PAD - totalTabs) / (count - 1) : 0;
        const positions: number[] = [];
        for (let i = 0; i < count; i++) {
          positions.push(PAD + tabSize * (i + 0.5) + gap * i);
        }
        return positions;
      }
      return getTabPositions(tabs.length, size, PAD);
    },
    [tabSize, tabs.length],
  );

  /* ── Render path + circle ─────────────────────────────────────── */

  const render = useCallback(
    (pos: number) => {
      const rc = circleR + notchGap;
      const yc = CENTER_OFFSET;

      if (isHorizontal) {
        const opts = { W: containerW, H: barSize, rc, yc, r: cornerRadius };
        const dBar = barPathH(pos, opts);
        const dBevel = bevelPathH(pos, { W: containerW, rc, yc, r: cornerRadius });

        if (barPathRef.current) barPathRef.current.setAttribute('d', dBar);
        if (bevelRef.current) bevelRef.current.setAttribute('d', dBevel);
        if (bevelShadowRef.current) bevelShadowRef.current.setAttribute('d', dBevel);
        if (circleRef.current) circleRef.current.style.left = `${pos - circleR}px`;
      } else {
        const opts = { SH: containerH, SW: containerW, rc, yc, r: cornerRadius };
        const dBar = barPathV(pos, opts);
        const dBevel = bevelPathV(pos, { SH: containerH, SW: containerW, rc, yc, r: cornerRadius });

        if (barPathRef.current) barPathRef.current.setAttribute('d', dBar);
        if (bevelRef.current) bevelRef.current.setAttribute('d', dBevel);
        if (bevelShadowRef.current) bevelShadowRef.current.setAttribute('d', dBevel);
        if (circleRef.current) circleRef.current.style.top = `${pos - circleR}px`;
      }
    },
    [isHorizontal, containerW, containerH, barSize, circleR, notchGap, cornerRadius],
  );

  /* ── Init on mount + resize ───────────────────────────────────── */

  const init = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const w = containerWidth ?? rect.width;
    const h = isHorizontal ? barSize : (containerHeight ?? rect.height);

    setContainerW(w);
    setContainerH(h);

    const positions = computePositions(isHorizontal ? w : h);
    tabPositionsRef.current = positions;

    const idx = Math.min(activeIndexRef.current, positions.length - 1);
    const pos = positions[idx];
    currentPosRef.current = pos;
    render(pos);
  }, [containerWidth, containerHeight, barSize, isHorizontal, computePositions, render]);

  /* ── ResizeObserver ───────────────────────────────────────────── */

  useEffect(() => {
    // Reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const mqHandler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', mqHandler);

    // Init
    init();

    // ResizeObserver
    let ro: ResizeObserver | undefined;
    const el = containerRef.current;
    if (el && !containerWidth && !containerHeight) {
      ro = new ResizeObserver(() => init());
      ro.observe(el);
    }

    return () => {
      mq.removeEventListener('change', mqHandler);
      ro?.disconnect();
    };
  }, [init, containerWidth, containerHeight]);

  /* ── Switch tab with rAF animation ────────────────────────────── */

  const switchTab = useCallback(
    (newIndex: number) => {
      if (newIndex === activeIndexRef.current || animatingRef.current) return;

      animatingRef.current = true;
      const fromPos = currentPosRef.current;
      const toPos = tabPositionsRef.current[newIndex];
      if (toPos === undefined) {
        animatingRef.current = false;
        return;
      }

      // ARIA update for old tab
      const oldTab = tabRefs.current[activeIndexRef.current];
      if (oldTab) {
        oldTab.setAttribute('aria-selected', 'false');
        oldTab.setAttribute('tabindex', '-1');
      }

      // ARIA update for new tab
      const newTab = tabRefs.current[newIndex];
      if (newTab) {
        newTab.setAttribute('aria-selected', 'true');
        newTab.setAttribute('tabindex', '0');
      }

      // State update (triggers re-render for icon visibility)
      activeIndexRef.current = newIndex;
      setActiveIndex(newIndex);

      stableOnTabChange?.(tabs[newIndex], newIndex);

      // Reduced motion: instant
      if (reducedMotionRef.current) {
        currentPosRef.current = toPos;
        render(toPos);
        animatingRef.current = false;
        return;
      }

      // rAF animation
      const duration = transitionSpeed;
      let startTime: number | null = null;

      const animate = (ts: number) => {
        if (!startTime) startTime = ts;
        const t = Math.min((ts - startTime) / duration, 1);
        const eased = easeExpoOut(t);
        const pos = fromPos + (toPos - fromPos) * eased;
        currentPosRef.current = pos;
        render(pos);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          currentPosRef.current = toPos;
          animatingRef.current = false;
        }
      };

      requestAnimationFrame(animate);
    },
    [tabs, transitionSpeed, render, stableOnTabChange],
  );

  /* ── Keyboard (roving tabindex) ───────────────────────────────── */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = tabs.length;
      const idx = activeIndexRef.current;
      let next = idx;

      if (isHorizontal) {
        if (e.key === 'ArrowRight') next = (idx + 1) % count;
        else if (e.key === 'ArrowLeft') next = (idx - 1 + count) % count;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = count - 1;
        else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchTab(idx);
          return;
        } else return;
      } else {
        if (e.key === 'ArrowDown') next = (idx + 1) % count;
        else if (e.key === 'ArrowUp') next = (idx - 1 + count) % count;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = count - 1;
        else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchTab(idx);
          return;
        } else return;
      }

      e.preventDefault();
      tabRefs.current[next]?.focus();
      switchTab(next);
    },
    [tabs.length, isHorizontal, switchTab],
  );

  /* ── Pointer press (circle scale) ─────────────────────────────── */

  const handlePointerDown = useCallback(() => {
    if (circleRef.current) circleRef.current.style.scale = '0.94';
  }, []);

  const handlePointerUp = useCallback(() => {
    if (circleRef.current) circleRef.current.style.scale = '1';
  }, []);

  /* ── Click handler ────────────────────────────────────────────── */

  const handleTabClick = useCallback(
    (index: number) => {
      switchTab(index);
      tabRefs.current[index]?.focus();
    },
    [switchTab],
  );

  /* ── Container size ───────────────────────────────────────────── */

  const containerStyle: React.CSSProperties = {
    ...(containerWidth != null ? { width: containerWidth } : { left: 0, right: 0 }),
    ...(isHorizontal
      ? { bottom: containerBottomSpace, height: barSize }
      : containerHeight != null
        ? { top: 0, height: containerHeight }
        : { top: 0, bottom: 0, width: barSize }),
  };

  /* ── CSS vars ─────────────────────────────────────────────────── */

  const cssVars: React.CSSProperties = {
    '--nn-active-icon-color': activeIconColor,
    '--nn-inactive-icon-color': inactiveIconColor,
    '--nn-circle-fill': circleFillColor,
    '--nn-bar-bg': barBackground,
    '--nn-radius': `${cornerRadius}px`,
    '--nn-speed': `${transitionSpeed}ms`,
    '--nn-circle-size': `${circleSize}px`,
  } as React.CSSProperties;

  /* ── SVG viewBox ──────────────────────────────────────────────── */

  const vbW = containerW;
  const vbH = isHorizontal ? barSize : containerH;

  /* ── Circle offset ────────────────────────────────────────────── */

  const circleOffset = isHorizontal
    ? { top: -(circleR - CENTER_OFFSET) }
    : { left: containerW - CENTER_OFFSET - circleR };

  /* ── Tabs container class ─────────────────────────────────────── */

  const tabsClass = isHorizontal ? styles.tabsHorizontal : styles.tabsVertical;

  /* ── Bevel shadow transform ───────────────────────────────────── */

  const bevelShadowTransform = isHorizontal
    ? 'translateY(3px)'
    : 'translateX(3px)';

  /* ── Render ───────────────────────────────────────────────────── */

  return (
    <nav
      ref={containerRef}
      className={`${styles.root} ${className ?? ''}`}
      style={{ ...containerStyle, ...cssVars }}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* SVG glass bar */}
      <svg
        className={styles.svg}
        viewBox={`0 0 ${vbW} ${vbH}`}
        width={vbW}
        height={vbH}
        aria-hidden="true"
        style={{ borderRadius: cornerRadius }}
      >
        <path ref={barPathRef} className={styles.barPath} d="" />
        <path ref={bevelRef} className={styles.bevel} d="" />
        <path
          ref={bevelShadowRef}
          className={styles.bevelShadow}
          d=""
          style={{ transform: bevelShadowTransform }}
        />
      </svg>

      {/* Tabs */}
      <ul className={tabsClass} role="tablist">
        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;
          const tabContent = (
            <button
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.name}
              className={isActive ? styles.tabActive : styles.tab}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(i)}
              onKeyDown={handleKeyDown}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <span className={styles.tabIcon} aria-hidden="true">
                {tab.inactiveIcon}
              </span>
            </button>
          );

          return (
            <li
              key={tab.name}
              role="none"
              className={styles.tabSlot}
              style={tabSize != null ? { width: tabSize, height: tabSize } : { flex: 1 }}
            >
              {tab.href ? (
                <Link
                  href={tab.href}
                  style={{
                    display: 'flex',
                    flex: 1,
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {tabContent}
                </Link>
              ) : (
                tabContent
              )}
            </li>
          );
        })}
      </ul>

      {/* Circle (notch) */}
      <div
        ref={circleRef}
        className={styles.circle}
        style={{
          ...circleOffset,
          willChange: isHorizontal ? 'left' : 'top',
        }}
      >
        {tabs.map((tab, i) => (
          <span
            key={tab.name}
            className={i === activeIndex ? styles.circleIconActive : styles.circleIcon}
          >
            {tab.activeIcon}
          </span>
        ))}
      </div>
    </nav>
  );
}
