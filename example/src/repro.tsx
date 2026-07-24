import { createRoot } from 'react-dom/client';
import { FaAws } from 'react-icons/fa6';
import { SiGo, SiTypescript } from 'react-icons/si';
import { MagnetBoard, type MagnetItem } from 'react-magneto';

// Regression check for the dieCut-on-inline-SVG report: react-icons magnets via renderMagnet,
// mixing 24-unit viewBoxes (SiGo, SiTypescript) with a 640x512 one (FaAws) and a raster <img>.
// The board now owns the outline, so no magnet applies `filter` itself.
const ICONS = { go: SiGo, ts: SiTypescript, aws: FaAws } as const;

const ITEMS: MagnetItem[] = [
  { id: 'go' },
  { id: 'ts' },
  { id: 'aws' },
  { id: 'img', src: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg' },
];

createRoot(document.getElementById('root') as HTMLElement).render(
  <div style={{ maxWidth: 900, margin: '32px auto', padding: 16 }}>
    <h2 style={{ margin: '0 0 4px' }}>dieCut on react-icons magnets</h2>
    <p style={{ color: '#666', marginTop: 0, fontSize: 13 }}>
      SiGo + SiTypescript (viewBox 24), FaAws (viewBox 640x512), and an &lt;img&gt;. All four
      should get the same outline weight, and none should be clipped.
    </p>
    <MagnetBoard
      items={ITEMS}
      editable
      dieCut
      initialLayout={{
        go: { x: 18, y: 50, r: 0 },
        ts: { x: 39, y: 50, r: 0 },
        aws: { x: 61, y: 50, r: 0 },
        img: { x: 82, y: 50, r: 0 },
      }}
      renderMagnet={(item) => {
        if (item.src) {
          return <img src={item.src as string} alt="" width={54} style={{ display: 'block' }} />;
        }
        const Icon = ICONS[item.id as keyof typeof ICONS];
        return <Icon size={54} />;
      }}
      style={{ aspectRatio: '16 / 7', borderRadius: 24, overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(155deg,#3a3a3c,#1b1b1d)',
        }}
      />
    </MagnetBoard>
  </div>,
);
