import type { Layout } from './types';

// Auto-arranged starting grid (center % of the board) for items without a saved position.
// Also the intro's origin: magnets spring from this aligned grid to their scattered layout.
export function defaultGrid(ids: string[]): Layout {
  const n = ids.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt(n * 2)));
  const rows = Math.max(1, Math.ceil(n / cols));
  const out: Layout = {};
  ids.forEach((id, i) => {
    const r = Math.floor(i / cols);
    const inRow = Math.min(cols, n - r * cols);
    const c = i % cols;
    out[id] = {
      x: ((c + 0.5) / inRow) * 88 + 6,
      y: ((r + 0.5) / rows) * 74 + 13,
    };
  });
  return out;
}
