import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup/setup.js'],
    globals: true,
    alias: {
      '@': './src'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    include: ['src/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
})