# Graph Report - F:\Develop\NotchNavbar  (2026-08-01)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 147 nodes · 181 edges · 12 communities (9 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `54a16987`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- paths.ts
- compilerOptions
- dependencies
- page.tsx
- scripts
- include
- layout.tsx
- ResizeObserverStub
- eslint.config.mjs
- next.config.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `NotchNavbar()` - 10 edges
3. `scripts` - 8 edges
4. `include` - 7 edges
5. `barPathH()` - 5 edges
6. `bevelPathH()` - 5 edges
7. `barPathV()` - 5 edges
8. `DEFAULT_COLORS` - 4 edges
9. `cutoutH()` - 4 edges
10. `bevelPathV()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `NotchNavbar()` --calls--> `barPathH()`  [EXTRACTED]
  src/components/notch-navbar/notch-navbar.tsx → src/lib/notch/paths.ts
- `NotchNavbar()` --calls--> `barPathV()`  [EXTRACTED]
  src/components/notch-navbar/notch-navbar.tsx → src/lib/notch/paths.ts
- `NotchNavbar()` --calls--> `bevelPathH()`  [EXTRACTED]
  src/components/notch-navbar/notch-navbar.tsx → src/lib/notch/paths.ts
- `NotchNavbar()` --calls--> `bevelPathV()`  [EXTRACTED]
  src/components/notch-navbar/notch-navbar.tsx → src/lib/notch/paths.ts
- `NotchNavbar()` --calls--> `getTabPositions()`  [EXTRACTED]
  src/components/notch-navbar/notch-navbar.tsx → src/lib/notch/paths.ts

## Import Cycles
- None detected.

## Communities (12 total, 3 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.07
Nodes (29): babel-plugin-react-compiler, eslint, eslint-config-next, jsdom, devDependencies, babel-plugin-react-compiler, eslint, eslint-config-next (+21 more)

### Community 1 - "paths.ts"
Cohesion: 0.13
Nodes (23): easeExpoOut(), NotchNavbar(), useStableCallback(), BarHOpts, barPathH(), barPathV(), BarVOpts, BevelHOpts (+15 more)

### Community 2 - "compilerOptions"
Cohesion: 0.11
Nodes (19): dom, dom.iterable, esnext, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules (+11 more)

### Community 3 - "dependencies"
Cohesion: 0.12
Nodes (17): d3-interpolate-path, d3-shape, framer-motion, lucide-react, next, dependencies, d3-interpolate-path, d3-shape (+9 more)

### Community 4 - "page.tsx"
Cohesion: 0.18
Nodes (8): ALL_ICONS, makeTabs(), PlaygroundPage(), DEFAULT_COLORS, tabs, NotchNavbarProps, NotchTab, Orientation

### Community 5 - "scripts"
Cohesion: 0.17
Nodes (11): name, private, scripts, build, coverage, dev, lint, start (+3 more)

### Community 6 - "include"
Cohesion: 0.20
Nodes (9): **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, exclude (+1 more)

### Community 7 - "layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

## Knowledge Gaps
- **69 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+64 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _69 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07389162561576355 - nodes in this community are weakly interconnected._
- **Should `paths.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13054187192118227 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._