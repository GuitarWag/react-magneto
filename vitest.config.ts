import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      // index only re-exports, types has no runtime code, and the tests are not the subject.
      exclude: ['src/index.ts', 'src/types.ts', 'src/**/*.test.*'],
      // Currently 100% except two unreachable defensive fallbacks; the small gap is headroom,
      // not permission to ship untested code.
      thresholds: { lines: 98, functions: 98, branches: 95, statements: 98 },
    },
  },
});
