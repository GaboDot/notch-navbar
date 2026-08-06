'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Home,
  Search,
  ShoppingCart,
  Settings,
  User,
  Wifi,
  Bell,
  Battery,
  Calendar,
  Folder,
  Heart,
  Star,
} from 'lucide-react';
import { NotchNavbar } from '@/components/notch-navbar/notch-navbar';
import type { NotchTab, Orientation } from '@/lib/notch/types';
import { DEFAULT_COLORS, DURATION_DEFAULT, NOTCH_GAP, CORNER_RADIUS } from '@/lib/notch/constants';
import styles from './playground.module.scss';

/* ── Icon pool (10 tabs) ──────────────────────────────────────────── */

const ICON_POOL = [
  { name: 'Home', Icon: Home },
  { name: 'Search', Icon: Search },
  { name: 'Cart', Icon: ShoppingCart },
  { name: 'Settings', Icon: Settings },
  { name: 'Profile', Icon: User },
  { name: 'Bell', Icon: Bell },
  { name: 'Calendar', Icon: Calendar },
  { name: 'Folder', Icon: Folder },
  { name: 'Heart', Icon: Heart },
  { name: 'Star', Icon: Star },
] as const;

/* ── Helpers ───────────────────────────────────────────────────────── */

function makeTabs(count: number): NotchTab[] {
  return ICON_POOL.slice(0, count).map(({ name, Icon }) => ({
    name,
    activeIcon: <Icon size={24} stroke="currentColor" />,
    inactiveIcon: <Icon size={24} stroke="currentColor" />,
  }));
}

/* ── Status bar SVGs ───────────────────────────────────────────────── */

function StatusBar() {
  return (
    <div className={styles.statusBar}>
      <span className={styles.statusTime}>9:41</span>
      <div className={styles.statusIcons}>
        <Wifi />
        <Bell />
        <Battery />
      </div>
    </div>
  );
}

/* ── Shared card content ───────────────────────────────────────────── */

function CardContent() {
  return (
    <>
      <div className={styles.cardBanner}>
        <div className={styles.cardBannerTitle}>Animated Notch Nav</div>
        <div className={styles.cardBannerDesc}>
          SVG semicircular cutout + circle notch with crescent gap. Tap tabs.
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Analytics</div>
        <div className={styles.cardTitle}>Weekly Performance</div>
        <div className={styles.cardDesc}>Active users up 12% vs last week.</div>
        <div className={styles.cardStat}>
          <span className={styles.cardStatValue}>2,847</span>
          <span className={styles.cardStatUnit}>users</span>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardLabel}>Revenue</div>
        <div className={styles.cardTitle}>Monthly Recurring</div>
        <div className={styles.cardDesc}>Subscription revenue trending upward.</div>
        <div className={styles.cardStat}>
          <span className={styles.cardStatValue}>$18.4k</span>
          <span className={styles.cardStatUnit}>MRR</span>
        </div>
      </div>
    </>
  );
}

/* ── Playground ────────────────────────────────────────────────────── */

