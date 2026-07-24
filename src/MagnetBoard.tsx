'use client';

import {
  type CSSProperties,
  forwardRef,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DieCutFilter } from './dieCut';
import { magnetFx } from './fx';
import { defaultGrid } from './grid';
import { Magnet } from './Magnet';
import { Menu } from './Menu';
import { round } from './round';
import type { Layout, MagnetItem, Pos } from './types';
import { jumpZ, stepZ } from './zorder';

/** How much one menu press changes scale, and the range it stays inside. */
const SIZE_STEP = 0.15;
const MIN_SCALE = 0.4;
const MAX_SCALE = 3;

export interface MagnetBoardHandle {
  /** Read the current layout on demand — e.g. from an "export" button. */
  getLayout: () => Layout;
  /** Move above every other magnet. Defaults to the selected magnet. */
  bringToFront: (id?: string) => void;
  /** Move below every other magnet. Defaults to the selected magnet. */
  sendToBack: (id?: string) => void;
  /** Move up exactly one layer. Defaults to the selected magnet. */
  bringForward: (id?: string) => void;
  /** Move down exactly one layer. Defaults to the selected magnet. */
  sendBackward: (id?: string) => void;
  /** Set absolute rotation in degrees. Defaults to the selected magnet. */
  rotate: (deg: number, id?: string) => void;
  /** Rotate by a delta in degrees. Defaults to the selected magnet. */
  rotateBy: (delta: number, id?: string) => void;
  /** Set absolute scale (1 = the magnet's base size). Defaults to the selected magnet. */
  resize: (scale: number, id?: string) => void;
  /** Scale by a delta. Defaults to the selected magnet. */
  resizeBy: (delta: number, id?: string) => void;
}

