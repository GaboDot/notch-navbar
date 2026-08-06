'use client';

import type { RefObject } from 'react';
import type { NotchTab } from '@/lib/notch/types';
import styles from './notch-navbar.module.scss';

interface NotchMoreCardProps {
  cardRef: RefObject<HTMLDivElement | null>;
  hiddenTabs: NotchTab[];
  activeIndex: number;
  maxVisible: number;
  cardFocusIdx: number;
  activeIconColor: string;
  inactiveIconColor: string;
  moreLabel: string;
  positionStyle: React.CSSProperties;
  cardItemRef: (idx: number) => (el: HTMLButtonElement | null) => void;
  onHiddenTabClick: (hiddenIdx: number) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function NotchMoreCard({
  cardRef,
  hiddenTabs,
  activeIndex,
  maxVisible,
  cardFocusIdx,
  activeIconColor,
  inactiveIconColor,
  moreLabel,
  positionStyle,
  cardItemRef,
  onHiddenTabClick,
  onKeyDown,
}: NotchMoreCardProps) {
  return (
    <div
      ref={cardRef}
      className={styles.moreCard}
      style={positionStyle}
      role="menu"
      aria-label={moreLabel}
      onKeyDown={onKeyDown}
    >
      {hiddenTabs.map((tab, i) => {
        const realIdx = (maxVisible - 1) + i;
        const isActive = realIdx === activeIndex;
        return (
          <button
            key={tab.name}
            ref={cardItemRef(i)}
            role="menuitem"
            tabIndex={i === cardFocusIdx ? 0 : -1}
            className={isActive ? styles.moreCardItemActive : styles.moreCardItem}
            onClick={() => onHiddenTabClick(i)}
          >
            <span
              className={styles.moreCardIcon}
              style={{ color: isActive ? activeIconColor : inactiveIconColor }}
              aria-hidden="true"
            >
              {isActive ? tab.activeIcon : tab.inactiveIcon}
            </span>
            <span className={styles.moreCardLabel}>{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
}
