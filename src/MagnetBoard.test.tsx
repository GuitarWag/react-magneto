import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stubRect } from '../test/setup';
import { magnetFx } from './fx';
import { MagnetBoard, type MagnetBoardHandle, type MagnetBoardProps } from './MagnetBoard';
import type { Layout, MagnetItem } from './types';
import { DRAG_Z } from './zorder';

const IDS = ['react', 'go', 'docker'];
const ITEMS: MagnetItem[] = IDS.map((id) => ({ id, src: `/${id}.png` }));
const BOARD = { left: 0, top: 0, width: 1000, height: 500 };

// Module-level so its identity is stable — otherwise React.memo on <Magnet> would never hold
// and the "siblings do not re-render" assertions would be meaningless.
const renders = new Map<string, number>();
const countingRender = (item: MagnetItem) => {
  renders.set(item.id, (renders.get(item.id) ?? 0) + 1);
  return <span>{item.id}</span>;
};

function setup(props: Partial<MagnetBoardProps> = {}) {
  const ref = createRef<MagnetBoardHandle>();
  const view = render(
    <MagnetBoard ref={ref} className="board" items={ITEMS} editable {...props} />,
  );
  const board = view.container.querySelector('.board') as HTMLElement;
  stubRect(board, BOARD);
  const magnet = (id: string) => board.querySelector(`div[title="${id}"]`) as HTMLElement;
  return { ref, board, magnet, ...view };
}

/** Wait for the one-time intro rAF, after which magnets sit at their resting position. */
const settled = (el: HTMLElement) => waitFor(() => expect(el.style.opacity).toBe('1'));

const pt = (
  el: HTMLElement,
  type: 'pointerDown' | 'pointerMove' | 'pointerUp',
  x: number,
  y: number,
) => fireEvent[type](el, { clientX: x, clientY: y, pointerId: 1 });

/** Full press → move → release, in board pixel coordinates. */
async function drag(el: HTMLElement, from: [number, number], to: [number, number]) {
  pt(el, 'pointerDown', ...from);
  await settled(el);
  pt(el, 'pointerMove', ...to);
  pt(el, 'pointerUp', ...to);
}

beforeEach(() => renders.clear());

