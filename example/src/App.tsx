import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaApple, FaAws } from 'react-icons/fa6';
import {
  SiBun,
  SiDocker,
  SiGo,
  SiGraphql,
  SiKubernetes,
  SiNodedotjs,
  SiPostgresql,
  SiPython,
  SiReact,
  SiRedis,
  SiRust,
  SiTerraform,
  SiTypescript,
  SiVite,
} from 'react-icons/si';
import { type Layout, MagnetBoard, type MagnetBoardHandle, type MagnetItem } from 'react-magneto';
import { mono, t } from './tokens';
import {
  Button,
  IconGithub,
  IconLock,
  IconPackage,
  IconReset,
  IconShuffle,
  IconSticker,
  IconUnlock,
  InstallLine,
  Link,
  Swatch,
} from './ui';

// Bundled icons rather than a CDN, so the deployed playground works offline and can't be
// broken by a third party. Deliberately mixes 24-unit viewBoxes with FaAws/FaApple (640x512)
// to show the die-cut outline coming out the same weight on both.
const LOGOS = [
  { id: 'typescript', Icon: SiTypescript, color: '#3178C6' },
  { id: 'react', Icon: SiReact, color: '#61DAFB' },
  { id: 'go', Icon: SiGo, color: '#00ADD8' },
  { id: 'rust', Icon: SiRust, color: '#DEA584' },
  { id: 'python', Icon: SiPython, color: '#3776AB' },
  { id: 'node', Icon: SiNodedotjs, color: '#339933' },
  { id: 'bun', Icon: SiBun, color: '#FBF0DF' },
  { id: 'vite', Icon: SiVite, color: '#A259FF' },
  { id: 'graphql', Icon: SiGraphql, color: '#E10098' },
  { id: 'postgres', Icon: SiPostgresql, color: '#4F8DBE' },
  { id: 'redis', Icon: SiRedis, color: '#FF4438' },
  { id: 'docker', Icon: SiDocker, color: '#2496ED' },
  { id: 'kubernetes', Icon: SiKubernetes, color: '#326CE5' },
  { id: 'terraform', Icon: SiTerraform, color: '#7B42BC' },
  { id: 'aws', Icon: FaAws, color: '#FF9900' },
  { id: 'apple', Icon: FaApple, color: '#F5F5F7' },
] as const;

const ITEMS: MagnetItem[] = LOGOS.map(({ id }) => ({ id }));

/** Outline colours offered in the playground; `dieCut` accepts any CSS colour. */
const OUTLINES = [
  { label: 'White outline', color: '#fff' },
  { label: 'Green outline', color: '#22C55E' },
  { label: 'Ink outline', color: '#0B1120' },
] as const;
const BY_ID = new Map(LOGOS.map((l) => [l.id, l]));

const card: CSSProperties = {
  border: `1px solid ${t.border}`,
  background: t.surface,
  borderRadius: t.radiusLg,
};

