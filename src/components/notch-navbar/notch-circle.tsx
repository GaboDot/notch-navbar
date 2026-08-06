'use client';

import type { RefObject, ReactNode } from 'react';
import type { NotchTab } from '@/lib/notch/types';
import { MORE_TAB_NAME } from './notch-navbar-helpers';
import styles from './notch-navbar.module.scss';

interface NotchCircleProps {
  circleRef: RefObject<HTMLDivElement | null>;
  effectiveCircleSize: number;
  effectiveCircleR: number;
  /** For horizontal: { top }. For vertical (ltr): { left: containerW - CENTER_OFFSET - effectiveCircleR }. For vertical (rtl): { left: CENTER_OFFSET }. */
  offset: { top?: number; left?: number };
  willChange: 'left' | 'top';
  barTabs: NotchTab[];
  activeIndex: number;
  hiddenActiveIndex: number | null;
  /** True when notch is on More slot but no hidden tab selected yet */
  moreActive: boolean;
  hasMore: boolean;
  maxVisible: number;
  tabs: NotchTab[];
  moreIconElement: ReactNode;
}

export function NotchCircle({
  circleRef,
  effectiveCircleSize,
  offset,
  willChange,
  barTabs,
  activeIndex,
  hiddenActiveIndex,
  moreActive,
  hasMore,
  maxVisible,
  tabs,
  moreIconElement,
}: NotchCircleProps) {
  const moreSelected = moreActive || hiddenActiveIndex != null;

  return (
    <div
      ref={circleRef}
      className={styles.circle}
      style={{
        ...offset,
        width: effectiveCircleSize,
        height: effectiveCircleSize,
        willChange,
      }}
    >
      {barTabs.map((tab, i) => {
        const isMore = hasMore && i === maxVisible - 1;
        if (isMore) {
          const icon = hiddenActiveIndex != null
            ? (tabs[hiddenActiveIndex]?.activeIcon ?? moreIconElement)
            : moreIconElement;
          return (
            <span
              key={MORE_TAB_NAME}
              className={
                moreSelected
                  ? styles.circleIconActive
                  : styles.circleIcon
              }
            >
              {icon}
            </span>
          );
        }
        return (
          <span
            key={tab.name}
            className={
              i === activeIndex && !moreSelected
                ? styles.circleIconActive
                : styles.circleIcon
            }
          >
            {tab.activeIcon}
          </span>
        );
      })}
    </div>
  );
}