describe('rendering', () => {
  it('renders one magnet per item and defaults to an <img>', async () => {
    const { magnet } = setup();
    await settled(magnet('react'));
    for (const id of IDS) expect(magnet(id)).toBeTruthy();
    const img = magnet('react').querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/react.png');
    expect(img.getAttribute('alt')).toBe('react');
  });

  it('accepts bare url strings, using the url as the id', async () => {
    const { board } = setup({ items: ['/a.png', '/b.png'] });
    await waitFor(() => expect(board.querySelector('div[title="/a.png"]')).toBeTruthy());
    expect(board.querySelectorAll('img')).toHaveLength(2);
  });

  it('uses renderMagnet when given', async () => {
    const { magnet } = setup({ renderMagnet: countingRender });
    await settled(magnet('go'));
    expect(magnet('go').querySelector('img')).toBeNull();
    expect(magnet('go').textContent).toBe('go');
  });

  it('applies every field of a saved layout', async () => {
    const initialLayout: Layout = { react: { x: 20, y: 30, r: 45, z: 7, s: 2 } };
    const { magnet } = setup({ initialLayout });
    const el = magnet('react');
    await settled(el);
    expect(el.style.left).toBe('20%');
    expect(el.style.top).toBe('30%');
    expect(el.style.zIndex).toBe('7');
    expect(el.style.transform).toContain('rotate(45deg)');
    expect(el.style.transform).toContain('scale(2)');
  });

  it('falls back to the id as text when an item has no src', async () => {
    const { board } = setup({ items: [{ id: 'plain' }] });
    const el = board.querySelector('div[title="plain"]') as HTMLElement;
    await settled(el);
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toBe('plain');
  });

  it('wires up the die-cut outline only when asked', async () => {
    const off = setup();
    await settled(off.magnet('react'));
    expect(off.magnet('react').innerHTML).not.toContain('url(#');
    expect(off.container.querySelector('filter')).toBeNull();
    off.unmount();

    const on = setup({ dieCut: true });
    await settled(on.magnet('react'));
    // The filter sits on the wrapper, not the artwork: on an inline <svg> the outline weight
    // would depend on that icon's viewBox instead of being a fixed number of pixels.
    const wrapper = on.magnet('react').firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.style.filter).toContain('url(#magneto-diecut');
    expect((on.magnet('react').querySelector('img') as HTMLElement).style.filter).toBe('');
    expect(on.container.querySelector('filter')).toBeTruthy();
  });

  it('outlines custom renderMagnet artwork too, not just the default <img>', async () => {
    const { magnet } = setup({
      dieCut: true,
      renderMagnet: () => <svg viewBox="0 0 512 512" aria-label="art" />,
    });
    await settled(magnet('react'));
    const wrapper = magnet('react').firstElementChild as HTMLElement;
    expect(wrapper.style.filter).toContain('url(#magneto-diecut');
    expect(wrapper.querySelector('svg[aria-label="art"]')).toBeTruthy();
  });

  it('takes a custom outline radius', async () => {
    const { magnet, container } = setup({ dieCut: 4 });
    await settled(magnet('react'));
    const wrapper = magnet('react').firstElementChild as HTMLElement;
    expect(wrapper.style.filter).toContain('magneto-diecut-4');
    expect(container.querySelector('feMorphology')?.getAttribute('radius')).toBe('4');
    // The magnet points at the filter the board actually rendered.
    const id = container.querySelector('filter')?.id as string;
    expect(wrapper.style.filter).toContain(id);
  });

  it('takes an outline colour', async () => {
    const { magnet, container } = setup({ dieCut: { color: '#111', radius: 3 } });
    await settled(magnet('react'));
    expect(container.querySelector('feFlood')?.getAttribute('flood-color')).toBe('#111');
    expect(container.querySelector('feMorphology')?.getAttribute('radius')).toBe('3');
    const id = container.querySelector('filter')?.id as string;
    expect((magnet('react').firstElementChild as HTMLElement).style.filter).toContain(id);
  });

  it('defaults the colour to white and the radius to 2', async () => {
    const { magnet, container } = setup({ dieCut: { color: 'tomato' } });
    await settled(magnet('react'));
    expect(container.querySelector('feFlood')?.getAttribute('flood-color')).toBe('tomato');
    expect(container.querySelector('feMorphology')?.getAttribute('radius')).toBe('2');
    const plain = setup({ dieCut: true });
    await settled(plain.magnet('react'));
    expect(plain.container.querySelector('feFlood')?.getAttribute('flood-color')).toBe('#fff');
  });

  it('falls back to the deterministic tilt when a layout omits rotation', async () => {
    const { magnet } = setup({ initialLayout: { react: { x: 50, y: 50 } } });
    const el = magnet('react');
    await settled(el);
    expect(el.style.transform).toContain(`rotate(${magnetFx('react').angle}deg)`);
    expect(el.style.transform).toContain('scale(1)');
  });
});

