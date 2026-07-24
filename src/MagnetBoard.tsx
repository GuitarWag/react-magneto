'use client';

import {
  type CSSProperties,
  forwardRef,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { DieCutFilter } from './dieCut';
import { defaultGrid } from './grid';
import { Magnet } from './Magnet';
import type { Layout, MagnetItem, Pos } from './types';

export interface MagnetBoardHandle {
  /** Read the current positions on demand — e.g. from an "export" button. */
  getLayout: () => Layout;
}

export interface MagnetBoardProps {
  /** PNG urls, or objects with an `id` (+ your own fields). */
  items: Array<string | MagnetItem>;
  /** Saved layout to start from — the JSON you exported earlier. */
  initialLayout?: Layout;
  /** Render a magnet yourself. Defaults to an `<img src>` (or the id as text). */
  renderMagnet?: (item: MagnetItem, index: number) => ReactNode;
  /** Enable dragging. */
  editable?: boolean;
  /** Apply the white "die-cut" sticker outline to default `<img>` magnets. */
  dieCut?: boolean;
  /** Fired after each drop with the full layout. */
  onLayoutChange?: (layout: Layout) => void;
  className?: string;
  style?: CSSProperties;
  /** Background layer, rendered behind the magnets. Anything: gradient, image, SVG. */
  children?: ReactNode;
}

export const MagnetBoard = forwardRef<MagnetBoardHandle, MagnetBoardProps>(function MagnetBoard(
  {
    items,
    initialLayout,
    renderMagnet,
    editable = false,
    dieCut = false,
    onLayoutChange,
    className,
    style,
    children,
  },
  ref,
) {
  const boardRef = useRef<HTMLDivElement>(null);

  // Keyed by ids so identity stays stable across unrelated parent re-renders.
  const idsKey = items.map((it) => (typeof it === 'string' ? it : it.id)).join('|');
  // biome-ignore lint/correctness/useExhaustiveDependencies: idsKey is the stable form of items.
  const magnets = useMemo<MagnetItem[]>(
    () => items.map((it) => (typeof it === 'string' ? { id: it, src: it } : it)),
    [idsKey],
  );
  const grid = useMemo(() => defaultGrid(magnets.map((m) => m.id)), [magnets]);

  // Positions live in a ref: mutating it never triggers a render. Existing (dragged)
  // positions are preserved across re-renders; initialLayout seeds only new ids.
  const posRef = useRef<Map<string, Pos>>(new Map());
  useMemo(() => {
    const next = new Map<string, Pos>();
    for (const m of magnets) {
      next.set(m.id, posRef.current.get(m.id) ?? initialLayout?.[m.id] ?? grid[m.id]);
    }
    posRef.current = next;
  }, [magnets, grid, initialLayout]);

  // Stable across renders so React.memo on <Magnet> holds.
  const cb = useRef(onLayoutChange);
  cb.current = onLayoutChange;
  const commit = useCallback((id: string, p: Pos) => {
    posRef.current.set(id, p);
    cb.current?.(Object.fromEntries(posRef.current));
  }, []);

  useImperativeHandle(ref, () => ({ getLayout: () => Object.fromEntries(posRef.current) }), []);

  return (
    <div ref={boardRef} className={className} style={{ position: 'relative', ...style }}>
      {dieCut && <DieCutFilter />}
      {children}
      {magnets.map((item, i) => (
        <Magnet
          key={item.id}
          item={item}
          index={i}
          initialPos={posRef.current.get(item.id) as Pos}
          gridPos={grid[item.id]}
          editable={editable}
          dieCut={dieCut}
          boardRef={boardRef}
          onCommit={commit}
          renderMagnet={renderMagnet}
        />
      ))}
    </div>
  );
});
