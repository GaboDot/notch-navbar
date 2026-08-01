# NotchNavbar — Plan de Desarrollo (Componente Parametrizado)

## Estado
Mockups aprobados (horizontal + vertical). Geometría matemáticamente resuelta.
Siguiente: implementación React/Next.js con proceso Agilefall.

## API del componente (parametrizada)

```ts
interface NotchTab {
  name: string;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  href?: string;              // opcional → renderiza <Link> de Next.js
}

interface NotchNavbarProps {
  tabs: NotchTab[];
  onTabChange?: (tab: NotchTab, index: number) => void;

  // --- Orientación ---
  orientation?: 'horizontal' | 'vertical';     // default 'horizontal'

  // --- Colores (gobierna el componente vía currentColor) ---
  activeIconColor?: string;                    // default '#007AFF'
  inactiveIconColor?: string;                  // default '#6B7280' (aplica a TODOS)
  circleFillColor?: string;                    // default '#FFFFFF'
  barBackground?: string;                      // default '#FFFFFF'

  // --- Geometría ---
  cornerRadius?: number;                       // default 10 (todas las esquinas)
  notchGap?: number;                           // separación recorte↔círculo, default 7
  circleSize?: number;                         // default 56
  barSize?: number;                            // horizontal: alto / vertical: ancho, default 56

  // --- Comportamiento ---
  transitionSpeed?: number;                    // ms, default 350
  defaultActiveTabIndex?: number;
  containerWidth?: number;                     // horizontal (si no: fluido ResizeObserver)
  containerHeight?: number;                    // vertical (si no: fluido)
  containerBottomSpace?: number;               // margen del borde (default 0)
  className?: string;
}
```

### Colores de iconos — cómo funciona
- El componente aplica `color` en los wrappers CSS: `.nn-tab-icon { color: var(--nn-inactive-icon-color) }`, `.nn-circle-icon { color: var(--nn-active-icon-color) }`
- Los iconos deben usar `stroke="currentColor"` (lucide-react lo hace por defecto) → parametrización automática
- Documentar en README: los iconos heredan currentColor

### Orientación
- `'horizontal'`: bar bottom, recorte en borde superior, círculo sobresale arriba
- `'vertical'`: sidebar, recorte en borde interno (derecha si sidebar izquierda), círculo sobresale al contenido
- La geometría se genera por orientación en `lib/notch/paths.ts` (sweep flags ya verificados)

## Estructura

```
src/
├── lib/notch/                    ← TS PURO (testeable, sin React)
│   ├── constants.ts              → CIRCLE_R, gaps, radios, default colors
│   ├── paths.ts                  → cutoutPath/bevelPath por orientación + fillets
│   └── types.ts                  → NotchTab, NotchNavbarProps
├── components/notch-navbar/
│   ├── notch-navbar.tsx          ← componente principal ("use client")
│   ├── notch-navbar.module.scss  ← tokens CSS vars desde props
│   ├── notch-circle.tsx          → círculo deslizante (framer-motion)
│   └── notch-tab-item.tsx        → icono + estados + Link opcional
└── app/
    └── page.tsx                  ← demo playground (ambas orientaciones + controles)
```

## Fases

| # | Fase | Agente | Modelo | Entregable |
|---|------|--------|--------|------------|
| 0 | Scaffold: create-next-app + deps + sass + git | PM (infra) | — | App base |
| 1 | Motor de paths (constants, paths, types) | frontend-agent | mimo-v2.5-pro | lib/notch TS puro |
| 2 | Componente core (props paramétricas + orientación) | frontend-agent | mimo-v2.5-pro | notch-navbar.tsx + scss |
| 3 | Circle + TabItem (framer-motion, estados, Link) | frontend-agent | mimo-v2.5-pro | notch-circle.tsx, notch-tab-item.tsx |
| 4 | Demo playground (orientación + colores + tabs) | frontend-agent | mimo-v2.5-pro | app/page.tsx |
| 5 | Unit tests (paths ≥80%, render) | testing-agent | mimo-v2.5 | vitest suite |
| 6 | Docs (README API + colores + orientación) | documentation-agent | mimo-v2.5 | README.md |
| 7 | Validación (build/lint/typecheck/test) + graphify + reporte | PM | — | reporte |

## Definición de Done
- build + lint + typecheck + test verdes
- Demo con ambas orientaciones + controles de colores (activo/inactivo) + tabs editables
- Orientación y colores 100% parametrizados (props)
- Cobertura lib/notch ≥ 80%
- README con API completa
