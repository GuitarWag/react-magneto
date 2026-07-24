/**
 * A magnet's saved state. `x`/`y` are its center as % of the board (0–100).
 * `r` is rotation in degrees — omitted means "use the deterministic tilt from the id".
 * `z` is the stacking order — omitted means the base layer (1).
 * `s` scales the magnet — omitted means 1 (its deterministic base size).
 */
export type Pos = { x: number; y: number; r?: number; z?: number; s?: number };

/** Saved positions, keyed by item id. */
export type Layout = Record<string, Pos>;

/** A magnet. `id` is required; `src` renders as an <img> by default; add your own fields. */
export type MagnetItem = { id: string; src?: string; [key: string]: unknown };