export default function PlaygroundPage() {
  /* ── State ─────────────────────────────────────────────────────── */

  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [activeIconColor, setActiveIconColor] = useState<string>(DEFAULT_COLORS.activeIconColor);
  const [inactiveIconColor, setInactiveIconColor] = useState<string>(DEFAULT_COLORS.inactiveIconColor);
  const [circleFillColor, setCircleFillColor] = useState<string>(DEFAULT_COLORS.circleFillColor);
  const [barBackground, setBarBackground] = useState<string>(DEFAULT_COLORS.barBackground);
  const [notchGap, setNotchGap] = useState(NOTCH_GAP);
  const [cornerRadius, setCornerRadius] = useState(CORNER_RADIUS);
  const [transitionSpeed, setTransitionSpeed] = useState(DURATION_DEFAULT);
  const [tabCount, setTabCount] = useState(5);
  const [tabSize, setTabSize] = useState(0);
  const [activeTabName, setActiveTabName] = useState('Home');
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  /* ── Memoized tabs ─────────────────────────────────────────────── */

  const tabs = useMemo(() => makeTabs(tabCount), [tabCount]);

  /* ── Callbacks ─────────────────────────────────────────────────── */

  const handleTabChange = useCallback((tab: NotchTab, index: number) => {
    setActiveTabName(tab.name);
    setActiveTabIndex(index);
  }, []);

  /* ── Preview: horizontal (phone) ───────────────────────────────── */

  const horizontalPreview = (
    <div className={styles.phoneFrame}>
      <div className={styles.phoneScreen}>
        <StatusBar />
        <div className={styles.appHeader}>
          <h1 className={styles.appHeaderTitle}>Dashboard</h1>
          <p className={styles.appHeaderSub}>Welcome back</p>
        </div>
        <div className={styles.appContent}>
          <CardContent />
        </div>
        <NotchNavbar
          tabs={tabs}
          orientation="horizontal"
          activeIconColor={activeIconColor}
          inactiveIconColor={inactiveIconColor}
          circleFillColor={circleFillColor}
          barBackground={barBackground}
          cornerRadius={cornerRadius}
          notchGap={notchGap}
          transitionSpeed={transitionSpeed}
          tabSize={tabSize || undefined}
          containerBottomSpace={0}
          onTabChange={handleTabChange}
        />
        <div className={styles.homeIndicator} />
      </div>
    </div>
  );

  /* ── Preview: vertical (tablet) ────────────────────────────────── */

  const verticalPreview = (
    <div className={styles.tabletFrame}>
      <div className={styles.tabletScreen}>
        <StatusBar />
        <NotchNavbar
          tabs={tabs}
          orientation="vertical"
          activeIconColor={activeIconColor}
          inactiveIconColor={inactiveIconColor}
          circleFillColor={circleFillColor}
          barBackground={barBackground}
          cornerRadius={cornerRadius}
          notchGap={notchGap}
          transitionSpeed={transitionSpeed}
          tabSize={tabSize || undefined}
          onTabChange={handleTabChange}
        />
        <div className={styles.sidebarAppArea}>
          <div className={styles.sidebarAppHeader}>
            <h1 className={styles.sidebarAppHeaderTitle}>Dashboard</h1>
            <p className={styles.sidebarAppHeaderSub}>Welcome back</p>
          </div>
          <CardContent />
        </div>
      </div>
    </div>
  );

  /* ── Render ────────────────────────────────────────────────────── */

  return (
    <div className={styles.pg}>
      <div className={styles.pgHeader}>
        <span className={styles.pgTitle}>NotchNavbar — Interactive Playground</span>
      </div>

      <div className={styles.pgMain}>
        {/* Controls */}
        <div className={styles.controls}>
          <span className={styles.controlsTitle}>Controls</span>

          {/* Orientation */}
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Orientation</span>
            <div className={styles.orientToggle}>
              <button
                className={`${styles.orientBtn} ${orientation === 'horizontal' ? styles.orientBtnActive : ''}`}
                onClick={() => setOrientation('horizontal')}
              >
                Horizontal
              </button>
              <button
                className={`${styles.orientBtn} ${orientation === 'vertical' ? styles.orientBtnActive : ''}`}
                onClick={() => setOrientation('vertical')}
              >
                Vertical
              </button>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Colors */}
          <span className={styles.controlsTitle}>Colors</span>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Active Icon</span>
            <div className={styles.colorRow}>
              <input
                type="color"
                className={styles.colorInput}
                value={activeIconColor}
                onChange={(e) => setActiveIconColor(e.target.value)}
              />
              <span className={styles.colorHex}>{activeIconColor}</span>
            </div>
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Inactive Icon</span>
            <div className={styles.colorRow}>
              <input
                type="color"
                className={styles.colorInput}
                value={inactiveIconColor}
                onChange={(e) => setInactiveIconColor(e.target.value)}
              />
              <span className={styles.colorHex}>{inactiveIconColor}</span>
            </div>
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Circle Fill</span>
            <div className={styles.colorRow}>
              <input
                type="color"
                className={styles.colorInput}
                value={circleFillColor}
                onChange={(e) => setCircleFillColor(e.target.value)}
              />
              <span className={styles.colorHex}>{circleFillColor}</span>
            </div>
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Bar Background</span>
            <div className={styles.colorRow}>
              <input
                type="color"
                className={styles.colorInput}
                value={barBackground}
                onChange={(e) => setBarBackground(e.target.value)}
              />
              <span className={styles.colorHex}>{barBackground}</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Geometry */}
          <span className={styles.controlsTitle}>Geometry</span>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>
              Notch Gap
              <span className={styles.controlValue}>{notchGap}px</span>
            </span>
            <input
              type="range"
              className={styles.slider}
              min={4}
              max={14}
              step={1}
              value={notchGap}
              onChange={(e) => setNotchGap(Number(e.target.value))}
            />
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>
              Corner Radius
              <span className={styles.controlValue}>{cornerRadius}px</span>
            </span>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={20}
              step={1}
              value={cornerRadius}
              onChange={(e) => setCornerRadius(Number(e.target.value))}
            />
          </div>

          <div className={styles.divider} />

          {/* Behavior */}
          <span className={styles.controlsTitle}>Behavior</span>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>
              Transition Speed
              <span className={styles.controlValue}>{transitionSpeed}ms</span>
            </span>
            <input
              type="range"
              className={styles.slider}
              min={200}
              max={600}
              step={50}
              value={transitionSpeed}
              onChange={(e) => setTransitionSpeed(Number(e.target.value))}
            />
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>
              Tab Count
              <span className={styles.controlValue}>{tabCount}</span>
            </span>
            <input
              type="range"
              className={styles.slider}
              min={3}
              max={9}
              step={1}
              value={tabCount}
              onChange={(e) => {
                const n = Number(e.target.value);
                setTabCount(n);
                setActiveTabName(ICON_POOL[0].name);
                setActiveTabIndex(0);
              }}
            />
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>
              Tab Size{orientation === 'vertical' ? ' (vertical)' : ''}
              <span className={styles.controlValue}>{tabSize === 0 ? 'auto' : `${tabSize}px`}</span>
            </span>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={60}
              step={1}
              value={tabSize}
              onChange={(e) => setTabSize(Number(e.target.value))}
            />
          </div>

          <div className={styles.divider} />

          {/* Active tab indicator */}
          <div className={styles.activeLog}>
            <span className={styles.activeLogDot} />
            Active: {activeTabName} (index {activeTabIndex})
            {tabCount > 5 && activeTabIndex >= 4 && ' — via More card'}
          </div>
        </div>

        {/* Preview */}
        <div className={styles.preview}>
          {orientation === 'horizontal' ? horizontalPreview : verticalPreview}
        </div>
      </div>
    </div>
  );
}
