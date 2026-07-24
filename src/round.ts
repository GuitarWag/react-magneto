/**
 * Layouts get exported and pasted into source, so every value that lands in one is rounded:
 * raw floats read badly (79.33333333333333) and repeated steps accumulate error
 * (1 + 0.15 * 3 is 1.4499999999999997). Two decimals of a percentage is sub-pixel on any
 * realistic board.
 */
export const round = (v: number, places = 2) => {
  const f = 10 ** places;
  return Math.round(v * f) / f;
};
