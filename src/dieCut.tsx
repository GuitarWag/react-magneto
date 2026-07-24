/** Default outline half-width in CSS pixels, and default outline colour. */
export const DIE_CUT_RADIUS = 2;
export const DIE_CUT_COLOR = '#fff';

/** What `MagnetBoard`'s `dieCut` prop accepts. */
export type DieCut = boolean | number | { radius?: number; color?: string };

export interface DieCutOptions {
  radius: number;
  color: string;
}

/** Normalise the prop into one shape, or null when the outline is off. */
export function resolveDieCut(value: DieCut | undefined): DieCutOptions | null {
  if (value === undefined || value === false) return null;
  if (value === true) return { radius: DIE_CUT_RADIUS, color: DIE_CUT_COLOR };
  if (typeof value === 'number') return { radius: value, color: DIE_CUT_COLOR };
  return { radius: value.radius ?? DIE_CUT_RADIUS, color: value.color ?? DIE_CUT_COLOR };
}

// Colours are arbitrary strings ('#fff', 'rgb(0 0 0 / 50%)', 'tomato'), so they get hashed
// rather than slugged — two different colours must never collapse onto one filter id.
const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
};

/** Filter id for one radius/colour pair, so boards using different outlines can coexist. */
export function dieCutFilterId(radius = DIE_CUT_RADIUS, color = DIE_CUT_COLOR) {
  return `magneto-diecut-${String(radius).replace('.', '_')}-${hash(color)}`;
}

/**
 * CSS `filter` value referencing the SVG filter below. Requires a matching <DieCutFilter />
 * in the tree — `<MagnetBoard dieCut>` renders one for you.
 *
 * Apply this to a plain HTML wrapper, never directly to an inline `<svg>` icon: on an HTML
 * element the primitive units are CSS pixels, so the outline is the same weight for every
 * magnet regardless of what viewBox its artwork happens to use.
 */
export const dieCutFilter = (radius = DIE_CUT_RADIUS, color = DIE_CUT_COLOR) =>
  `url(#${dieCutFilterId(radius, color)})`;

export interface DieCutFilterProps {
  /** Outline half-width in CSS pixels. */
  radius?: number;
  /** Any CSS colour. */
  color?: string;
}

// Single-pass "die-cut" sticker outline: dilate the source alpha, flood it with the outline
// colour to make a contour hugging the artwork, then a soft lift shadow. One morphology pass is
// far cheaper to paint than a stack of drop-shadows, and it works on any content.
export function DieCutFilter({
  radius = DIE_CUT_RADIUS,
  color = DIE_CUT_COLOR,
}: DieCutFilterProps) {
  // Room for the dilated edge plus the shadow, expressed against the filtered element's box.
  const pad = Math.max(30, radius * 12);
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <title>die-cut sticker outline</title>
      <defs>
        <filter
          id={dieCutFilterId(radius, color)}
          x={`-${pad}%`}
          y={`-${pad}%`}
          width={`${100 + pad * 2}%`}
          height={`${100 + pad * 2}%`}
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology in="SourceAlpha" operator="dilate" radius={radius} result="thick" />
          <feFlood floodColor={color} result="fill" />
          <feComposite in="fill" in2="thick" operator="in" result="outline" />
          <feMerge result="stickered">
            <feMergeNode in="outline" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.45)" />
        </filter>
      </defs>
    </svg>
  );
}
