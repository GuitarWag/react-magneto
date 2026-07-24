/** Default outline half-width, in CSS pixels. */
export const DIE_CUT_RADIUS = 2;

/** Filter id for a given outline radius, so boards with different radii can coexist. */
export const dieCutFilterId = (radius: number = DIE_CUT_RADIUS) =>
  `magneto-diecut-${String(radius).replace('.', '_')}`;

/**
 * CSS `filter` value referencing the SVG filter below. Requires a matching <DieCutFilter />
 * in the tree — `<MagnetBoard dieCut>` renders one for you.
 *
 * Apply this to a plain HTML wrapper, never directly to an inline `<svg>` icon: on an HTML
 * element the primitive units are CSS pixels, so the outline is the same weight for every
 * magnet regardless of what viewBox its artwork happens to use.
 */
export const dieCutFilter = (radius: number = DIE_CUT_RADIUS) => `url(#${dieCutFilterId(radius)})`;

export interface DieCutFilterProps {
  /** Outline half-width in CSS pixels. */
  radius?: number;
}

// Single-pass "die-cut" sticker outline: dilate the source alpha, flood it white to make a
// contour hugging the artwork, then a soft lift shadow. One morphology pass is far cheaper to
// paint than a stack of drop-shadows, and it works on any content — raster or vector.
export function DieCutFilter({ radius = DIE_CUT_RADIUS }: DieCutFilterProps) {
  // Room for the dilated edge plus the shadow, expressed against the filtered element's box.
  const pad = Math.max(30, radius * 12);
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <title>die-cut sticker outline</title>
      <defs>
        <filter
          id={dieCutFilterId(radius)}
          x={`-${pad}%`}
          y={`-${pad}%`}
          width={`${100 + pad * 2}%`}
          height={`${100 + pad * 2}%`}
          filterUnits="objectBoundingBox"
          primitiveUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology in="SourceAlpha" operator="dilate" radius={radius} result="thick" />
          <feFlood floodColor="#fff" result="white" />
          <feComposite in="white" in2="thick" operator="in" result="outline" />
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