export interface MagnetBoardProps {
  /** PNG urls, or objects with an `id` (+ your own fields). */
  items: Array<string | MagnetItem>;
  /** Saved layout to start from — the JSON you exported earlier. */
  initialLayout?: Layout;
  /** Render a magnet yourself. Defaults to an `<img src>` (or the id as text). */
  renderMagnet?: (item: MagnetItem, index: number) => ReactNode;
  /** Enable dragging and selection. */
  editable?: boolean;
  /** Apply the white "die-cut" sticker outline to default `<img>` magnets. */
  dieCut?: boolean;
  /** Show the layer/rotate/size menu beside the selected magnet. Defaults to true. */
  menu?: boolean;
  /** Fired after each drop, rotation, resize, or restack with the full layout. */
  onLayoutChange?: (layout: Layout) => void;
  /** Fired when the selected magnet changes (null when deselected). */
  onSelectionChange?: (id: string | null) => void;
  className?: string;
  style?: CSSProperties;
  /** Background layer, rendered behind the magnets. Anything: gradient, image, SVG. */
  children?: ReactNode;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const MagnetBoard = forwardRef<MagnetBoardHandle, MagnetBoardProps>(function MagnetBoard(
  {
    items,
    initialLayout,
    renderMagnet,
    editable = false,
    dieCut = false,
    menu = true,
    onLayoutChange,
    onSelectionChange,
    className,
    style,
    children,
  },
  ref,
) {
  const boardRef = useRef<HTMLDivElement>(null);
  // Selection carries the magnet's current Pos so the menu can re-anchor after every change.
  const [sel, setSel] = useState<{ id: string; pos: Pos } | null>(null);
  const [dragging, setDragging] = useState(false);

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

  // Each magnet registers its own setter and element, so a change reaches exactly one
  // component — no board render, no sibling renders.
  const reg = useRef<Map<string, { set: (p: Pos) => void; el: HTMLElement }>>(new Map());
  const register = useCallback((id: string, set: (p: Pos) => void, el: HTMLElement) => {
    reg.current.set(id, { set, el });
    return () => {
      reg.current.delete(id);
    };
  }, []);

  // Latest callbacks in refs, so the props passed to memoized <Magnet>s stay stable.
  const layoutCb = useRef(onLayoutChange);
  layoutCb.current = onLayoutChange;
  const selectCb = useRef(onSelectionChange);
  selectCb.current = onSelectionChange;
  const selectedRef = useRef<string | null>(null);

  const applyMany = useCallback((patches: Array<[string, Partial<Pos>]>) => {
    for (const [id, patch] of patches) {
      const cur = posRef.current.get(id);
      if (!cur) continue;
      const next = { ...cur, ...patch };
      posRef.current.set(id, next);
      reg.current.get(id)?.set(next);
      if (id === selectedRef.current) setSel({ id, pos: next });
    }
    layoutCb.current?.(Object.fromEntries(posRef.current));
  }, []);

  const apply = useCallback(
    (id: string, patch: Partial<Pos>) => applyMany([[id, patch]]),
    [applyMany],
  );

  const select = useCallback((id: string | null) => {
    const pos = id ? posRef.current.get(id) : undefined;
    setSel(id && pos ? { id, pos } : null);
    if (selectedRef.current === id) return;
    selectedRef.current = id;
    selectCb.current?.(id);
  }, []);

  // Grabbing selects but never restacks — layering is the user's call, via the menu.
  const onGrab = useCallback(
    (id: string) => {
      select(id);
      setDragging(true);
    },
    [select],
  );

  const commit = useCallback(
    (id: string, p: { x: number; y: number }) => {
      setDragging(false);
      const next = { x: round(p.x), y: round(p.y) };
      const cur = posRef.current.get(id);
      if (cur && cur.x === next.x && cur.y === next.y) return; // a plain click, not a move
      apply(id, next);
    },
    [apply],
  );

  const layer = useCallback(
    (id: string, dir: 1 | -1) => {
      const changed = stepZ([...posRef.current.entries()], id, dir);
      if (changed.length) applyMany(changed.map(([k, z]) => [k, { z }]));
    },
    [applyMany],
  );

  const jump = useCallback(
    (id: string, edge: 'front' | 'back') => {
      const changed = jumpZ([...posRef.current.entries()], id, edge);
      if (changed.length) applyMany(changed.map(([k, z]) => [k, { z }]));
    },
    [applyMany],
  );

  const rotateBy = useCallback(
    (id: string, delta: number) =>
      // No explicit rotation yet means the magnet is sitting at its deterministic tilt.
      apply(id, { r: round((posRef.current.get(id)?.r ?? magnetFx(id).angle) + delta) }),
    [apply],
  );

  const resizeBy = useCallback(
    (id: string, delta: number) =>
      apply(id, {
        s: round(clamp((posRef.current.get(id)?.s ?? 1) + delta, MIN_SCALE, MAX_SCALE), 3),
      }),
    [apply],
  );

  useImperativeHandle(ref, () => {
    // Commands act on an explicit id, falling back to the current selection.
    const pick = (id?: string) => id ?? selectedRef.current ?? undefined;
    const on = (id: string | undefined, fn: (t: string) => void) => {
      if (id) fn(id);
    };
    return {
      getLayout: () => Object.fromEntries(posRef.current),
      bringToFront: (id) => on(pick(id), (t) => jump(t, 'front')),
      sendToBack: (id) => on(pick(id), (t) => jump(t, 'back')),
      bringForward: (id) => on(pick(id), (t) => layer(t, 1)),
      sendBackward: (id) => on(pick(id), (t) => layer(t, -1)),
      rotate: (deg, id) => on(pick(id), (t) => apply(t, { r: round(deg) })),
      rotateBy: (delta, id) => on(pick(id), (t) => rotateBy(t, delta)),
      resize: (scale, id) =>
        on(pick(id), (t) => apply(t, { s: round(clamp(scale, MIN_SCALE, MAX_SCALE), 3) })),
      resizeBy: (delta, id) => on(pick(id), (t) => resizeBy(t, delta)),
    };
  }, [apply, layer, jump, rotateBy, resizeBy]);

  const selEl = sel ? reg.current.get(sel.id)?.el : undefined;

  return (
    <div
      ref={boardRef}
      className={className}
      style={{ position: 'relative', ...style }}
      onPointerDown={editable ? () => select(null) : undefined}
    >
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
          selected={sel?.id === item.id}
          boardRef={boardRef}
          register={register}
          onGrab={onGrab}
          onCommit={commit}
          renderMagnet={renderMagnet}
        />
      ))}
      {/* Hidden mid-drag so it never chases the magnet (and costs nothing per frame). */}
      {menu && editable && sel && selEl && boardRef.current && !dragging && (
        <Menu
          el={selEl}
          boardEl={boardRef.current}
          pos={sel.pos}
          onJump={(edge) => jump(sel.id, edge)}
          onLayer={(dir) => layer(sel.id, dir)}
          onRotate={(delta) => rotateBy(sel.id, delta)}
          onResize={(dir) => resizeBy(sel.id, dir * SIZE_STEP)}
        />
      )}
    </div>
  );
});
