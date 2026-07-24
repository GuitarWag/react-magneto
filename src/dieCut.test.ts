import { describe, expect, it } from 'vitest';
import {
  DIE_CUT_COLOR,
  DIE_CUT_RADIUS,
  dieCutFilter,
  dieCutFilterId,
  resolveDieCut,
} from './dieCut';

describe('resolveDieCut', () => {
  it('turns every accepted shape into one option object', () => {
    expect(resolveDieCut(undefined)).toBeNull();
    expect(resolveDieCut(false)).toBeNull();
    expect(resolveDieCut(true)).toEqual({ radius: DIE_CUT_RADIUS, color: DIE_CUT_COLOR });
    expect(resolveDieCut(5)).toEqual({ radius: 5, color: DIE_CUT_COLOR });
    expect(resolveDieCut({ color: '#000' })).toEqual({ radius: DIE_CUT_RADIUS, color: '#000' });
    expect(resolveDieCut({ radius: 1.5 })).toEqual({ radius: 1.5, color: DIE_CUT_COLOR });
    expect(resolveDieCut({ radius: 3, color: 'tomato' })).toEqual({ radius: 3, color: 'tomato' });
  });

  it('treats radius 0 as an explicit request, not as "off"', () => {
    expect(resolveDieCut(0)).toEqual({ radius: 0, color: DIE_CUT_COLOR });
  });
});

describe('dieCutFilterId', () => {
  it('is stable for the same radius and colour', () => {
    expect(dieCutFilterId(2, '#fff')).toBe(dieCutFilterId(2, '#fff'));
  });

  it('separates different colours, so two boards never share one filter', () => {
    const ids = ['#fff', '#000', 'tomato', 'rgb(0 0 0 / 50%)', 'rgba(0,0,0,0.5)'].map((c) =>
      dieCutFilterId(2, c),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('separates different radii, including fractional ones', () => {
    const ids = [1, 2, 2.5, 4].map((r) => dieCutFilterId(r));
    expect(new Set(ids).size).toBe(ids.length);
    // '.' is not valid in the middle of an id used via url(#…), so it is escaped.
    expect(dieCutFilterId(2.5)).not.toContain('.');
  });

  it('produces a url() that matches the id', () => {
    expect(dieCutFilter(3, '#abc')).toBe(`url(#${dieCutFilterId(3, '#abc')})`);
    expect(dieCutFilter()).toBe(`url(#${dieCutFilterId(DIE_CUT_RADIUS, DIE_CUT_COLOR)})`);
  });
});
