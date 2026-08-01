import '@testing-library/jest-dom/vitest';

// ── jsdom stubs ───────────────────────────────────────────────────────────────

// jsdom does not implement ResizeObserver
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!('ResizeObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserverStub,
    writable: true,
    configurable: true,
  });
}

// jsdom does not implement window.matchMedia.
// Default to reduced-motion ON so tab switching takes the instant path
// (no requestAnimationFrame dependency) in component tests.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
