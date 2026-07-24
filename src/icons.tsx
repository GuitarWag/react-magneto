import type { ReactNode } from 'react';

// Line icons on a 24x24 grid, stroked in currentColor so they inherit the menu's text colour.
// A single arrow means one layer; doubled chevrons against a bar mean all the way.
const Svg = ({ children, size = 15 }: { children: ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

export const IconToFront = () => (
  <Svg>
    <line x1="4" y1="3" x2="20" y2="3" />
    <polyline points="7 12 12 7 17 12" />
    <polyline points="7 19 12 14 17 19" />
  </Svg>
);

export const IconToBack = () => (
  <Svg>
    <polyline points="7 5 12 10 17 5" />
    <polyline points="7 12 12 17 17 12" />
    <line x1="4" y1="21" x2="20" y2="21" />
  </Svg>
);

export const IconForward = () => (
  <Svg>
    <line x1="12" y1="20" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </Svg>
);

export const IconBackward = () => (
  <Svg>
    <line x1="12" y1="4" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </Svg>
);

export const IconRotateLeft = () => (
  <Svg>
    <polyline points="2 5 2 11 8 11" />
    <path d="M4.6 15.5a9 9 0 1 0 2.1-9.4L2 11" />
  </Svg>
);

export const IconRotateRight = () => (
  <Svg>
    <polyline points="22 5 22 11 16 11" />
    <path d="M19.4 15.5A9 9 0 1 1 17.3 6.1L22 11" />
  </Svg>
);

export const IconBigger = () => (
  <Svg>
    <polyline points="14 3 21 3 21 10" />
    <polyline points="10 21 3 21 3 14" />
    <line x1="21" y1="3" x2="13" y2="11" />
    <line x1="3" y1="21" x2="11" y2="13" />
  </Svg>
);

export const IconSmaller = () => (
  <Svg>
    <polyline points="4 14 10 14 10 20" />
    <polyline points="20 10 14 10 14 4" />
    <line x1="14" y1="10" x2="21" y2="3" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </Svg>
);
