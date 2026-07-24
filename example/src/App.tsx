import { useRef, useState } from 'react';
import { type Layout, MagnetBoard, type MagnetBoardHandle, type MagnetItem } from 'react-magneto';

const CDN = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

// Real image links. Pass objects with an `id` so exported layout keys stay clean;
// the default renderer draws each `src` as an <img> — no renderMagnet needed.
// (The bare shorthand `items={['https://…/react.svg', …]}` also works, using the url as id.)
const ITEMS: MagnetItem[] = [
  { id: 'react', src: `${CDN}/react/react-original.svg` },
  { id: 'typescript', src: `${CDN}/typescript/typescript-original.svg` },
  { id: 'go', src: `${CDN}/go/go-original.svg` },
  { id: 'docker', src: `${CDN}/docker/docker-original.svg` },
  { id: 'postgresql', src: `${CDN}/postgresql/postgresql-original.svg` },
  { id: 'redis', src: `${CDN}/redis/redis-original.svg` },
  { id: 'kubernetes', src: `${CDN}/kubernetes/kubernetes-plain.svg` },
  { id: 'graphql', src: `${CDN}/graphql/graphql-plain.svg` },
  { id: 'vite', src: `${CDN}/vitejs/vitejs-original.svg` },
  { id: 'node', src: `${CDN}/nodejs/nodejs-original.svg` },
];

export function App() {
  const board = useRef<MagnetBoardHandle>(null);
  const [editable, setEditable] = useState(true);
  const [initial, setInitial] = useState<Layout | undefined>(undefined);
  const [json, setJson] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const exportLayout = () => {
    const layout = board.current?.getLayout() ?? {};
    const text = JSON.stringify(layout, null, 2);
    setJson(text);
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: 16 }}>
      <h1 style={{ marginBottom: 4 }}>magneto</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Drag the magnets. Select one to restack, rotate, or resize it from the menu that appears
        beside it. Export the layout, then reload it as the starting state.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" onClick={() => setEditable((e) => !e)}>
          {editable ? 'Lock' : 'Edit'}
        </button>
        <button type="button" onClick={exportLayout}>
          Export layout
        </button>
        <button type="button" onClick={() => setInitial(board.current?.getLayout())}>
          Snapshot as initial
        </button>
      </div>

      <p style={{ color: '#666', fontSize: 13, margin: '0 0 16px' }}>
        {selected
          ? `selected: ${selected} — use the menu above it to restack, rotate, or resize`
          : 'click a magnet to select it'}
      </p>

      <MagnetBoard
        ref={board}
        items={ITEMS}
        editable={editable}
        dieCut
        initialLayout={initial}
        onLayoutChange={(l) => console.log('layout', l)}
        onSelectionChange={setSelected}
        style={{ aspectRatio: '16 / 8', borderRadius: 28, overflow: 'hidden' }}
      >
        {/* dynamic background layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(155deg, #3a3a3c 0%, #2a2a2c 45%, #1b1b1d 100%)',
          }}
        />
      </MagnetBoard>

      {json && (
        <pre
          style={{
            marginTop: 16,
            background: '#111',
            color: '#8f8',
            padding: 12,
            borderRadius: 8,
            overflow: 'auto',
            maxHeight: 240,
          }}
        >
          {json}
        </pre>
      )}
    </div>
  );
}
