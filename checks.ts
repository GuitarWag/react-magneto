// Runnable with zero deps: `npm run check` (Node 22+ strips the TS types).
import assert from 'node:assert/strict';
import { magnetFx } from './src/fx.ts';
import { defaultGrid } from './src/grid.ts';

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

console.log('ok');
