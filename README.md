# magneto

Draggable fridge-magnet board for React. Headless, zero runtime deps, and built so
**dragging one magnet never re-renders the others or the board**.

## Install

```bash
npm i magneto
```

`react` and `react-dom` (>=18) are peer dependencies.

## Usage

```tsx
import { MagnetBoard } from 'magneto';

// Simplest: an array of PNG urls.
<MagnetBoard items={['/react.png', '/go.png', '/docker.png']} editable />
```

```tsx
// Custom magnets, a dynamic background, and layout export/import.
import { MagnetBoard, type MagnetBoardHandle, type Layout } from 'magneto';
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
        onLayoutChange={(l) => save(l)}      // fired on each drop
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

1. Render with `editable` and drag the magnets around.
2. Read the current positions with `ref.getLayout()` (or catch each drop via `onLayoutChange`).
3. Save that JSON and pass it back as `initialLayout` — the board starts exactly there.

Positions are the center of each magnet as a percentage of the board (0–100), so a
saved layout is resolution-independent.

## Performance

The board renders the magnet list once and holds no per-frame state. While you drag,
positions are written straight to the dragged element's DOM node — React does not
re-render during the move. On drop, one magnet commits its resting position (a single
render of that magnet). Pass a memoized `renderMagnet` to keep this guarantee when the
board's parent re-renders.

## Props

| prop | type | notes |
| --- | --- | --- |
| `items` | `string[] \| MagnetItem[]` | strings render as `<img src>`, url as id |
| `initialLayout` | `Record<id, {x,y}>` | exported layout to start from |
| `renderMagnet` | `(item, index) => ReactNode` | defaults to `<img>` |
| `editable` | `boolean` | enable dragging |
| `onLayoutChange` | `(layout) => void` | called on each drop |
| `className` / `style` / `children` | — | you own the board look; `children` is the background |

## Develop

```bash
npm install
npm run check      # runnable assertions (Node 22+)
npm run lint       # biome
npm run build      # tsup -> dist
cd example && npm install && npm run dev   # live demo
```
