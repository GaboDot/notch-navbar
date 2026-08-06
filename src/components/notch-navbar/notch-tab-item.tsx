'use client';

import Link from 'next/link';
import type { NotchTab } from '@/lib/notch/types';
import styles from './notch-navbar.module.scss';

interface NotchTabItemProps {
  tab: NotchTab;
  isActive: boolean;
  /** True when this is the "More" overflow button */
  isMore: boolean;
  /** Icon to display when this is the More tab */
  moreBarIcon: React.ReactNode;
  /** When true, show label text below the icon (not for More tab) */
  showLabel: boolean;
  /** ARIA selected state — for More tab this may differ from isActive */
  ariaSelected: boolean;
  moreLabel: string;
  /** Ref callback to register this tab button */
  tabRef: (el: HTMLButtonElement | null) => void;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  /** Only for More tab: whether the card is expanded */
  ariaExpanded?: boolean;
}

export function NotchTabItem({
  tab,
  isActive,
  isMore,
  moreBarIcon,
  showLabel,
  ariaSelected,
  moreLabel,
  tabRef,
  onClick,
  onKeyDown,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  ariaExpanded,
}: NotchTabItemProps) {
  const button = (
    <button
      ref={tabRef}
      role="tab"
      aria-selected={ariaSelected}
      aria-label={isMore ? moreLabel : tab.name}
      {...(isMore ? { 'aria-haspopup': 'menu' as const, 'aria-expanded': ariaExpanded ?? false } : {})}
      className={isActive ? styles.tabActive : styles.tab}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <span className={styles.tabIcon} aria-hidden="true">
        {isMore ? moreBarIcon : tab.inactiveIcon}
      </span>
      {showLabel && !isMore && (
        <span className={styles.tabLabel}>{tab.name}</span>
      )}
    </button>
  );

  return (
    <li
      key={isMore ? '__notch_more__' : tab.name}
      role="none"
      className={styles.tabSlot}
      style={{ flex: 1 }}
    >
      {!isMore && tab.href ? (
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
          {button}
        </Link>
      ) : (
        button
      )}
    </li>
  );
}
