import { type CSSProperties, type ReactNode, useState } from 'react';
import { mono, t } from './tokens';

/** 24px line icons, currentColor — no emoji anywhere in the UI. */
export const Icon = ({ children, size = 15 }: { children: ReactNode; size?: number }) => (
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

export const IconLock = () => (
  <Icon>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);
export const IconUnlock = () => (
  <Icon>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </Icon>
);
export const IconCopy = () => (
  <Icon>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icon>
);
export const IconCheck = () => (
  <Icon>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
);
export const IconShuffle = () => (
  <Icon>
    <polyline points="16 3 21 3 21 8" />
    <line x1="4" y1="20" x2="21" y2="3" />
    <polyline points="21 16 21 21 16 21" />
    <line x1="15" y1="15" x2="21" y2="21" />
    <line x1="4" y1="4" x2="9" y2="9" />
  </Icon>
);
export const IconReset = () => (
  <Icon>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </Icon>
);
export const IconSticker = () => (
  <Icon>
    <path d="M20.5 11a8.38 8.38 0 0 1-8.5 8.5A8.5 8.5 0 1 1 12 2.5a8.38 8.38 0 0 1 8.5 8.5Z" />
    <path d="M20 11h-4a3 3 0 0 0-3 3v4" />
  </Icon>
);
export const IconGithub = () => (
  <Icon>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 4.44-2 4.44-5.19a4.5 4.5 0 0 0-1.29-3.28 4.2 4.2 0 0 0-.08-3.29s-1.32-.42-4.13 1.61a10.6 10.6 0 0 0-5.6 0C5.6 2.34 4.28 2.76 4.28 2.76a4.2 4.2 0 0 0-.08 3.29A4.5 4.5 0 0 0 2.9 9.36c0 3.16 1.3 4.81 4.44 5.19a3.37 3.37 0 0 0-.94 2.58V21" />
  </Icon>
);
export const IconPackage = () => (
  <Icon>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </Icon>
);

const focusRing = {
  outline: 'none',
  boxShadow: `0 0 0 2px ${t.bg}, 0 0 0 4px ${t.accent}`,
};

export function Button({
  children,
  onClick,
  title,
  variant = 'default',
  pressed,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
  variant?: 'default' | 'accent';
  pressed?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const accent = variant === 'accent';
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.s2,
    // 44px min touch target (padding + line-height reaches it on touch sizes)
    minHeight: 40,
    padding: `0 ${t.s3}px`,
    borderRadius: t.radius,
    border: `1px solid ${pressed || accent ? t.accent : hover ? t.borderHi : t.border}`,
    background: accent
      ? t.accent
      : pressed
        ? 'rgba(34,197,94,0.12)'
        : hover
          ? t.surfaceHi
          : t.surface,
    color: accent ? t.accentFg : pressed ? t.accent : t.fg,
    font: '500 13px/1 Inter, system-ui, sans-serif',
    cursor: 'pointer',
    transition: `background 180ms ${t.ease}, border-color 180ms ${t.ease}, color 180ms ${t.ease}`,
    ...(focus ? focusRing : null),
  };
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={pressed}
      onClick={onClick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={style}
    >
      {children}
    </button>
  );
}

/** The install line, with a copy affordance that confirms itself. */
export function InstallLine({ cmd }: { cmd: string }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(cmd).catch(() => {});
    setDone(true);
    window.setTimeout(() => setDone(false), 1600);
  };
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: t.s3,
        padding: `${t.s2}px ${t.s2}px ${t.s2}px ${t.s4}px`,
        borderRadius: t.radius,
        border: `1px solid ${t.border}`,
        background: t.surface,
        font: `13px/1 ${mono}`,
        color: t.fg,
      }}
    >
      <span style={{ color: t.fgFaint }} aria-hidden="true">
        $
      </span>
      <code>{cmd}</code>
      <Button onClick={copy} title={done ? 'Copied' : 'Copy install command'}>
        {done ? <IconCheck /> : <IconCopy />}
        {done ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

export function Link({ href, children }: { href: string; children: ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: t.s2,
        minHeight: 40,
        padding: `0 ${t.s3}px`,
        borderRadius: t.radius,
        border: `1px solid ${hover ? t.borderHi : t.border}`,
        background: hover ? t.surfaceHi : 'transparent',
        color: t.fg,
        font: '500 13px/1 Inter, system-ui, sans-serif',
        textDecoration: 'none',
        transition: `background 180ms ${t.ease}, border-color 180ms ${t.ease}`,
      }}
    >
      {children}
    </a>
  );
}

/** A colour choice for the die-cut outline. */
export function Swatch({
  color,
  label,
  selected,
  onClick,
}: {
  color: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        width: 40,
        height: 40,
        borderRadius: t.radius,
        cursor: 'pointer',
        background: t.surface,
        border: `1px solid ${selected ? t.accent : t.border}`,
        display: 'grid',
        placeItems: 'center',
        transition: `border-color 180ms ${t.ease}`,
        ...(focus ? focusRing : null),
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 16,
          height: 16,
          borderRadius: 5,
          background: color,
          boxShadow: `0 0 0 1px ${t.borderHi}`,
        }}
      />
    </button>
  );
}
