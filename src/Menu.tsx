'use client';

import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import {
  IconBackward,
  IconBigger,
  IconForward,
  IconRotateLeft,
  IconRotateRight,
  IconSmaller,
  IconToBack,
  IconToFront,
} from './icons';
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
  onJump: (edge: 'front' | 'back') => void;
  onLayer: (dir: 1 | -1) => void;
  onRotate: (delta: number) => void;
  onResize: (delta: number) => void;
}

const btn: CSSProperties = {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  width: 26,
  height: 26,
  borderRadius: 7,
  cursor: 'pointer',
  color: '#f4f4f5',
};

export function Menu({ el, boardEl, pos, onJump, onLayer, onRotate, onResize }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ left: number; top: number; below: boolean } | null>(null);
  // `x` is the hovered button's centre within the menu, so the tip points at that icon.
  const [hint, setHint] = useState<{ tip: string; x: number } | null>(null);
  const show = (tip: string) => (e: { currentTarget: HTMLButtonElement }) =>
    setHint({ tip, x: e.currentTarget.offsetLeft + e.currentTarget.offsetWidth / 2 });

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

  // Grouped layer / rotate / size controls, separated by a hairline.
  type Entry = { tip: string; icon: ReactNode; run: () => void } | { sep: string };
  const actions: Entry[] = [
    { tip: 'Bring to front', icon: <IconToFront />, run: () => onJump('front') },
    { tip: 'Forward one layer', icon: <IconForward />, run: () => onLayer(1) },
    { tip: 'Backward one layer', icon: <IconBackward />, run: () => onLayer(-1) },
    { tip: 'Send to back', icon: <IconToBack />, run: () => onJump('back') },
    { sep: 'after-layers' },
    { tip: 'Rotate left 15°', icon: <IconRotateLeft />, run: () => onRotate(-15) },
    { tip: 'Rotate right 15°', icon: <IconRotateRight />, run: () => onRotate(15) },
    { sep: 'after-rotate' },
    { tip: 'Smaller', icon: <IconSmaller />, run: () => onResize(-1) },
    { tip: 'Bigger', icon: <IconBigger />, run: () => onResize(1) },
  ];

  return (
    <div
      ref={ref}
      // Keep presses inside the menu from reaching the board, which deselects.
      onPointerDown={(e) => e.stopPropagation()}
      onPointerLeave={() => setHint(null)}
      style={{
        position: 'absolute',
        left: at?.left ?? 0,
        top: at?.top ?? 0,
        transform: `translate(-50%, ${at?.below ? '0' : '-100%'})`,
        visibility: at ? 'visible' : 'hidden',
        zIndex: MENU_Z,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: 4,
        borderRadius: 11,
        background: 'rgba(24,24,27,0.94)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
        whiteSpace: 'nowrap',
        touchAction: 'none',
      }}
    >
      {actions.map((a) =>
        'sep' in a ? (
          <span
            key={a.sep}
            style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.16)', margin: '0 3px' }}
          />
        ) : (
          <button
            key={a.tip}
            type="button"
            aria-label={a.tip}
            onClick={a.run}
            onPointerEnter={show(a.tip)}
            onFocus={show(a.tip)}
            onBlur={() => setHint(null)}
            style={{
              ...btn,
              background: hint?.tip === a.tip ? 'rgba(255,255,255,0.16)' : 'transparent',
            }}
          >
            {a.icon}
          </button>
        ),
      )}

      {/* Hover tip, on the far side from the magnet so it never covers it. */}
      {hint && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            left: hint.x,
            transform: 'translateX(-50%)',
            ...(at?.below ? { top: 'calc(100% + 6px)' } : { bottom: 'calc(100% + 6px)' }),
            padding: '3px 7px',
            borderRadius: 6,
            background: 'rgba(24,24,27,0.94)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: '#f4f4f5',
            font: '500 11px/1.4 system-ui, sans-serif',
            pointerEvents: 'none',
          }}
        >
          {hint.tip}
        </span>
      )}
    </div>
  );
}
