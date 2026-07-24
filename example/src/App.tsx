import { type ReactNode, useRef, useState } from 'react';
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
        <BarButton
          title={editable ? 'Lock the board so magnets cannot be moved' : 'Unlock to edit'}
          icon={editable ? <IconLock /> : <IconUnlock />}
          label={editable ? 'Lock' : 'Edit'}
          onClick={() => setEditable((e) => !e)}
        />
        <BarButton
          title="Copy the current layout as JSON"
          icon={<IconCopy />}
          label="Export layout"
          onClick={exportLayout}
        />
        <BarButton
          title="Use the current arrangement as the starting layout"
          icon={<IconCamera />}
          label="Snapshot as initial"
          onClick={() => setInitial(board.current?.getLayout())}
        />
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

/** Toolbar button: icon + label, with a native hover tip. */
function BarButton({
  title,
  icon,
  label,
  onClick,
}: {
  title: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 8,
        border: '1px solid #d4d4d8',
        background: '#fff',
        color: '#18181b',
        font: '500 13px/1 system-ui, sans-serif',
        cursor: 'pointer',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

const Svg = ({ children }: { children: ReactNode }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IconLock = () => (
  <Svg>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const IconUnlock = () => (
  <Svg>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </Svg>
);

const IconCopy = () => (
  <Svg>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Svg>
);

const IconCamera = () => (
  <Svg>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </Svg>
);
