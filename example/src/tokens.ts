// Design tokens: "Modern Dark" — developer-tool dark surface, slate scale, green run-accent.
// Kept in one place so the playground stays visually consistent.
export const t = {
  bg: '#0F172A',
  surface: '#161F33',
  surfaceHi: '#1E293B',
  muted: '#272F42',
  border: '#2E3A4E',
  borderHi: '#475569',
  fg: '#F8FAFC',
  fgMuted: '#A8B3C4',
  fgFaint: '#7C8798',
  accent: '#22C55E',
  accentFg: '#04120A',
  radius: 12,
  radiusLg: 20,
  // 8px-based spacing, standard density
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s6: 24,
  s8: 32,
  s12: 48,
  ease: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const mono =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
