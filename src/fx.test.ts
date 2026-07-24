import { describe, expect, it } from 'vitest';
import { magnetFx } from './fx';
import { defaultGrid } from './grid';
import { round } from './round';

describe('round', () => {
  it('trims float noise to two decimals by default', () => {
    expect(round(79.33333333333333)).toBe(79.33);
    expect(round(1.4499999999999997)).toBe(1.45);
    expect(round(50)).toBe(50);
    expect(round(-2.567)).toBe(-2.57);
  });

  it('honours an explicit precision', () => {
    expect(round(1.23456, 3)).toBe(1.235);
    expect(round(1.23456, 0)).toBe(1);
  });
});

describe('magnetFx', () => {
  it('is deterministic for the same id', () => {
    expect(magnetFx('React')).toEqual(magnetFx('React'));
    expect(magnetFx('a-very-long-id-🙂')).toEqual(magnetFx('a-very-long-id-🙂'));
  });

  it('keeps size and tilt within the documented range', () => {
    for (const id of ['React', 'Docker', 'Go', '', 'x', 'Postgres']) {
      const { size, angle } = magnetFx(id);
      expect(size).toBeGreaterThanOrEqual(46);
      expect(size).toBeLessThanOrEqual(72);
      expect(angle).toBeGreaterThanOrEqual(-12);
      expect(angle).toBeLessThanOrEqual(12);
    }
  });

  it('varies across ids, so magnets do not all look identical', () => {
    const ids = ['react', 'go', 'docker', 'redis', 'vite', 'node', 'graphql'];
    expect(new Set(ids.map((i) => magnetFx(i).angle)).size).toBeGreaterThan(1);
  });
});

describe('defaultGrid', () => {
  it('places every id inside the board', () => {
    const g = defaultGrid(['a', 'b', 'c', 'd', 'e']);
    expect(Object.keys(g)).toHaveLength(5);
    for (const { x, y } of Object.values(g)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    }
  });

  it('handles the degenerate sizes', () => {
    expect(defaultGrid([])).toEqual({});
    const one = defaultGrid(['solo']);
    expect(one.solo.x).toBeGreaterThan(0);
    expect(one.solo.y).toBeGreaterThan(0);
  });

  it('spreads a large set over multiple rows', () => {
    const g = defaultGrid(Array.from({ length: 24 }, (_, i) => `m${i}`));
    expect(new Set(Object.values(g).map((p) => p.y)).size).toBeGreaterThan(1);
  });

  it('emits export-friendly numbers', () => {
    const g = defaultGrid(['a', 'b', 'c']);
    expect(JSON.stringify(g)).not.toMatch(/\d\.\d{3,}/);
  });
});