describe('dragging', () => {
  it('converts pointer movement into a percentage of the board', async () => {
    const onLayoutChange = vi.fn();
    const { magnet } = setup({ initialLayout: { react: { x: 50, y: 50 } }, onLayoutChange });
    // +100px of 1000 = +10%, +50px of 500 = +10%.
    await drag(magnet('react'), [500, 250], [600, 300]);
    expect(onLayoutChange).toHaveBeenCalled();
    expect(onLayoutChange.mock.lastCall?.[0].react).toEqual({ x: 60, y: 60 });
    expect(magnet('react').style.left).toBe('60%');
  });

  it('clamps to the board so a magnet cannot be dragged out of view', async () => {
    const { ref, magnet } = setup({ initialLayout: { react: { x: 50, y: 50 } } });
    await drag(magnet('react'), [500, 250], [-5000, -5000]);
    expect(ref.current?.getLayout().react).toEqual({ x: 3, y: 5 });
    await drag(magnet('react'), [0, 0], [9000, 9000]);
    expect(ref.current?.getLayout().react).toEqual({ x: 97, y: 95 });
  });

  it('lifts the magnet while dragging and restores its own layer on drop', async () => {
    const { magnet } = setup({ initialLayout: { react: { x: 50, y: 50, z: 4 } } });
    const el = magnet('react');
    await settled(el);
    pt(el, 'pointerDown', 500, 250);
    expect(el.style.zIndex).toBe(String(DRAG_Z));
    pt(el, 'pointerMove', 600, 250);
    pt(el, 'pointerUp', 600, 250);
    // Regression: this used to stay stuck at the drag lift forever.
    await waitFor(() => expect(el.style.zIndex).toBe('4'));
  });

  it('treats a press with no movement as a selection, not a layout change', async () => {
    const onLayoutChange = vi.fn();
    const { magnet } = setup({ initialLayout: { react: { x: 50, y: 50 } }, onLayoutChange });
    const el = magnet('react');
    await settled(el);
    pt(el, 'pointerDown', 500, 250);
    pt(el, 'pointerUp', 500, 250);
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it('ignores drags when not editable', async () => {
    const onLayoutChange = vi.fn();
    const { magnet } = setup({
      editable: false,
      initialLayout: { react: { x: 50, y: 50 } },
      onLayoutChange,
    });
    await drag(magnet('react'), [500, 250], [700, 250]);
    expect(onLayoutChange).not.toHaveBeenCalled();
    expect(magnet('react').style.left).toBe('50%');
  });
});

describe('selection', () => {
  it('selects on press and deselects on the background', async () => {
    const onSelectionChange = vi.fn();
    const { board, magnet } = setup({ onSelectionChange });
    const el = magnet('react');
    await settled(el);

    pt(el, 'pointerDown', 500, 250);
    await waitFor(() => expect(el.style.outline).toContain('dashed'));
    expect(onSelectionChange).toHaveBeenLastCalledWith('react');

    fireEvent.pointerDown(board, { clientX: 10, clientY: 10, pointerId: 2 });
    await waitFor(() => expect(el.style.outline).toBe(''));
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);
  });

  it('does not select when not editable', async () => {
    const onSelectionChange = vi.fn();
    const { magnet } = setup({ editable: false, onSelectionChange });
    const el = magnet('react');
    await settled(el);
    pt(el, 'pointerDown', 500, 250);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('moves the selection between magnets', async () => {
    const onSelectionChange = vi.fn();
    const { magnet } = setup({ onSelectionChange });
    await settled(magnet('react'));
    pt(magnet('react'), 'pointerDown', 100, 100);
    pt(magnet('react'), 'pointerUp', 100, 100);
    pt(magnet('go'), 'pointerDown', 200, 100);
    await waitFor(() => expect(magnet('go').style.outline).toContain('dashed'));
    expect(magnet('react').style.outline).toBe('');
    expect(onSelectionChange).toHaveBeenLastCalledWith('go');
  });
});

describe('the menu', () => {
  const open = async (props: Partial<MagnetBoardProps> = {}) => {
    const view = setup(props);
    const el = view.magnet('react');
    await settled(el);
    pt(el, 'pointerDown', 500, 250);
    pt(el, 'pointerUp', 500, 250);
    return view;
  };

  it('appears beside the selection with layer, rotate and size controls', async () => {
    await open();
    for (const label of [
      'Forward one layer',
      'Backward one layer',
      'Rotate left 15°',
      'Rotate right 15°',
      'Smaller',
      'Bigger',
    ]) {
      expect(await screen.findByLabelText(label)).toBeTruthy();
    }
  });

  it('stays hidden when menu is false, when locked, and with nothing selected', async () => {
    const noMenu = await open({ menu: false });
    expect(noMenu.container.querySelector('[aria-label="Rotate left 15°"]')).toBeNull();
    noMenu.unmount();

    const locked = setup({ editable: false });
    await settled(locked.magnet('react'));
    expect(locked.container.querySelector('[aria-label="Rotate left 15°"]')).toBeNull();
    locked.unmount();

    const idle = setup();
    await settled(idle.magnet('react'));
    expect(idle.container.querySelector('[aria-label="Rotate left 15°"]')).toBeNull();
  });

  it('hides while a magnet is being dragged and returns on drop', async () => {
    const { magnet, container } = await open();
    const el = magnet('react');
    pt(el, 'pointerDown', 500, 250);
    pt(el, 'pointerMove', 600, 250);
    await waitFor(() =>
      expect(container.querySelector('[aria-label="Rotate left 15°"]')).toBeNull(),
    );
    pt(el, 'pointerUp', 600, 250);
    await waitFor(() =>
      expect(container.querySelector('[aria-label="Rotate left 15°"]')).toBeTruthy(),
    );
  });

  it("rotates in 15° steps from the magnet's own tilt", async () => {
    const { magnet } = await open();
    const el = magnet('react');
    const base = magnetFx('react').angle;
    fireEvent.click(await screen.findByLabelText('Rotate right 15°'));
    await waitFor(() => expect(el.style.transform).toContain(`rotate(${base + 15}deg)`));
    fireEvent.click(screen.getByLabelText('Rotate left 15°'));
    fireEvent.click(screen.getByLabelText('Rotate left 15°'));
    await waitFor(() => expect(el.style.transform).toContain(`rotate(${base - 15}deg)`));
  });

  it('resizes in steps and clamps at both ends', async () => {
    const { ref, magnet } = await open();
    const el = magnet('react');
    fireEvent.click(await screen.findByLabelText('Bigger'));
    fireEvent.click(screen.getByLabelText('Bigger'));
    await waitFor(() => expect(el.style.transform).toContain('scale(1.3)'));

    for (let i = 0; i < 40; i++) fireEvent.click(screen.getByLabelText('Bigger'));
    await waitFor(() => expect(ref.current?.getLayout().react.s).toBe(3));
    for (let i = 0; i < 60; i++) fireEvent.click(screen.getByLabelText('Smaller'));
    await waitFor(() => expect(ref.current?.getLayout().react.s).toBe(0.4));
  });

  it('keeps exported numbers clean instead of accumulating float noise', async () => {
    const { ref } = await open();
    // 1 + 0.15 * 3 is 1.4499999999999997 in raw floating point.
    for (let i = 0; i < 3; i++) fireEvent.click(await screen.findByLabelText('Bigger'));
    await waitFor(() => expect(ref.current?.getLayout().react.s).toBe(1.45));
    const json = JSON.stringify(ref.current?.getLayout());
    expect(json).not.toMatch(/\d\.\d{5,}/);
  });

  it('jumps straight to the front or back in a single press', async () => {
    const { ref, magnet } = await open();
    const layerOf = (id: string) => ref.current?.getLayout()[id].z ?? 1;
    // Item order is the starting stack: react, go, docker — react is at the bottom.
    fireEvent.click(await screen.findByLabelText('Bring to front'));
    await waitFor(() => expect(layerOf('react')).toBe(3));
    expect(layerOf('go')).toBe(1);
    expect(layerOf('docker')).toBe(2); // relative order of the others is kept
    expect(magnet('react').style.zIndex).toBe('3');

    fireEvent.click(screen.getByLabelText('Send to back'));
    await waitFor(() => expect(layerOf('react')).toBe(1));
    expect(layerOf('go')).toBe(2);
    expect(layerOf('docker')).toBe(3);
  });

  it('leaves the stack alone when already at the requested edge', async () => {
    const onLayoutChange = vi.fn();
    const { ref } = await open({ onLayoutChange });
    fireEvent.click(await screen.findByLabelText('Bring to front'));
    await waitFor(() => expect(ref.current?.getLayout().react.z).toBe(3));
    onLayoutChange.mockClear();
    fireEvent.click(screen.getByLabelText('Bring to front')); // already on top
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it('steps one layer per press instead of jumping to the front', async () => {
    const { ref, magnet } = await open();
    const layerOf = (id: string) => ref.current?.getLayout()[id].z ?? 1;
    // Item order is the starting stack: react, go, docker.
    fireEvent.click(await screen.findByLabelText('Forward one layer'));
    await waitFor(() => expect(layerOf('react')).toBe(2));
    expect(layerOf('go')).toBe(1);
    expect(layerOf('docker')).toBe(3); // still above react — no jump to the top

    fireEvent.click(screen.getByLabelText('Forward one layer'));
    await waitFor(() => expect(layerOf('react')).toBe(3));
    expect(layerOf('docker')).toBe(2);

    // Pinned at the top now: further presses change nothing.
    fireEvent.click(screen.getByLabelText('Forward one layer'));
    await waitFor(() => expect(layerOf('react')).toBe(3));
    expect(magnet('react').style.zIndex).toBe('3');

    fireEvent.click(screen.getByLabelText('Backward one layer'));
    await waitFor(() => expect(layerOf('react')).toBe(2));
  });
});

describe('the ref handle', () => {
  it('targets the selection by default and an explicit id when given', async () => {
    const { ref, magnet } = setup();
    await settled(magnet('react'));
    pt(magnet('react'), 'pointerDown', 100, 100);
    pt(magnet('react'), 'pointerUp', 100, 100);

    ref.current?.rotate(90);
    await waitFor(() => expect(ref.current?.getLayout().react.r).toBe(90));

    ref.current?.rotate(10, 'docker');
    await waitFor(() => expect(ref.current?.getLayout().docker.r).toBe(10));
    expect(ref.current?.getLayout().react.r).toBe(90); // selection untouched
  });

  it('does nothing when there is no selection and no id', async () => {
    const onLayoutChange = vi.fn();
    const { ref, magnet } = setup({ onLayoutChange });
    await settled(magnet('react'));
    ref.current?.rotate(45);
    ref.current?.rotateBy(10);
    ref.current?.resize(2);
    ref.current?.resizeBy(1);
    ref.current?.bringForward();
    ref.current?.sendBackward();
    ref.current?.bringToFront();
    ref.current?.sendToBack();
    expect(onLayoutChange).not.toHaveBeenCalled();
  });

  it('exposes full-jump and single-step layering side by side', async () => {
    const { ref, magnet } = setup();
    await settled(magnet('react'));
    const order = () =>
      Object.entries(ref.current?.getLayout() ?? {})
        .sort((a, b) => (a[1].z ?? 1) - (b[1].z ?? 1))
        .map(([k]) => k);

    ref.current?.bringToFront('react');
    await waitFor(() => expect(order()).toEqual(['go', 'docker', 'react']));
    ref.current?.sendBackward('react'); // one step back down
    await waitFor(() => expect(order()).toEqual(['go', 'react', 'docker']));
    ref.current?.sendToBack('react');
    await waitFor(() => expect(order()).toEqual(['react', 'go', 'docker']));
    ref.current?.bringForward('react');
    await waitFor(() => expect(order()).toEqual(['go', 'react', 'docker']));
  });

  it('exposes relative and absolute rotation and scale', async () => {
    const { ref, magnet } = setup({ initialLayout: { go: { x: 50, y: 50, r: 0, s: 1 } } });
    await settled(magnet('go'));
    ref.current?.rotateBy(25, 'go');
    await waitFor(() => expect(ref.current?.getLayout().go.r).toBe(25));
    ref.current?.resizeBy(0.5, 'go');
    await waitFor(() => expect(ref.current?.getLayout().go.s).toBe(1.5));
    ref.current?.resize(99, 'go'); // clamped
    await waitFor(() => expect(ref.current?.getLayout().go.s).toBe(3));
  });

  it('shrugs off a command aimed at an item that has been removed', async () => {
    const ref = createRef<MagnetBoardHandle>();
    const onLayoutChange = vi.fn();
    const view = render(
      <MagnetBoard
        ref={ref}
        className="board"
        items={ITEMS}
        editable
        onLayoutChange={onLayoutChange}
      />,
    );
    const board = view.container.querySelector('.board') as HTMLElement;
    stubRect(board, BOARD);
    const el = board.querySelector('div[title="docker"]') as HTMLElement;
    await waitFor(() => expect(el.style.opacity).toBe('1'));
    pt(el, 'pointerDown', 100, 100);
    pt(el, 'pointerUp', 100, 100);

    // docker is still the selection, but it is no longer on the board.
    view.rerender(
      <MagnetBoard
        ref={ref}
        className="board"
        items={ITEMS.filter((i) => i.id !== 'docker')}
        editable
        onLayoutChange={onLayoutChange}
      />,
    );
    onLayoutChange.mockClear();
    expect(() => {
      ref.current?.rotateBy(15);
      ref.current?.bringForward();
    }).not.toThrow();
    expect(ref.current?.getLayout().docker).toBeUndefined();
  });

  it('round-trips a layout back through initialLayout', async () => {
    const first = setup();
    await settled(first.magnet('react'));
    first.ref.current?.rotate(33, 'react');
    first.ref.current?.resize(1.75, 'go');
    first.ref.current?.bringForward('react');
    await waitFor(() => expect(first.ref.current?.getLayout().react.r).toBe(33));
    const exported = first.ref.current?.getLayout() as Layout;
    first.unmount();

    const second = setup({ initialLayout: exported });
    const el = second.magnet('react');
    await settled(el);
    expect(second.ref.current?.getLayout()).toEqual(exported);
    expect(el.style.transform).toContain('rotate(33deg)');
    expect(second.magnet('go').style.transform).toContain('scale(1.75)');
  });
});

describe('the render-free drag guarantee', () => {
  it('re-renders no magnet while moving, and only the dragged one on drop', async () => {
    const { magnet } = setup({
      renderMagnet: countingRender,
      initialLayout: { react: { x: 50, y: 50 } },
    });
    const el = magnet('react');
    await settled(el);

    pt(el, 'pointerDown', 500, 250);
    await waitFor(() => expect(el.style.outline).toContain('dashed'));
    const afterGrab = new Map(renders);

    // Moving writes straight to the DOM: nothing re-renders, not even the dragged magnet.
    pt(el, 'pointerMove', 600, 300);
    pt(el, 'pointerMove', 700, 350);
    pt(el, 'pointerMove', 800, 400);
    expect(renders).toEqual(afterGrab);

    pt(el, 'pointerUp', 800, 400);
    await waitFor(() => expect(el.style.left).toBe('80%'));
    // The dragged magnet commits; its siblings are untouched.
    expect(renders.get('react')).toBe((afterGrab.get('react') ?? 0) + 1);
    for (const id of ['go', 'docker']) {
      expect(renders.get(id)).toBe(afterGrab.get(id));
    }
  });

  it('does not re-render siblings when selection moves', async () => {
    const { magnet } = setup({ renderMagnet: countingRender });
    await settled(magnet('react'));
    pt(magnet('react'), 'pointerDown', 100, 100);
    pt(magnet('react'), 'pointerUp', 100, 100);
    await waitFor(() => expect(magnet('react').style.outline).toContain('dashed'));
    const before = new Map(renders);

    pt(magnet('go'), 'pointerDown', 200, 100);
    pt(magnet('go'), 'pointerUp', 200, 100);
    await waitFor(() => expect(magnet('go').style.outline).toContain('dashed'));

    // Only the two magnets whose selected state flipped may re-render.
    expect(renders.get('docker')).toBe(before.get('docker'));
  });

  it('only re-renders the magnets a layer step actually moves', async () => {
    const { ref, magnet } = setup({ renderMagnet: countingRender, items: ITEMS });
    await settled(magnet('react'));
    // Seed a dense stack so a step is a two-magnet swap.
    ref.current?.bringForward('react');
    await waitFor(() => expect(ref.current?.getLayout().react.z).toBe(2));
    const before = new Map(renders);

    ref.current?.bringForward('react'); // swaps react (2) with docker (3)
    await waitFor(() => expect(ref.current?.getLayout().react.z).toBe(3));
    expect(renders.get('go')).toBe(before.get('go')); // untouched layer, no render
  });
});

describe('the items memo key', () => {
  it('rebuilds when ids change in a way a delimiter join would collide on', async () => {
    // '|' joined: ['a|b'] and ['a','b'] both stringify to "a|b", so a naive key cannot
    // tell them apart and the board would keep rendering the old magnet list.
    const ref = createRef<MagnetBoardHandle>();
    const view = render(
      <MagnetBoard ref={ref} className="board" items={[{ id: 'a|b' }]} editable />,
    );
    const board = view.container.querySelector('.board') as HTMLElement;
    stubRect(board, BOARD);
    await waitFor(() => expect(board.querySelectorAll('div[title]')).toHaveLength(1));

    view.rerender(
      <MagnetBoard ref={ref} className="board" items={[{ id: 'a' }, { id: 'b' }]} editable />,
    );
    await waitFor(() => expect(board.querySelectorAll('div[title]')).toHaveLength(2));
    expect(board.querySelector('div[title="a"]')).toBeTruthy();
    expect(board.querySelector('div[title="b"]')).toBeTruthy();
  });
});
