import { describe, expect, it } from 'vitest';
import type { Pos } from './types';
import { BASE_Z, jumpZ, stepZ } from './zorder';

/** Build entries in item order; `undefined` means the magnet has no explicit z. */
const stack = (zs: Array<number | undefined>): Array<[string, Pos]> =>
  zs.map((z, i) => [`m${i}`, { x: 0, y: 0, ...(z === undefined ? {} : { z }) }]);

const applyZ = (entries: Array<[string, Pos]>, changed: Array<[string, number]>) =>
  entries.map(([k, p]) => {
    const hit = changed.find(([c]) => c === k);
    return [k, hit ? { ...p, z: hit[1] } : p] as [string, Pos];
  });

/** Ids from bottom layer to top. */
const orderOf = (entries: Array<[string, Pos]>) =>
  [...entries].sort((a, b) => (a[1].z ?? BASE_Z) - (b[1].z ?? BASE_Z)).map(([k]) => k);

describe('stepZ', () => {
  it('moves a magnet above its immediate neighbour on a flat stack', () => {
    // Everything implicit: m1 keeps z=1 so it is not reported, m2 shifts to 3 to stay dense.
    expect(stepZ(stack([undefined, undefined, undefined]), 'm0', 1).sort()).toEqual(
      [
        ['m0', 2],
        ['m2', 3],
      ].sort(),
    );
  });

  it('touches only the swapped pair once the stack is dense', () => {
    const dense = stack([1, 2, 3]);
    expect(stepZ(dense, 'm1', 1).sort()).toEqual(
      [
        ['m1', 3],
        ['m2', 2],
      ].sort(),
    );
    expect(stepZ(dense, 'm1', -1).sort()).toEqual(
      [
        ['m0', 2],
        ['m1', 1],
      ].sort(),
    );
  });

  it('is a no-op at the edges and for unknown ids', () => {
    const dense = stack([1, 2, 3]);
    expect(stepZ(dense, 'm2', 1)).toEqual([]);
    expect(stepZ(dense, 'm0', -1)).toEqual([]);
    expect(stepZ(dense, 'nope', 1)).toEqual([]);
    expect(stepZ([], 'm0', 1)).toEqual([]);
  });

  it('never leapfrogs: reaching the top of a 4-stack takes 3 steps', () => {
    let s = stack([1, 2, 3, 4]);
    s = applyZ(s, stepZ(s, 'm0', 1));
    expect(orderOf(s)).toEqual(['m1', 'm0', 'm2', 'm3']);
    s = applyZ(s, stepZ(s, 'm0', 1));
    expect(orderOf(s)).toEqual(['m1', 'm2', 'm0', 'm3']);
    s = applyZ(s, stepZ(s, 'm0', 1));
    expect(orderOf(s)).toEqual(['m1', 'm2', 'm3', 'm0']);
    // And now it is pinned at the top.
    expect(stepZ(s, 'm0', 1)).toEqual([]);
  });

  it('steps down symmetrically', () => {
    let s = stack([1, 2, 3, 4]);
    s = applyZ(s, stepZ(s, 'm3', -1));
    expect(orderOf(s)).toEqual(['m0', 'm1', 'm3', 'm2']);
    s = applyZ(s, stepZ(s, 'm3', -1));
    expect(orderOf(s)).toEqual(['m0', 'm3', 'm1', 'm2']);
  });

  it('renumbers a sparse stack densely while preserving its order', () => {
    const sparse = stack([-5, 40, 7]); // order: m0, m2, m1
    const next = applyZ(sparse, stepZ(sparse, 'm2', 1));
    expect(orderOf(next)).toEqual(['m0', 'm1', 'm2']);
    expect(next.map(([, p]) => p.z).sort()).toEqual([1, 2, 3]);
  });

  it('is the slow path: 3 steps to cross what jumpZ crosses in one', () => {
    const s = stack([1, 2, 3, 4]);
    expect(jumpZ(s, 'm0', 'front').length).toBeGreaterThan(0);
    // stepZ needs repeating; a single call leaves m0 one place up, not at the top.
    const once = applyZ(s, stepZ(s, 'm0', 1));
    expect(orderOf(once)).not.toEqual(['m1', 'm2', 'm3', 'm0']);
  });

  it('breaks ties by item order, so equal layers still step predictably', () => {
    const tied = stack([1, 1, 1]);
    // m2 sits last among equals, so stepping down puts it below m1.
    const next = applyZ(tied, stepZ(tied, 'm2', -1));
    expect(orderOf(next)).toEqual(['m0', 'm2', 'm1']);
  });
});

describe('jumpZ', () => {
  it('moves a magnet all the way to the top in one call', () => {
    const s = stack([1, 2, 3, 4]);
    const next = applyZ(s, jumpZ(s, 'm0', 'front'));
    expect(orderOf(next)).toEqual(['m1', 'm2', 'm3', 'm0']);
    expect(next.map(([, p]) => p.z).sort()).toEqual([1, 2, 3, 4]);
  });

  it('moves a magnet all the way to the bottom in one call', () => {
    const s = stack([1, 2, 3, 4]);
    const next = applyZ(s, jumpZ(s, 'm3', 'back'));
    expect(orderOf(next)).toEqual(['m3', 'm0', 'm1', 'm2']);
  });

  it('keeps the relative order of everything it jumps over', () => {
    const s = stack([1, 2, 3, 4, 5]);
    const next = applyZ(s, jumpZ(s, 'm2', 'front'));
    expect(orderOf(next)).toEqual(['m0', 'm1', 'm3', 'm4', 'm2']);
  });

  it('is a no-op when already at that edge, or for an unknown id', () => {
    const s = stack([1, 2, 3]);
    expect(jumpZ(s, 'm2', 'front')).toEqual([]);
    expect(jumpZ(s, 'm0', 'back')).toEqual([]);
    expect(jumpZ(s, 'nope', 'front')).toEqual([]);
    expect(jumpZ([], 'm0', 'back')).toEqual([]);
  });

  it('renumbers a sparse stack densely', () => {
    const s = stack([-40, undefined, 900]);
    const next = applyZ(s, jumpZ(s, 'm2', 'back'));
    expect(orderOf(next)).toEqual(['m2', 'm0', 'm1']);
    expect(next.map(([, p]) => p.z).sort()).toEqual([1, 2, 3]);
  });

  it('front then back returns the magnet to the far end, not its start', () => {
    let s = stack([1, 2, 3, 4]);
    s = applyZ(s, jumpZ(s, 'm1', 'front'));
    expect(orderOf(s)).toEqual(['m0', 'm2', 'm3', 'm1']);
    s = applyZ(s, jumpZ(s, 'm1', 'back'));
    expect(orderOf(s)).toEqual(['m1', 'm0', 'm2', 'm3']);
  });
});
