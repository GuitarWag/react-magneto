import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages serves a project site from /<repo>/, so the build needs that base. Dev and
// local previews stay at '/'. Set PAGES_BASE in CI.
export default defineConfig({
  base: process.env.PAGES_BASE ?? '/',
  plugins: [react()],
  resolve: {
    // Point `react-magneto` at the library source so the playground runs without a build step.
    alias: { 'react-magneto': resolve(__dirname, '../src/index.ts') },
    dedupe: ['react', 'react-dom'],
  },
});
