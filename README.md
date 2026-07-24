# react-magneto

Draggable fridge-magnet board for React. Headless, no runtime dependencies, and built so
**dragging one magnet never re-renders the others or the board**.

- Drop in an array of image urls and you have a board.
- Drag, restack, rotate and resize magnets, then export the arrangement as JSON and feed it
  back in as the starting state.
- You own the look: the board background is whatever you render behind the magnets.

## Install

```bash
npm i react-magneto
```

`react` and `react-dom` (>=18) are peer dependencies.

## Usage

```tsx
import { MagnetBoard } from 'react-magneto';

// Simplest: an array of image urls.
<MagnetBoard items={['/react.png', '/go.png', '/docker.png']} editable />
```

```tsx
// Custom magnets, a dynamic background, and layout export/import.
import { MagnetBoard, type MagnetBoardHandle } from 'react-magneto';
import { useRef } from 'react';
import savedLayout from './layout.json';

function Board() {
  const board = useRef<MagnetBoardHandle>(null);
  return (
    <>
      <button type="button" onClick={() => console.log(board.current?.getLayout())}>
        Export
      </button>
      <MagnetBoard
        ref={board}
        items={[{ id: 'react', label: 'React' }, { id: 'go', label: 'Go' }]}
        initialLayout={savedLayout}          // feed an exported layout back in
        editable
        onLayoutChange={(l) => save(l)}      // fired on every change
        renderMagnet={(item) => <MyLogo {...item} />}
        style={{ aspectRatio: '16 / 8', borderRadius: 24, overflow: 'hidden' }}
      >
        {/* background layer — anything, rendered behind the magnets */}
        <div style={{ position: 'absolute', inset: 0, background: '…' }} />
      </MagnetBoard>
    </>
  );
}
```

## The edit → export → import loop

1. Render with `editable` and arrange the magnets.
2. Read the layout with `ref.getLayout()` (or catch every change via `onLayoutChange`).
3. Save that JSON and pass it back as `initialLayout` — the board starts exactly there.

`x`/`y` are the center of each magnet as a percentage of the board (0–100), so a saved
layout is resolution-independent. `r` (degrees), `z` (layer) and `s` (scale) are written
once you rotate, restack or resize a magnet; omitted, a magnet uses its deterministic tilt,
the base layer, and its natural size.

## Selecting, layering, rotating, resizing

Pressing a magnet selects it; pressing the background deselects. A small menu appears beside
the selected magnet with layer (▲▼), rotate (⟲⟳) and size (−＋) controls, and follows the
magnet as it moves, rotates and scales. Pass `menu={false}` to hide it and drive everything
from the ref instead:

```tsx
board.current?.bringForward();   // up one layer — or bringForward('react')
board.current?.sendBackward();   // down one layer
board.current?.rotateBy(15);     // relative — good for buttons
board.current?.rotate(0);        // absolute — good for a slider or "straighten"
board.current?.resizeBy(0.15);   // relative scale
board.current?.resize(1.5);      // absolute scale (clamped to 0.4–3)
```

Every command targets the selection unless you pass an id, and each one changes only the
magnets it has to, so it survives export → import.

**Layering moves one step at a time.** `bringForward` swaps a magnet with the one directly
above it rather than jumping to the very front, so a magnet four layers down needs four
presses to clear the magnet above it. The stack is renumbered densely (1..n) as you go, which
keeps every step a two-magnet change.

## Performance

The board renders the magnet list once and holds no per-frame state. While you drag, the
position is written straight to the dragged element's transform on its own compositor layer,
so React does not re-render and any filter on the magnet rasterizes once instead of every
frame. Each magnet subscribes to the board for its own updates, so a drop, rotation, resize
or restack re-renders only the magnets that actually changed — never the board or its
siblings. Pass a memoized `renderMagnet` to keep this guarantee when the parent re-renders.

## Props

| prop | type | notes |
| --- | --- | --- |
| `items` | `string[] \| MagnetItem[]` | strings render as `<img src>`, url as id |
| `initialLayout` | `Record<id, {x,y,r?,z?,s?}>` | exported layout to start from |
| `renderMagnet` | `(item, index) => ReactNode` | defaults to `<img>` |
| `editable` | `boolean` | enable dragging and selection |
| `dieCut` | `boolean` | white sticker outline on default `<img>` magnets |
| `menu` | `boolean` | show the menu beside the selection (default `true`) |
| `onLayoutChange` | `(layout) => void` | called on every layout change |
| `onSelectionChange` | `(id \| null) => void` | called when the selection changes |
| `className` / `style` / `children` | — | you own the board look; `children` is the background |

Ref handle: `getLayout()`, `bringForward(id?)`, `sendBackward(id?)`, `rotate(deg, id?)`,
`rotateBy(delta, id?)`, `resize(scale, id?)`, `resizeBy(delta, id?)`.

## Develop

```bash
npm install
npm test           # vitest (happy-dom)
npm run test:watch # vitest in watch mode
npm run test:cov   # vitest with coverage thresholds
npm run lint       # biome
npm run typecheck  # tsc --noEmit
npm run build      # tsup -> dist
cd example && npm install && npm run dev   # live demo
```

The suite covers the pure layout helpers plus the board itself driven through real pointer
events: drag maths and clamping, selection, the menu's placement and controls, layer stepping,
the export → import round trip, and render counts that hold the "no sibling re-renders"
guarantee to account.

## Releasing

CI runs lint, typecheck, checks and both builds on every push and PR. Publishing is driven by
GitHub Releases: bump `version` in `package.json`, then publish a release tagged `v<version>`
(e.g. `v0.1.0`). The release workflow verifies the tag matches `package.json` and runs
`npm publish` with provenance, using an `NPM_TOKEN` repository secret.

## License

MIT
