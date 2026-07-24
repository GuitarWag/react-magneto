import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Point `react-magneto` at the library source so the example runs without a build step.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { 'react-magneto': resolve(__dirname, '../src/index.ts') },
    dedupe: ['react', 'react-dom'],
  },
});
