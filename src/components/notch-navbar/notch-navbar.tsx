'use client';

import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from 'react';
import type { NotchNavbarProps, NotchTab } from '@/lib/notch/types';
import {
  barPathH,
  barPathV,
  bevelPathH,
  bevelPathV,
  barPathVRTL,
  bevelPathVRTL,
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
import { computeEffectiveGeometry } from '@/lib/notch/geometry';
import {
  DefaultMoreIcon,
  useStableCallback,
  easeExpoOut,
  MORE_TAB_NAME,
} from './notch-navbar-helpers';
import { NotchCircle } from './notch-circle';
import { NotchTabItem } from './notch-tab-item';
import { NotchMoreCard } from './notch-more-card';
import styles from './notch-navbar.module.scss';

/* ── Component ─────────────────────────────────────────────────────── */

export function NotchNavbar({
  tabs,
  onTabChange,
  maxVisible = 5,
  moreLabel = 'More',
  moreIcon,
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
  dir = 'ltr',
  showLabels = false,
  topSpace = 0,
  bottomSpace = 0,
}: NotchNavbarProps) {
  const isHorizontal = orientation === 'horizontal';
  const isRTL = dir === 'rtl';
  const circleR = circleSize / 2;

  /* ── Overflow logic ──────────────────────────────────────────────── */

  const hasMore = tabs.length > maxVisible;
  // With overflow: (maxVisible-1) real tabs + More button = maxVisible slots total.
  // More occupies the last slot (index maxVisible-1). Bar never resizes.
  const visibleTabs = useMemo(
    () => (hasMore ? tabs.slice(0, maxVisible - 1) : tabs),
    [tabs, hasMore, maxVisible],
  );
  const hiddenTabs = useMemo(
    () => (hasMore ? tabs.slice(maxVisible - 1) : []),
    [tabs, hasMore, maxVisible],
  );
  const barTabs: NotchTab[] = useMemo(
    () =>
      hasMore
        ? [...visibleTabs, { name: MORE_TAB_NAME, activeIcon: null, inactiveIcon: null }]
        : visibleTabs,
    [hasMore, visibleTabs],
  );

  /* ── Refs ──────────────────────────────────────────────────────── */

  const containerRef = useRef<HTMLDivElement>(null);
  const barPathRef = useRef<SVGPathElement>(null);
  const bevelRef = useRef<SVGPathElement>(null);
  const bevelShadowRef = useRef<SVGPathElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /* ── State ─────────────────────────────────────────────────────── */

  const [containerW, setContainerW] = useState(containerWidth ?? 390);
  const [containerH, setContainerH] = useState(containerHeight ?? barSize);
  const [activeIndex, setActiveIndex] = useState(
    Math.min(defaultActiveTabIndex, tabs.length - 1),
  );
  const [hiddenActiveIndex, setHiddenActiveIndex] = useState<number | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [cardFocusIdx, setCardFocusIdx] = useState(0);
  const [moreActive, setMoreActive] = useState(false);

  /* ── Refs for animation ───────────────────────────────────────── */

  const animatingRef = useRef(false);
  const currentPosRef = useRef(0);
  const activeIndexRef = useRef(activeIndex);
  const hiddenActiveRef = useRef(hiddenActiveIndex);
  const cardOpenRef = useRef(cardOpen);
  const moreActiveRef = useRef(moreActive);
  const prevActiveBarIdxRef = useRef(0);

  useLayoutEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useLayoutEffect(() => {
    hiddenActiveRef.current = hiddenActiveIndex;
  }, [hiddenActiveIndex]);

  useLayoutEffect(() => {
    cardOpenRef.current = cardOpen;
  }, [cardOpen]);

  useLayoutEffect(() => {
    moreActiveRef.current = moreActive;
  }, [moreActive]);

  /* ── Stable onTabChange ───────────────────────────────────────── */

  const stableOnTabChange = useStableCallback(onTabChange);

  /* ── Reduced motion ───────────────────────────────────────────── */

  const reducedMotionRef = useRef(false);

  /* ── Auto-scale geometry ───────────────────────────────────────── */

  const barTabCount = barTabs.length;

  const effectiveValues = useMemo(
    () =>
      computeEffectiveGeometry({
        size: isHorizontal
          ? (containerWidth ?? containerW)
          : (containerHeight ?? containerH),
        count: barTabCount,
        circleR,
        notchGap,
        pad: PAD,
      }),
    [isHorizontal, containerWidth, containerW, containerHeight, containerH, barTabCount, circleR, notchGap],
  );

  const { effectiveCircleR, effectiveGap, effectiveCircleSize } = effectiveValues;

  /* ── Determine visible bar index for notch position ────────────── */

  const moreSlotIndex = maxVisible - 1;

  const getBarIndex = useCallback(
    (realIndex: number): number => {
      if (!hasMore) return realIndex;
      if (realIndex < moreSlotIndex) return realIndex;
      return moreSlotIndex;
    },
    [hasMore, moreSlotIndex],
  );

  /* ── Tab positions ────────────────────────────────────────────── */

  const tabPositionsRef = useRef<number[]>([]);

  const computePositions = useCallback(
    (size: number): number[] => {
      let positions = getTabPositions(barTabs.length, size, PAD);

      // RTL: mirror horizontal positions (first tab → right side)
      if (isRTL && isHorizontal) {
        positions = positions.map((p) => size - p);
      }

      return positions;
    },
    [barTabs.length, isRTL, isHorizontal],
  );

  /* ── Render path + circle (uses effective values) ──────────────── */

  const render = useCallback(
    (pos: number) => {
      const rc = effectiveCircleR + effectiveGap;
      const yc = CENTER_OFFSET;

      if (isHorizontal) {
        const opts = { W: containerW, H: barSize, rc, yc, r: cornerRadius };
        const dBar = barPathH(pos, opts);
        const dBevel = bevelPathH(pos, { W: containerW, rc, yc, r: cornerRadius });

        if (barPathRef.current) barPathRef.current.setAttribute('d', dBar);
        if (bevelRef.current) bevelRef.current.setAttribute('d', dBevel);
        if (bevelShadowRef.current) bevelShadowRef.current.setAttribute('d', dBevel);
        if (circleRef.current) circleRef.current.style.left = `${pos - effectiveCircleR}px`;
      } else {
        const opts = { SH: containerH, SW: containerW, rc, yc, r: cornerRadius };
        const dBar = isRTL ? barPathVRTL(pos, opts) : barPathV(pos, opts);
        const bevelOpts = { SH: containerH, SW: containerW, rc, yc, r: cornerRadius };
        const dBevel = isRTL ? bevelPathVRTL(pos, bevelOpts) : bevelPathV(pos, bevelOpts);

        if (barPathRef.current) barPathRef.current.setAttribute('d', dBar);
        if (bevelRef.current) bevelRef.current.setAttribute('d', dBevel);
        if (bevelShadowRef.current) bevelShadowRef.current.setAttribute('d', dBevel);
        if (circleRef.current) circleRef.current.style.top = `${pos - effectiveCircleR}px`;
      }

      // Keep --nn-more-pos in sync (for card anchoring on resize)
      const morePos = tabPositionsRef.current[moreSlotIndex];
      if (morePos !== undefined && containerRef.current) {
        containerRef.current.style.setProperty('--nn-more-pos', `${morePos}px`);
      }
    },
    [isHorizontal, isRTL, containerW, containerH, barSize, effectiveCircleR, effectiveGap, cornerRadius, moreSlotIndex],
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

    const barIdx = getBarIndex(Math.min(activeIndexRef.current, tabs.length - 1));
    const idx = Math.min(barIdx, positions.length - 1);
    const pos = positions[idx];
    currentPosRef.current = pos;
    render(pos);
  }, [containerWidth, containerHeight, barSize, isHorizontal, computePositions, render, getBarIndex, tabs.length]);

  /* ── ResizeObserver ───────────────────────────────────────────── */

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const mqHandler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', mqHandler);

    init();

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

  /* ── Close card on outside click / Escape ──────────────────────── */

  useEffect(() => {
    if (!cardOpen) return;

    const handleOutside = (e: PointerEvent) => {
      const card = cardRef.current;
      if (card && !card.contains(e.target as Node)) {
        setCardOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCardOpen(false);
        tabRefs.current[moreSlotIndex]?.focus();
      }
    };

    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [cardOpen, moreSlotIndex]);

  /* ── Focus card on open ───────────────────────────────────────── */

  useEffect(() => {
    if (cardOpen && cardRef.current) {
      const idx = hiddenActiveIndex != null ? hiddenActiveIndex - moreSlotIndex : 0;
      setCardFocusIdx(idx);
      requestAnimationFrame(() => {
        cardItemRefs.current[idx]?.focus();
      });
    }
  }, [cardOpen, hiddenActiveIndex, moreSlotIndex]);

  /* ── Animate notch to a bar slot without changing activeIndex ─── */

  const moveNotchTo = useCallback(
    (barIndex: number) => {
      if (animatingRef.current) return;
      const toPos = tabPositionsRef.current[barIndex];
      if (toPos === undefined) return;

      const fromPos = currentPosRef.current;
      if (fromPos === toPos) return;

      animatingRef.current = true;

      // Update ARIA on bar buttons
      const prevBarIdx =
        moreActiveRef.current || hiddenActiveRef.current != null
          ? moreSlotIndex
          : getBarIndex(activeIndexRef.current);
      const prevBtn = tabRefs.current[prevBarIdx];
      if (prevBtn && prevBarIdx !== barIndex) {
        prevBtn.setAttribute('aria-selected', 'false');
        prevBtn.setAttribute('tabindex', '-1');
      }
      const nextBtn = tabRefs.current[barIndex];
      if (nextBtn) {
        nextBtn.setAttribute('aria-selected', 'true');
        nextBtn.setAttribute('tabindex', '0');
      }

      if (reducedMotionRef.current) {
        currentPosRef.current = toPos;
        render(toPos);
        animatingRef.current = false;
        return;
      }

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
    [transitionSpeed, render, getBarIndex, moreSlotIndex],
  );

  /* ── Revert notch when card closes without hidden tab selection ─ */

  useEffect(() => {
    if (!cardOpen && moreActive && hiddenActiveRef.current == null) {
      moveNotchTo(prevActiveBarIdxRef.current);
      moreActiveRef.current = false;
      setMoreActive(false);
    }
  }, [cardOpen, moreActive, moveNotchTo]);

  /* ── Switch tab with rAF animation ────────────────────────────── */

  const switchTab = useCallback(
    (newRealIndex: number) => {
      const newBarIdx = getBarIndex(newRealIndex);
      if (newBarIdx === getBarIndex(activeIndexRef.current) && newRealIndex === activeIndexRef.current) return;
      if (animatingRef.current) return;

      animatingRef.current = true;
      const fromPos = currentPosRef.current;
      const toPos = tabPositionsRef.current[newBarIdx];
      if (toPos === undefined) {
        animatingRef.current = false;
        return;
      }

      const oldBarIdx = getBarIndex(activeIndexRef.current);
      const oldTab = tabRefs.current[oldBarIdx];
      if (oldTab) {
        oldTab.setAttribute('aria-selected', 'false');
        oldTab.setAttribute('tabindex', '-1');
      }

      const newTab = tabRefs.current[newBarIdx];
      if (newTab) {
        newTab.setAttribute('aria-selected', 'true');
        newTab.setAttribute('tabindex', '0');
      }

      activeIndexRef.current = newRealIndex;
      setActiveIndex(newRealIndex);

      const isHidden = hasMore && newRealIndex >= maxVisible;
      hiddenActiveRef.current = isHidden ? newRealIndex : null;
      setHiddenActiveIndex(isHidden ? newRealIndex : null);
      moreActiveRef.current = false;
      setMoreActive(false);

      stableOnTabChange?.(tabs[newRealIndex], newRealIndex);

      if (reducedMotionRef.current) {
        currentPosRef.current = toPos;
        render(toPos);
        animatingRef.current = false;
        return;
      }

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
    [tabs, transitionSpeed, render, stableOnTabChange, getBarIndex, hasMore, maxVisible],
  );

  /* ── Pointer press (circle scale) ─────────────────────────────── */

  const handlePointerDown = useCallback(() => {
    if (circleRef.current) circleRef.current.style.scale = '0.94';
  }, []);

  const handlePointerUp = useCallback(() => {
    if (circleRef.current) circleRef.current.style.scale = '1';
  }, []);

  /* ── Hidden tab click ─────────────────────────────────────────── */

  const handleHiddenTabClick = useCallback(
    (hiddenIdx: number) => {
      const realIdx = moreSlotIndex + hiddenIdx;
      setCardOpen(false);
      switchTab(realIdx);
      tabRefs.current[moreSlotIndex]?.focus();
    },
    [moreSlotIndex, switchTab],
  );

  /* ── Card keyboard navigation ─────────────────────────────────── */

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = hiddenTabs.length;
      if (count === 0) return;

      let next = cardFocusIdx;
      if (e.key === 'ArrowDown' || (!isHorizontal && e.key === 'ArrowRight')) {
        next = (cardFocusIdx + 1) % count;
      } else if (e.key === 'ArrowUp' || (!isHorizontal && e.key === 'ArrowLeft')) {
        next = (cardFocusIdx - 1 + count) % count;
      } else if (e.key === 'Home') {
        next = 0;
      } else if (e.key === 'End') {
        next = count - 1;
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleHiddenTabClick(cardFocusIdx);
        return;
      } else return;

      e.preventDefault();
      setCardFocusIdx(next);
      cardItemRefs.current[next]?.focus();
    },
    [cardFocusIdx, hiddenTabs.length, isHorizontal, handleHiddenTabClick],
  );

  /* ── Keyboard (roving tabindex) ───────────────────────────────── */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = barTabs.length;
      const barIdx = getBarIndex(activeIndexRef.current);
      let next = barIdx;

      if (isHorizontal) {
        // RTL: arrow direction mirrors
        if (isRTL) {
          if (e.key === 'ArrowLeft') next = (barIdx + 1) % count;
          else if (e.key === 'ArrowRight') next = (barIdx - 1 + count) % count;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = count - 1;
          else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (hasMore && barIdx === moreSlotIndex) {
              if (cardOpenRef.current) {
                setCardOpen(false);
                setMoreActive(false);
              } else {
                prevActiveBarIdxRef.current = getBarIndex(activeIndexRef.current);
                setCardOpen(true);
                moreActiveRef.current = true;
                setMoreActive(true);
                moveNotchTo(moreSlotIndex);
              }
            }
            return;
          } else return;
        } else {
          if (e.key === 'ArrowRight') next = (barIdx + 1) % count;
          else if (e.key === 'ArrowLeft') next = (barIdx - 1 + count) % count;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = count - 1;
          else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (hasMore && barIdx === moreSlotIndex) {
              if (cardOpenRef.current) {
                setCardOpen(false);
                setMoreActive(false);
              } else {
                prevActiveBarIdxRef.current = getBarIndex(activeIndexRef.current);
                setCardOpen(true);
                moreActiveRef.current = true;
                setMoreActive(true);
                moveNotchTo(moreSlotIndex);
              }
            }
            return;
          } else return;
        }
      } else {
        if (e.key === 'ArrowDown') next = (barIdx + 1) % count;
        else if (e.key === 'ArrowUp') next = (barIdx - 1 + count) % count;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = count - 1;
        else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (hasMore && barIdx === moreSlotIndex) {
            if (cardOpenRef.current) {
              setCardOpen(false);
              setMoreActive(false);
            } else {
              prevActiveBarIdxRef.current = getBarIndex(activeIndexRef.current);
              setCardOpen(true);
              moreActiveRef.current = true;
              setMoreActive(true);
              moveNotchTo(moreSlotIndex);
            }
          }
          return;
        } else return;
      }

      e.preventDefault();

      if (hasMore && next === moreSlotIndex) {
        tabRefs.current[next]?.focus();
        return;
      }

      tabRefs.current[next]?.focus();
      switchTab(next);
    },
    [barTabs.length, isHorizontal, isRTL, switchTab, getBarIndex, hasMore, moreSlotIndex, moveNotchTo],
  );

  /* ── Click handlers ───────────────────────────────────────────── */

  const handleTabClick = useCallback(
    (barIndex: number) => {
      if (hasMore && barIndex === moreSlotIndex) {
        if (cardOpenRef.current) {
          // Close: card effect handles notch revert when moreActive is true
          setCardOpen(false);
        } else {
          // Open: animate notch to More slot
          prevActiveBarIdxRef.current = getBarIndex(activeIndexRef.current);
          setCardOpen(true);
          moreActiveRef.current = true;
          setMoreActive(true);
          moveNotchTo(moreSlotIndex);
        }
        tabRefs.current[barIndex]?.focus();
        return;
      }
      if (cardOpenRef.current) setCardOpen(false);

      switchTab(barIndex);
      tabRefs.current[barIndex]?.focus();
    },
    [switchTab, hasMore, moreSlotIndex, getBarIndex, moveNotchTo],
  );

  /* ── More tab icon ────────────────────────────────────────────── */

  const moreIconElement = useMemo(
    () => moreIcon ?? <DefaultMoreIcon />,
    [moreIcon],
  );

  const moreBarIcon = useMemo(() => {
    if (hiddenActiveIndex != null) {
      const tab = tabs[hiddenActiveIndex];
      return tab ? tab.inactiveIcon : moreIconElement;
    }
    return moreIconElement;
  }, [hiddenActiveIndex, tabs, moreIconElement]);

  /* ── Card position style ──────────────────────────────────────── */

  const cardPositionStyle = useMemo((): React.CSSProperties => {
    if (isHorizontal) {
      return {
        bottom: barSize + 8,
        left: 'var(--nn-more-pos)',
        transform: 'translateX(-50%)',
      };
    }
    // Vertical: card protrudes to the right (LTR) or left (RTL) of the navbar
    if (isRTL) {
      return {
        right: barSize + 8,
        top: 'var(--nn-more-pos)',
        transform: 'translateY(-50%)',
      };
    }
    return {
      left: barSize + 8,
      top: 'var(--nn-more-pos)',
      transform: 'translateY(-50%)',
    };
  }, [isHorizontal, isRTL, barSize]);

  /* ── Tabs container inline style (safe-area + RTL padding) ────── */

  const tabsStyle: React.CSSProperties = (() => {
    const s: React.CSSProperties = {};
    if (!isHorizontal && (topSpace > 0 || bottomSpace > 0)) {
      s.top = topSpace;
      s.bottom = bottomSpace;
    }
    if (isHorizontal && isRTL) {
      s.paddingInlineStart = 8;
      s.paddingInlineEnd = 8;
    }
    return s;
  })();

  /* ── Guard: need at least 2 tabs (AFTER all hooks) ────────────── */

  if (tabs.length < 2) {
    return (
      <nav
        className={`${styles.root} ${className ?? ''}`}
        role="navigation"
        aria-label="Main navigation"
        dir={dir}
        style={{
          ...(containerWidth != null ? { width: containerWidth } : {}),
          ...(isHorizontal
            ? { bottom: containerBottomSpace, height: barSize }
            : containerHeight != null
              ? { top: 0, height: containerHeight }
              : { top: 0, bottom: 0, width: barSize }),
        }}
      >
        <div className={styles.emptyGuard} role="status">
          Add at least 2 tabs
        </div>
      </nav>
    );
  }

  /* ── Container style ──────────────────────────────────────────── */

  const containerStyle: React.CSSProperties = {
    ...(containerWidth != null ? { width: containerWidth } : { left: 0, right: 0 }),
    ...(isHorizontal
      ? { bottom: containerBottomSpace, height: barSize }
      : {
          ...(isRTL ? { right: 0 } : { left: 0 }),
          width: barSize,
          ...(topSpace > 0 || bottomSpace > 0
            ? { top: topSpace, bottom: bottomSpace }
            : containerHeight != null
              ? { top: 0, height: containerHeight }
              : { top: 0, bottom: 0 }),
        }),
  };

  /* ── CSS vars ─────────────────────────────────────────────────── */

  const cssVars: React.CSSProperties = {
    '--nn-active-icon-color': activeIconColor,
    '--nn-inactive-icon-color': inactiveIconColor,
    '--nn-circle-fill': circleFillColor,
    '--nn-bar-bg': barBackground,
    '--nn-radius': `${cornerRadius}px`,
    '--nn-speed': `${transitionSpeed}ms`,
    '--nn-circle-size': `${effectiveCircleSize}px`,
  } as React.CSSProperties;

  /* ── SVG viewBox ──────────────────────────────────────────────── */

  const vbW = containerW;
  const vbH = isHorizontal ? barSize : containerH;

  /* ── Circle offset ────────────────────────────────────────────── */

  const circleOffset = isHorizontal
    ? { top: -(effectiveCircleR - CENTER_OFFSET) }
    : isRTL
      ? { left: CENTER_OFFSET }
      : { left: containerW - CENTER_OFFSET - effectiveCircleR };

  /* ── Tabs container class ─────────────────────────────────────── */

  const tabsClass = isHorizontal
    ? isRTL
      ? styles.tabsHorizontalRTL
      : styles.tabsHorizontal
    : topSpace > 0 || bottomSpace > 0
      ? styles.tabsVerticalSafeArea
      : styles.tabsVertical;

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
      dir={dir}
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
      <ul className={tabsClass} role="tablist" style={tabsStyle}>
        {barTabs.map((tab, i) => {
          const isMore = hasMore && i === moreSlotIndex;
          const moreSelected = moreActive || hiddenActiveIndex != null;
          const isActive = isMore
            ? moreSelected
            : i === activeIndex && !moreActive;

          return (
            <NotchTabItem
              key={isMore ? MORE_TAB_NAME : tab.name}
              tab={tab}
              isActive={isActive}
              isMore={isMore}
              moreBarIcon={moreBarIcon}
              showLabel={showLabels}
              ariaSelected={isMore ? moreSelected : i === activeIndex && !moreActive}
              moreLabel={moreLabel}
              tabRef={(el) => {
                tabRefs.current[i] = el;
              }}
              onClick={() => handleTabClick(i)}
              onKeyDown={handleKeyDown}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              ariaExpanded={isMore ? cardOpen : undefined}
            />
          );
        })}
      </ul>

      {/* Circle (notch) */}
      <NotchCircle
        circleRef={circleRef}
        effectiveCircleSize={effectiveCircleSize}
        effectiveCircleR={effectiveCircleR}
        offset={circleOffset}
        willChange={isHorizontal ? 'left' : 'top'}
        barTabs={barTabs}
        activeIndex={activeIndex}
        hiddenActiveIndex={hiddenActiveIndex}
        moreActive={moreActive}
        hasMore={hasMore}
        maxVisible={maxVisible}
        tabs={tabs}
        moreIconElement={moreIconElement}
      />

      {/* More card (popover) */}
      {hasMore && cardOpen && (
        <NotchMoreCard
          cardRef={cardRef}
          hiddenTabs={hiddenTabs}
          activeIndex={activeIndex}
          maxVisible={maxVisible}
          cardFocusIdx={cardFocusIdx}
          activeIconColor={activeIconColor}
          inactiveIconColor={inactiveIconColor}
          moreLabel={moreLabel}
          positionStyle={cardPositionStyle}
          cardItemRef={(idx) => (el) => {
            cardItemRefs.current[idx] = el;
          }}
          onHiddenTabClick={handleHiddenTabClick}
          onKeyDown={handleCardKeyDown}
        />
      )}
    </nav>
  );
}