/** Tracks a media query, so magnet size can follow the viewport. */
function useMedia(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

export function App() {
  const board = useRef<MagnetBoardHandle>(null);
  const [editable, setEditable] = useState(true);
  const [dieCut, setDieCut] = useState(true);
  const [outline, setOutline] = useState<string>(OUTLINES[0].color);
  const [selected, setSelected] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>({});
  const [seed, setSeed] = useState(0); // remount key: re-runs the intro animation
  const compact = useMedia('(max-width: 720px)');
  const iconSize = compact ? 30 : 54;

  // Stable identity keeps React.memo on each magnet intact, which is the whole point of the
  // library's render-free drag.
  const renderMagnet = useCallback(
    (item: MagnetItem) => {
      const logo = BY_ID.get(item.id as (typeof LOGOS)[number]['id']);
      if (!logo) return <span>{item.id}</span>;
      return <logo.Icon size={iconSize} color={logo.color} aria-label={item.id} />;
    },
    [iconSize],
  );

  const json = useMemo(() => JSON.stringify(layout, null, 2), [layout]);
  const count = Object.keys(layout).length;

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: `${t.s12}px ${t.s4}px ${t.s12}px`,
        color: t.fg,
        font: '400 15px/1.6 Inter, system-ui, sans-serif',
      }}
    >
      {/* ---------- hero ---------- */}
      <header style={{ marginBottom: t.s8 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: t.s2,
            padding: `${t.s1}px ${t.s3}px`,
            marginBottom: t.s4,
            borderRadius: 999,
            border: `1px solid ${t.border}`,
            background: t.surface,
            color: t.accent,
            font: `500 12px/1 ${mono}`,
          }}
        >
          <IconSticker />
          react-magneto
        </div>
        <h1
          style={{
            margin: `0 0 ${t.s3}px`,
            font: '600 clamp(28px, 5vw, 44px)/1.1 Inter, system-ui, sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          A drag-around magnet board for React.
        </h1>
        <p
          style={{
            margin: `0 0 ${t.s6}px`,
            maxWidth: '58ch',
            color: t.fgMuted,
            fontSize: 17,
          }}
        >
          Arrange the stickers below, then export the arrangement as JSON and feed it straight back
          in as the starting layout. Dragging one magnet re-renders nothing else — not its siblings,
          not the board.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: t.s3, alignItems: 'center' }}>
          <InstallLine cmd="npm i react-magneto" />
          <Link href="https://github.com/GuitarWag/react-magneto">
            <IconGithub />
            GitHub
          </Link>
          <Link href="https://www.npmjs.com/package/react-magneto">
            <IconPackage />
            npm
          </Link>
        </div>
      </header>

      {/* ---------- the board ---------- */}
      <section aria-label="Interactive board" style={{ marginBottom: t.s6 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: t.s2,
            alignItems: 'center',
            marginBottom: t.s3,
          }}
        >
          <Button
            onClick={() => setEditable((v) => !v)}
            title={editable ? 'Lock the board' : 'Unlock to rearrange'}
            pressed={!editable}
          >
            {editable ? <IconUnlock /> : <IconLock />}
            {editable ? 'Editing' : 'Locked'}
          </Button>
          <Button
            onClick={() => setDieCut((v) => !v)}
            title="Toggle the die-cut sticker outline"
            pressed={dieCut}
          >
            <IconSticker />
            Die-cut
          </Button>
          {/* Each swatch names itself ("Green outline") and reports aria-pressed, so the row
              needs no group semantics of its own. */}
          {dieCut && (
            <span style={{ display: 'inline-flex', gap: t.s1 }}>
              {OUTLINES.map((o) => (
                <Swatch
                  key={o.color}
                  color={o.color}
                  label={o.label}
                  selected={outline === o.color}
                  onClick={() => setOutline(o.color)}
                />
              ))}
            </span>
          )}
          <Button
            onClick={() => {
              setLayout({});
              setSeed((s) => s + 1);
            }}
            title="Reset every magnet to the automatic grid"
          >
            <IconReset />
            Reset
          </Button>
          <Button onClick={() => setSeed((s) => s + 1)} title="Replay the intro animation">
            <IconShuffle />
            Replay intro
          </Button>
          <span
            aria-live="polite"
            style={{ marginLeft: 'auto', color: t.fgMuted, font: `12px/1 ${mono}` }}
          >
            {selected ? `selected: ${selected}` : `${LOGOS.length} magnets · click one`}
          </span>
        </div>

        <MagnetBoard
          key={seed}
          ref={board}
          items={ITEMS}
          editable={editable}
          dieCut={dieCut ? { color: outline } : false}
          renderMagnet={renderMagnet}
          onSelectionChange={setSelected}
          onLayoutChange={setLayout}
          className="board"
          style={{
            ...card,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          }}
        >
          {/* board surface: ambient wash + grid, well under the 4.5:1 text areas */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(60% 70% at 22% 18%, rgba(34,197,94,0.10), transparent 60%),
                radial-gradient(50% 60% at 82% 82%, rgba(99,102,241,0.12), transparent 60%),
                linear-gradient(155deg, #1B2438 0%, #141C2C 45%, #0E1524 100%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.5,
              backgroundImage: `linear-gradient(${t.border} 1px, transparent 1px),
                                linear-gradient(90deg, ${t.border} 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(70% 70% at 50% 50%, #000 30%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(70% 70% at 50% 50%, #000 30%, transparent 100%)',
            }}
          />
        </MagnetBoard>

        <p style={{ margin: `${t.s3}px 0 0`, color: t.fgFaint, fontSize: 13 }}>
          {editable
            ? 'Drag a magnet, or select one to restack, rotate and resize it from the menu that appears beside it.'
            : 'Locked — the board renders exactly the saved layout, with no interaction.'}
        </p>
      </section>

      {/* ---------- live layout ---------- */}
      <section
        aria-label="Exported layout"
        style={{ ...card, padding: t.s4, marginBottom: t.s8, overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: t.s3, marginBottom: t.s3 }}>
          <h2 style={{ margin: 0, font: '600 15px/1 Inter, system-ui, sans-serif' }}>
            Live layout
          </h2>
          <span style={{ color: t.fgFaint, font: `12px/1 ${mono}` }}>
            {count ? `${count} entries · updates on every change` : 'move a magnet to populate'}
          </span>
        </div>
        {/* The scroll container is a named <section> so keyboard users can focus and scroll it
            (WCAG 2.1.1) without hanging a tabindex off non-interactive <pre>. */}
        <section
          aria-label="Exported layout JSON"
          // A scrollable region must be keyboard-reachable (WCAG 2.1.1).
          // biome-ignore lint/a11y/noNoninteractiveTabindex: scroll container, focus is intended.
          tabIndex={0}
          style={{
            maxHeight: 220,
            overflow: 'auto',
            padding: t.s3,
            borderRadius: t.radius,
            background: t.bg,
            border: `1px solid ${t.border}`,
          }}
        >
          <pre
            style={{ margin: 0, color: count ? '#9AE6B4' : t.fgFaint, font: `12px/1.6 ${mono}` }}
          >
            {count ? json : '{}'}
          </pre>
        </section>
        <p style={{ margin: `${t.s3}px 0 0`, color: t.fgMuted, fontSize: 13 }}>
          Pass this back as <code style={{ font: `12px ${mono}`, color: t.fg }}>initialLayout</code>{' '}
          and the board starts exactly here. Coordinates are percentages, so a saved layout is
          resolution-independent.
        </p>
      </section>

      <footer
        style={{
          color: t.fgFaint,
          fontSize: 13,
          borderTop: `1px solid ${t.border}`,
          paddingTop: t.s4,
        }}
      >
        MIT · built with react-magneto ·{' '}
        <a href="https://github.com/GuitarWag/react-magneto" style={{ color: t.fgMuted }}>
          source
        </a>
      </footer>
    </main>
  );
}
