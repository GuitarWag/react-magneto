// Deterministic per-magnet size + tilt, derived from the id.
// Stable across renders and export so the scatter never jumps.
export function magnetFx(id: string): { size: number; angle: number } {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const sizes = [46, 54, 54, 62, 72];
  return { size: sizes[h % sizes.length], angle: ((h >> 3) % 25) - 12 };
}
