'use client';

import {
  Home,
  Search,
  ShoppingCart,
  Settings,
  User,
} from 'lucide-react';
import { NotchNavbar } from '@/components/notch-navbar/notch-navbar';
import type { NotchTab } from '@/lib/notch/types';

const tabs: NotchTab[] = [
  { name: 'Home', activeIcon: <Home size={24} />, inactiveIcon: <Home size={24} /> },
  { name: 'Search', activeIcon: <Search size={24} />, inactiveIcon: <Search size={24} /> },
  { name: 'Cart', activeIcon: <ShoppingCart size={24} />, inactiveIcon: <ShoppingCart size={24} /> },
  { name: 'Settings', activeIcon: <Settings size={24} />, inactiveIcon: <Settings size={24} /> },
  { name: 'Profile', activeIcon: <User size={24} />, inactiveIcon: <User size={24} /> },
];

export default function SmokePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E8ECF1 0%, #F0F2F5 50%, #E8ECF1 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'rgba(0,0,0,0.35)',
          letterSpacing: 0.5,
          marginBottom: 20,
        }}
      >
        NotchNavbar — Smoke Test
      </h1>

      <div
        style={{
          position: 'relative',
          width: 390,
          height: 844,
          borderRadius: 32,
          overflow: 'hidden',
          boxShadow:
            '0 0 0 2px rgba(255,255,255,0.08), 0 25px 60px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.3)',
          background: '#F8F9FA',
        }}
      >
        {/* Content area */}
        <div style={{ padding: '60px 20px 100px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #007AFF, #8B5CF6)',
              borderRadius: 14,
              padding: 18,
              color: '#FFF',
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>
              Animated Notch Nav
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.4 }}>
              SVG semicircular cutout + circle notch with crescent gap. Tap tabs.
            </div>
          </div>

          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 14,
                padding: 18,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  color: '#007AFF',
                  marginBottom: 6,
                }}
              >
                Card {n}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1F2937' }}>
                Sample Content
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, marginTop: 4 }}>
                Scroll content behind the navbar.
              </div>
            </div>
          ))}
        </div>

        {/* NotchNavbar */}
        <NotchNavbar
          tabs={tabs}
          orientation="horizontal"
          onTabChange={(tab, index) => console.log('Tab changed:', tab.name, index)}
        />
      </div>
    </div>
  );
}
