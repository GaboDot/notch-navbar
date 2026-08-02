'use client';

import { useRef, useLayoutEffect, useCallback } from 'react';

/* ── Default More icon (3×3 grid) ──────────────────────────────────── */

export function DefaultMoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="1.5" />
      <circle cx="12" cy="6" r="1.5" />
      <circle cx="18" cy="6" r="1.5" />
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
      <circle cx="6" cy="18" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
      <circle cx="18" cy="18" r="1.5" />
    </svg>
  );
}

/* ── Stable callback ref (React 19 compatible) ─────────────────────── */

export function useStableCallback<T extends (...args: never[]) => void>(cb?: T): T {
  const ref = useRef(cb);
  useLayoutEffect(() => {
    ref.current = cb;
  });
  return useCallback((...args: Parameters<T>) => {
    ref.current?.(...args);
  }, []) as T;
}

/* ── Easing ────────────────────────────────────────────────────────── */

export function easeExpoOut(t: number): number {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}

/* ── MORE_TAB sentinel ─────────────────────────────────────────────── */

export const MORE_TAB_NAME = '__notch_more__';
