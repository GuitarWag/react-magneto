# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`react-magneto` is a published npm package: a headless draggable fridge-magnet board for React,
with zero runtime dependencies. `src/` is the library; `example/` is the playground deployed to
GitHub Pages.

## Commands

```bash
npm test                              # vitest run (happy-dom)
npm run test:watch
npm run test:cov                      # coverage thresholds: lines/functions/statements 98, branches 95
npm run lint                          # biome check .
npm run format                        # biome check --write .
npm run typecheck                     # tsc --noEmit
npm run build                         # tsup -> dist (esm + cjs + .d.ts)

npx vitest run src/zorder.test.ts     # one file
npx vitest run -t 'bringForward'      # one test/describe by name

cd example && npm install && npm run dev   # playground, consumes ../src directly
```

CI runs lint, typecheck, `test:cov`, the library build, then the example build — a break in the
public API surfaces as an example build failure. Releases: bump `version`, publish a GitHub
Release tagged `v<version>`; the workflow asserts tag == package.json version.

## Architecture

The whole design serves one guarantee: **dragging or changing one magnet never re-renders the
board or the other magnets.** Break that and the tests in `describe('the render-free drag
guarantee')` fail.

- **`MagnetBoard.tsx`** owns layout in `posRef` (a `Map<id, Pos>` in a ref, not state) so
  mutating it triggers no render. Each `Magnet` calls `register(id, setPos, el)` on mount; the
  board pushes updates through that registry, so a change lands in exactly one component.
  `applyMany` is the single write path — it patches `posRef`, notifies the affected magnets,
  re-anchors the menu if the selection moved, and fires `onLayoutChange`. Board-level React
  state is only `sel` (selection + its `Pos`, used to place the menu) and `dragging`.
- **`Magnet.tsx`** is `memo`'d and holds its own `pos`. During a drag it writes
  `style.transform` directly on its element (with `willChange: 'transform'`) — no React
  involved per frame — then commits the final position through `onCommit`. `left`/`top` stay
  fixed mid-gesture so the filtered element rasterizes once. Props passed from the board must
  stay identity-stable (callbacks are `useCallback`; user callbacks live in refs) or `memo`
  stops holding.
- **`Menu.tsx`** measures the selected element's live rect in `useLayoutEffect`, keyed on `pos`,
  so it follows move/rotate/scale for free. Unmounted mid-drag rather than tracked per frame.
- **`zorder.ts`** keeps `z` densely renumbered 1..n. `stepZ` swaps with the adjacent layer (a
  two-magnet change); `jumpZ` splices to an edge, preserving relative order. Both return only
  the ids whose `z` actually changed, which is what keeps a restack cheap.
- **`fx.ts`** hashes the id into a size and tilt, so an unpositioned magnet looks the same on
  every render and after export/import. `grid.ts` is the starting arrangement and the intro
  animation's origin.
- **`dieCut.tsx`** is one SVG morphology filter, applied to a plain HTML wrapper inside each
  magnet rather than to the artwork — on an HTML element the filter units are CSS pixels, so the
  outline weight is identical whatever viewBox an inline `<svg>` icon uses.
- **`round.ts`**: every value that reaches a `Pos` goes through `round`. Layouts get exported
  and pasted into source, and repeated `+0.15` steps otherwise accumulate float error.

`Pos` is `{x, y, r?, z?, s?}` with `x`/`y` as the magnet's center in board percent (0–100), which
makes an exported layout resolution-independent. Optional fields mean "use the default": the
deterministic tilt, `BASE_Z`, scale 1. Ref commands take an optional id and fall back to the
current selection.

## Conventions

- `'use client'` on every component file; `src/index.ts` is the only public surface — anything
  the README documents must be exported there.
- Comments explain *why* a non-obvious choice exists (compositor layers, filter units, rounding,
  the `idsKey` memo). Keep that density; skip comments that restate the code.
- Tests drive the board through real pointer events with `@testing-library/react`. happy-dom has
  no pointer capture and reports zero-size rects, so `test/setup.ts` stubs both — use `stubRect`
  on the board before dragging, and `await settled(el)` to pass the one-time intro rAF.
