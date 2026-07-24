import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { stubRect } from '../test/setup';
import { MagnetBoard } from './MagnetBoard';
import { MENU_Z } from './Menu';

const BOARD = { left: 0, top: 0, width: 1000, height: 500 };

/**
 * Render a board, give the magnet a known rect, then select it — the menu measures against
 * that rect on mount, so placement is deterministic even though happy-dom does no layout.
 */
async function openMenuWith(magnetRect: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  const view = render(<MagnetBoard className="board" items={[{ id: 'react' }]} editable />);
  const board = view.container.querySelector('.board') as HTMLElement;
  const el = board.querySelector('div[title="react"]') as HTMLElement;
  stubRect(board, BOARD);
  stubRect(el, magnetRect);
  await waitFor(() => expect(el.style.opacity).toBe('1'));
  fireEvent.pointerDown(el, { clientX: 0, clientY: 0, pointerId: 1 });
  fireEvent.pointerUp(el, { clientX: 0, clientY: 0, pointerId: 1 });
  const menu = (await screen.findByLabelText('Rotate left')).parentElement as HTMLElement;
  return { ...view, menu, el };
}

describe('menu placement', () => {
  it('sits above the magnet when there is room, centred on it', async () => {
    const { menu } = await openMenuWith({ left: 400, top: 300, width: 60, height: 60 });
    await waitFor(() => expect(menu.style.top).toBe('288px')); // 300 - 12 gap
    expect(menu.style.left).toBe('430px'); // 400 + half of 60
    expect(menu.style.transform).toContain('-100%'); // anchored by its bottom edge
    expect(menu.style.visibility).toBe('visible');
  });

  it('flips below when the magnet is against the top edge', async () => {
    const { menu } = await openMenuWith({ left: 400, top: 4, width: 60, height: 60 });
    // No room above (4 - 12 < 0), so it hangs off the bottom: 4 + 60 + 12.
    await waitFor(() => expect(menu.style.top).toBe('76px'));
    expect(menu.style.transform).toContain('translate(-50%, 0)');
  });

  it('clamps to the board so it never overflows the right edge', async () => {
    const { menu } = await openMenuWith({ left: 1400, top: 300, width: 60, height: 60 });
    await waitFor(() => expect(menu.style.left).toBe('1000px'));
  });

  it('re-measures when the magnet moves', async () => {
    const { menu, el } = await openMenuWith({ left: 400, top: 300, width: 60, height: 60 });
    await waitFor(() => expect(menu.style.top).toBe('288px'));
    stubRect(el, { left: 100, top: 120, width: 60, height: 60 });
    fireEvent.click(screen.getByLabelText('Rotate right')); // any change re-anchors it
    await waitFor(() => expect(menu.style.top).toBe('108px'));
    expect(menu.style.left).toBe('130px');
  });

  it('renders above every magnet', async () => {
    const { menu } = await openMenuWith({ left: 400, top: 300, width: 60, height: 60 });
    expect(menu.style.zIndex).toBe(String(MENU_Z));
  });

  it('does not deselect the magnet when the menu itself is pressed', async () => {
    const { menu, el } = await openMenuWith({ left: 400, top: 300, width: 60, height: 60 });
    fireEvent.pointerDown(menu, { clientX: 430, clientY: 288, pointerId: 3 });
    await waitFor(() => expect(el.style.outline).toContain('dashed'));
    expect(screen.getByLabelText('Rotate left')).toBeTruthy();
  });
});
