import { describe, expect, it } from 'vitest';
import type { Pos } from './types';
import { BASE_Z, stepZ } from './zorder';

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

  it('breaks ties by item order, so equal layers still step predictably', () => {
    const tied = stack([1, 1, 1]);
    // m2 sits last among equals, so stepping down puts it below m1.
    const next = applyZ(tied, stepZ(tied, 'm2', -1));
    expect(orderOf(next)).toEqual(['m0', 'm2', 'm1']);
  });
});
