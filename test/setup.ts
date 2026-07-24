// happy-dom has no pointer capture, and the board's drag math needs a real board rect.
// Both are stubbed here so tests exercise the production code paths unchanged.

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Tests import vitest helpers explicitly rather than using globals, so Testing Library's
// automatic cleanup never registers itself — without this, boards pile up in document.body
// and `screen` queries match elements from earlier tests.
afterEach(cleanup);

if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.hasPointerCapture = () => false;
}

export type Rect = { left: number; top: number; width: number; height: number };

/** Give one element a fixed rect (happy-dom reports all zeros, which would divide by zero). */
export function stubRect(el: Element, r: Rect) {
  el.getBoundingClientRect = () =>
    ({
      ...r,
      right: r.left + r.width,
      bottom: r.top + r.height,
      x: r.left,
      y: r.top,
      toJSON: () => r,
    }) as DOMRect;
}
