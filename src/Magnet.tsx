'use client';

import { memo, type ReactNode, useEffect, useRef, useState } from 'react';
import { dieCutFilter } from './dieCut';
import { magnetFx } from './fx';
import type { MagnetItem, Pos } from './types';
import { BASE_Z, DRAG_Z } from './zorder';

export interface MagnetProps {
  item: MagnetItem;
  index: number;
  initialPos: Pos;
  gridPos: Pos;
  editable: boolean;
  dieCut: boolean;
  selected: boolean;
  boardRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Subscribe this magnet to board-driven updates (drag commits, rotate, resize, z-order)
   * and hand over its element so the board can position the menu against it.
   */
  register: (id: string, set: (p: Pos) => void, el: HTMLDivElement) => () => void;
  onGrab: (id: string) => void;
  onCommit: (id: string, pos: { x: number; y: number }) => void;
  renderMagnet?: (item: MagnetItem, index: number) => ReactNode;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function MagnetInner({
  item,
  index,
  initialPos,
  gridPos,
  editable,
  dieCut,
  selected,
  boardRef,
  register,
  onGrab,
  onCommit,
  renderMagnet,
}: MagnetProps) {
  const fx = magnetFx(item.id);
  const elRef = useRef<HTMLDivElement>(null);
  // Drag start: pointer position, board size, and the magnet's starting % — set on pointerdown.
  const drag = useRef<{
    cx: number;
    cy: number;
    bw: number;
    bh: number;
    x: number;
    y: number;
  } | null>(null);
  const [pos, setPos] = useState(initialPos);
  const [mounted, setMounted] = useState(false);

  // The board owns the layout; it pushes changes here so a command touches one magnet only.
  useEffect(() => {
    const el = elRef.current;
    return el ? register(item.id, setPos, el) : undefined;
  }, [register, item.id]);

  // One-time intro: spring from the aligned grid to the resting layout, staggered.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // left/top stay fixed while dragging; movement rides on transform, so the (filtered)
  // element rasterizes once and the compositor just repositions the cached layer.
  const angle = pos.r ?? fx.angle;
  const scale = pos.s ?? 1;
  const base = `translate(-50%, -50%) rotate(${mounted ? angle : 0}deg) scale(${mounted ? scale : 0.4})`;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!editable || !elRef.current || !boardRef.current) return;
    e.preventDefault();
    e.stopPropagation(); // the board deselects on background presses
    onGrab(item.id); // select + raise above siblings
    const r = boardRef.current.getBoundingClientRect();
    drag.current = { cx: e.clientX, cy: e.clientY, bw: r.width, bh: r.height, x: pos.x, y: pos.y };
    elRef.current.setPointerCapture(e.pointerId);
    elRef.current.style.transition = 'none';
    elRef.current.style.willChange = 'transform'; // promote to its own compositor layer
    elRef.current.style.zIndex = String(DRAG_Z); // lift for the gesture only
    elRef.current.style.cursor = 'grabbing';
  };

  // Clamped target position (%) for the current pointer.
  const target = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current as NonNullable<typeof drag.current>;
    return {
      x: clamp(d.x + ((e.clientX - d.cx) / d.bw) * 100, 3, 97),
      y: clamp(d.y + ((e.clientY - d.cy) / d.bh) * 100, 5, 95),
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !elRef.current) return;
    const t = target(e);
    const dx = ((t.x - drag.current.x) / 100) * drag.current.bw;
    const dy = ((t.y - drag.current.y) / 100) * drag.current.bh;
    // Compositor-only update — the board and every other magnet stay frozen.
    elRef.current.style.transform = `translate(${dx}px, ${dy}px) ${base}`;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !elRef.current) return;
    const t = target(e);
    drag.current = null;
    // Drop the drag transform and let the committed left/top take over in the same paint.
    elRef.current.style.transform = base;
    elRef.current.style.transition = '';
    elRef.current.style.willChange = '';
    // Back to the magnet's own layer — set explicitly, so React's next write agrees.
    elRef.current.style.zIndex = String(pos.z ?? BASE_Z);
    elRef.current.style.cursor = 'grab';
    onCommit(item.id, t); // board writes it back through `register` — one render, this magnet
  };

  const p = mounted ? pos : gridPos;

  return (
    <div
      ref={elRef}
      title={item.id}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'absolute',
        left: `${p.x}%`,
        top: `${p.y}%`,
        transform: base,
        opacity: mounted ? 1 : 0,
        transition: `left .35s ease, top .35s ease, transform .45s cubic-bezier(.34,1.56,.64,1) ${index * 0.04}s, opacity .35s ${index * 0.04}s`,
        cursor: editable ? 'grab' : 'default',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: pos.z ?? BASE_Z,
        outline: selected ? '2px dashed rgba(255,255,255,0.9)' : undefined,
        outlineOffset: selected ? 4 : undefined,
      }}
    >
      {renderMagnet ? (
        renderMagnet(item, index)
      ) : item.src ? (
        <img
          src={item.src}
          alt={item.id}
          width={fx.size}
          draggable={false}
          style={{ display: 'block', filter: dieCut ? dieCutFilter : undefined }}
        />
      ) : (
        <span>{item.id}</span>
      )}
    </div>
  );
}

// Memoized: with stable props, dragging one magnet never re-renders its siblings.
export const Magnet = memo(MagnetInner);
