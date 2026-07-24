export type Pos = { x: number; y: number };

/** Saved positions, keyed by item id. Center of each magnet as % of the board (0–100). */
export type Layout = Record<string, Pos>;

/** A magnet. `id` is required; `src` renders as an <img> by default; add your own fields. */
export type MagnetItem = { id: string; src?: string; [key: string]: unknown };
