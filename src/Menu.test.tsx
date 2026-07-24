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
  const menu = (await screen.findByLabelText('Rotate left 15°')).parentElement as HTMLElement;
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
    fireEvent.click(screen.getByLabelText('Rotate right 15°')); // any change re-anchors it
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
    expect(screen.getByLabelText('Rotate left 15°')).toBeTruthy();
  });
});

describe('menu icons and hover tips', () => {
  const RECT = { left: 400, top: 300, width: 60, height: 60 };

  it('offers all eight controls, each with an svg icon', async () => {
    const { menu } = await openMenuWith(RECT);
    const buttons = [...menu.querySelectorAll('button')];
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Bring to front',
      'Forward one layer',
      'Backward one layer',
      'Send to back',
      'Rotate left 15°',
      'Rotate right 15°',
      'Smaller',
      'Bigger',
    ]);
    // Icons are inline svg, not text glyphs.
    for (const b of buttons) {
      expect(b.querySelector('svg')).toBeTruthy();
      expect(b.textContent).toBe('');
    }
  });

  it('shows a tip on hover and clears it on leave', async () => {
    const { menu } = await openMenuWith(RECT);
    expect(menu.querySelector('[role="tooltip"]')).toBeNull();

    fireEvent.pointerEnter(screen.getByLabelText('Send to back'));
    await waitFor(() =>
      expect(menu.querySelector('[role="tooltip"]')?.textContent).toBe('Send to back'),
    );

    fireEvent.pointerEnter(screen.getByLabelText('Bigger'));
    await waitFor(() => expect(menu.querySelector('[role="tooltip"]')?.textContent).toBe('Bigger'));

    fireEvent.pointerLeave(menu);
    await waitFor(() => expect(menu.querySelector('[role="tooltip"]')).toBeNull());
  });

  it('also shows the tip on keyboard focus, for non-pointer users', async () => {
    const { menu } = await openMenuWith(RECT);
    fireEvent.focus(screen.getByLabelText('Forward one layer'));
    await waitFor(() =>
      expect(menu.querySelector('[role="tooltip"]')?.textContent).toBe('Forward one layer'),
    );
    fireEvent.blur(screen.getByLabelText('Forward one layer'));
    await waitFor(() => expect(menu.querySelector('[role="tooltip"]')).toBeNull());
  });

  it('anchors the tip over the hovered icon, not the middle of the menu', async () => {
    const { menu } = await openMenuWith(RECT);
    const tipX = async (label: string) => {
      fireEvent.pointerEnter(screen.getByLabelText(label));
      await waitFor(() => expect(menu.querySelector('[role="tooltip"]')).toBeTruthy());
      return (menu.querySelector('[role="tooltip"]') as HTMLElement).style.left;
    };
    // happy-dom reports offsetLeft as 0 for every button, so assert the wiring instead:
    // the tip is positioned from a number, never a hardcoded 50%.
    const first = await tipX('Bring to front');
    expect(first).not.toBe('50%');
    expect(first).toMatch(/^-?\d/);
  });

  it('puts the tip on the far side from the magnet', async () => {
    const above = await openMenuWith(RECT); // menu above → tip above the menu
    fireEvent.pointerEnter(screen.getByLabelText('Smaller'));
    await waitFor(() => {
      const tip = above.menu.querySelector('[role="tooltip"]') as HTMLElement;
      expect(tip.style.bottom).toContain('100%');
    });
    above.unmount();

    const below = await openMenuWith({ ...RECT, top: 4 }); // menu flipped below
    fireEvent.pointerEnter(screen.getByLabelText('Smaller'));
    await waitFor(() => {
      const tip = below.menu.querySelector('[role="tooltip"]') as HTMLElement;
      expect(tip.style.top).toContain('100%');
    });
  });
});
