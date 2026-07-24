// Runnable with zero deps: `npm run check` (Node 22+ strips the TS types).
import assert from 'node:assert/strict';
import { magnetFx } from './src/fx.ts';
import { defaultGrid } from './src/grid.ts';
import type { Pos } from './src/types.ts';
import { BASE_Z, stepZ } from './src/zorder.ts';

// magnetFx is deterministic and stays in range.
assert.deepEqual(magnetFx('React'), magnetFx('React'), 'fx must be deterministic');
const fx = magnetFx('Docker');
assert.ok(fx.size >= 46 && fx.size <= 72, `size in range: ${fx.size}`);
assert.ok(fx.angle >= -12 && fx.angle <= 12, `angle in range: ${fx.angle}`);

// Grid coords land inside the board, one per id.
const g = defaultGrid(['a', 'b', 'c', 'd', 'e']);
assert.equal(Object.keys(g).length, 5);
for (const [id, { x, y }] of Object.entries(g)) {
  assert.ok(x >= 0 && x <= 100, `${id} x in range: ${x}`);
  assert.ok(y >= 0 && y <= 100, `${id} y in range: ${y}`);
}

// --- stepZ: one layer at a time, never a jump to the very front/back ---
const stack = (zs: Array<number | undefined>): Array<[string, Pos]> =>
  zs.map((z, i) => [`m${i}`, { x: 0, y: 0, ...(z === undefined ? {} : { z }) }]);

// A flat stack (everything implicit) renumbers densely in item order. Stepping m0 up puts
// it above m1; m1 keeps z=1 so it isn't reported, and m2 shifts to 3 to keep the stack dense.
assert.deepEqual(
  stepZ(stack([undefined, undefined, undefined]), 'm0', 1).sort(),
  [
    ['m0', 2],
    ['m2', 3],
  ].sort(),
  'up one layer from a flat stack lands m0 above m1',
);

// Already dense: a step touches exactly the two swapped magnets.
const dense = stack([1, 2, 3]);
assert.deepEqual(
  stepZ(dense, 'm1', 1).sort(),
  [
    ['m1', 3],
    ['m2', 2],
  ].sort(),
  'a dense stack only moves the swapped pair',
);
assert.deepEqual(
  stepZ(dense, 'm1', -1).sort(),
  [
    ['m0', 2],
    ['m1', 1],
  ].sort(),
  'stepping down swaps with the magnet below',
);

// Edges are no-ops, so repeated clicks can't drift the stack.
assert.deepEqual(stepZ(dense, 'm2', 1), [], 'top magnet cannot go further forward');
assert.deepEqual(stepZ(dense, 'm0', -1), [], 'bottom magnet cannot go further backward');
assert.deepEqual(stepZ(dense, 'nope', 1), [], 'unknown id is a no-op');

// One step never leapfrogs more than one neighbour: from the bottom of a 4-stack,
// three steps up are needed to reach the top.
let four = stack([1, 2, 3, 4]);
const applyZ = (entries: Array<[string, Pos]>, changed: Array<[string, number]>) =>
  entries.map(([k, p]) => {
    const hit = changed.find(([c]) => c === k);
    return [k, hit ? { ...p, z: hit[1] } : p] as [string, Pos];
  });
const orderOf = (entries: Array<[string, Pos]>) =>
  [...entries].sort((a, b) => (a[1].z ?? BASE_Z) - (b[1].z ?? BASE_Z)).map(([k]) => k);

four = applyZ(four, stepZ(four, 'm0', 1));
assert.deepEqual(orderOf(four), ['m1', 'm0', 'm2', 'm3'], 'one step up moves one place');
four = applyZ(four, stepZ(four, 'm0', 1));
four = applyZ(four, stepZ(four, 'm0', 1));
assert.deepEqual(orderOf(four), ['m1', 'm2', 'm3', 'm0'], 'three steps reach the top');

console.log('ok');
