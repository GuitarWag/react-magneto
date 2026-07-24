import type { Pos } from './types';

/** Base stacking level for a magnet with no explicit `z`. */
export const BASE_Z = 1;

/** Temporary lift while dragging, so a back-layer magnet stays visible under the pointer. */
export const DRAG_Z = 999_999;

// Lowest/highest z in use.
// ponytail: O(n) scan per call; fine at board scale (tens of magnets, one call per click).
export function zRange(positions: Iterable<Pos>): { min: number; max: number } {
  let min = BASE_Z;
  let max = BASE_Z;
  for (const p of positions) {
    const z = p.z ?? BASE_Z;
    if (z < min) min = z;
    if (z > max) max = z;
  }
  return { min, max };
}

/**
 * Move one magnet a single layer up (`dir: 1`) or down (`dir: -1`).
 *
 * Entries come in item order, so sorting by z is a stable tie-break for magnets sharing a
 * layer. The whole stack is then renumbered densely (1..n) and only the ids whose z actually
 * changed are returned — after the first call the stack is dense, so a step touches just the
 * two swapped magnets. Returns [] when the magnet is already at the top/bottom.
 */
export function stepZ(
  entries: Array<[string, Pos]>,
  id: string,
  dir: 1 | -1,
): Array<[string, number]> {
  const order = entries.map(([k, p], i) => ({ id: k, z: p.z ?? BASE_Z, i }));
  order.sort((a, b) => a.z - b.z || a.i - b.i);

  const from = order.findIndex((o) => o.id === id);
  const to = from + dir;
  if (from === -1 || to < 0 || to >= order.length) return [];
  [order[from], order[to]] = [order[to], order[from]];

  const changed: Array<[string, number]> = [];
  order.forEach((o, k) => {
    const next = k + BASE_Z;
    if (o.z !== next) changed.push([o.id, next]);
  });
  return changed;
}
