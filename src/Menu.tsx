'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { Pos } from './types';

/** Above every magnet (whose z is renumbered densely from 1). */
export const MENU_Z = 1_000_000;
const GAP = 12;

export interface MenuProps {
  /** The selected magnet's element — measured so the menu tracks its size and rotation. */
  el: HTMLElement;
  boardEl: HTMLElement;
  /** Re-measured whenever this changes (move, rotate, resize, restack). */
  pos: Pos;
  onLayer: (dir: 1 | -1) => void;
  onRotate: (delta: number) => void;
  onResize: (delta: number) => void;
}

const btn: React.CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  padding: '2px 7px',
  borderRadius: 6,
  fontSize: 14,
  lineHeight: '20px',
  color: '#fff',
  textAlign: 'center',
  minWidth: 20,
};

export function Menu({ el, boardEl, pos, onLayer, onRotate, onResize }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ left: number; top: number; below: boolean } | null>(null);

  // Measure against the live element, so the menu follows rotation and scale for free.
  // The element's rect changes when the magnet moves, rotates, or resizes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `pos` is the re-measure trigger.
  useLayoutEffect(() => {
    const m = el.getBoundingClientRect();
    const b = boardEl.getBoundingClientRect();
    const half = (ref.current?.offsetWidth ?? 0) / 2;
    const above = m.top - b.top - GAP;
    setAt({
      left: Math.min(Math.max(m.left - b.left + m.width / 2, half), b.width - half),
      top: above < 0 ? m.bottom - b.top + GAP : above,
      below: above < 0,
    });
  }, [el, boardEl, pos]);

  return (
    <div
      ref={ref}
      // Keep presses inside the menu from reaching the board, which deselects.
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: at?.left ?? 0,
        top: at?.top ?? 0,
        transform: `translate(-50%, ${at?.below ? '0' : '-100%'})`,
        visibility: at ? 'visible' : 'hidden',
        zIndex: MENU_Z,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 4,
        borderRadius: 10,
        background: 'rgba(20,20,22,0.92)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(6px)',
        whiteSpace: 'nowrap',
        touchAction: 'none',
      }}
    >
      <button
        type="button"
        style={btn}
        aria-label="Bring forward one layer"
        title="Forward"
        onClick={() => onLayer(1)}
      >
        ▲
      </button>
      <button
        type="button"
        style={btn}
        aria-label="Send backward one layer"
        title="Backward"
        onClick={() => onLayer(-1)}
      >
        ▼
      </button>
      <Sep />
      <button
        type="button"
        style={btn}
        aria-label="Rotate left"
        title="Rotate left"
        onClick={() => onRotate(-15)}
      >
        ⟲
      </button>
      <button
        type="button"
        style={btn}
        aria-label="Rotate right"
        title="Rotate right"
        onClick={() => onRotate(15)}
      >
        ⟳
      </button>
      <Sep />
      <button
        type="button"
        style={btn}
        aria-label="Smaller"
        title="Smaller"
        onClick={() => onResize(-1)}
      >
        −
      </button>
      <button
        type="button"
        style={btn}
        aria-label="Bigger"
        title="Bigger"
        onClick={() => onResize(1)}
      >
        ＋
      </button>
    </div>
  );
}

const Sep = () => (
  <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.18)', margin: '0 2px' }} />
);
