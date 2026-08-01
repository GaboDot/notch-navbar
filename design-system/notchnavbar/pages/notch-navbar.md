# NotchNavbar Component — Page Overrides

> This file overrides `MASTER.md` rules for the NotchNavbar component specifically.

---

## Component Context

This is a **navigation component**, not a page. Override page-level patterns from MASTER.md.

## Color Overrides

| Token | MASTER.md | This Component |
|-------|-----------|----------------|
| `--color-primary` | `#FFFFFF` | `--nn-bg-fab` (theme-aware) |
| `--color-background` | `#888888` | `--nn-bg-bar` (glass effect) |
| `--color-ring` | `#007AFF` | `--nn-color-focus-ring` |

## Typography Overrides

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Tab labels | Inter / system-ui | 10px | 500 |
| (No headings in component) | — | — | — |

## Spacing Overrides

| Token | Value | Usage |
|-------|-------|-------|
| `--nn-tab-gap` | `8px` | Between tab buttons |
| `--nn-icon-padding` | `12px` | Icon to button edge |
| `--nn-fab-offset` | `8px` | FAB above bar surface |

## Motion Overrides

MASTER.md uses GSAP Flip for page transitions. This component uses **CSS transitions only** (no JS animation library required).

| Property | Duration | Easing |
|----------|----------|--------|
| FAB translateX | 350ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Icon opacity | 200ms | `ease-in` |
| Hover scale | 150ms | `ease` |
| Press scale | 80ms | `ease-out` |

## Accessibility Overrides

- Touch target: 48px minimum (not 44px — web standard)
- Focus ring: 3px solid (matches MASTER.md)
- Reduced motion: **mandatory** (component has significant animation)
