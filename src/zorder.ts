import type { Pos } from './types';

/** Base stacking level for a magnet with no explicit `z`. */
export const BASE_Z = 1;

/** Temporary lift while dragging, so a back-layer magnet stays visible under the pointer. */
export const DRAG_Z = 999_999;

type Slot = { id: string; z: number; i: number };

// Bottom layer first. Entries arrive in item order, so sorting by z gives a stable
// tie-break for magnets that share a layer.
const ordered = (entries: Array<[string, Pos]>): Slot[] =>
  entries.map(([id, p], i) => ({ id, z: p.z ?? BASE_Z, i })).sort((a, b) => a.z - b.z || a.i - b.i);

// Renumber the stack densely (1..n) and report only the magnets whose z actually moved.
// Once dense, an adjacent swap reports just the two magnets involved.
const renumber = (order: Slot[]): Array<[string, number]> => {
  const changed: Array<[string, number]> = [];
  order.forEach((slot, k) => {
    const next = k + BASE_Z;
    if (slot.z !== next) changed.push([slot.id, next]);
  });
  return changed;
};

/**
 * Move one magnet a single layer up (`dir: 1`) or down (`dir: -1`).
 * Returns [] when it is already at the top/bottom, or the id is unknown.
 */
export function stepZ(
  entries: Array<[string, Pos]>,
  id: string,
  dir: 1 | -1,
): Array<[string, number]> {
  const order = ordered(entries);
  const from = order.findIndex((o) => o.id === id);
  const to = from + dir;
  if (from === -1 || to < 0 || to >= order.length) return [];
  [order[from], order[to]] = [order[to], order[from]];
  return renumber(order);
}

/**
 * Move one magnet all the way to the top or bottom of the stack, keeping the relative
 * order of everything else. Returns [] when it is already there, or the id is unknown.
 */
export function jumpZ(
  entries: Array<[string, Pos]>,
  id: string,
  edge: 'front' | 'back',
): Array<[string, number]> {
  const order = ordered(entries);
  const from = order.findIndex((o) => o.id === id);
  if (from === -1) return [];
  const to = edge === 'front' ? order.length - 1 : 0;
  if (from === to) return [];
  order.splice(to, 0, ...order.splice(from, 1));
  return renumber(order);
}
