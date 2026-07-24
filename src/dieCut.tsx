export const DIE_CUT_FILTER_ID = 'magneto-diecut';

/** CSS `filter` value referencing the SVG filter below. Requires <DieCutFilter /> in the tree. */
export const dieCutFilter = `url(#${DIE_CUT_FILTER_ID})`;

// Single-pass "die-cut" sticker outline: dilate the source alpha, flood it white to make a
// contour hugging the glyph, then a soft lift shadow. Far cheaper to paint than a stack of
// drop-shadows, and it applies to any image. The board renders this once when `dieCut` is set.
export function DieCutFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <title>die-cut sticker outline</title>
      <defs>
        <filter
          id={DIE_CUT_FILTER_ID}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="thick" />
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
