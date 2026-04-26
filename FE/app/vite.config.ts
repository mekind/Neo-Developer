import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

function resolveBasePath() {
  return process.env.VITE_BASE_PATH ?? '/'
}

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? resolveBasePath() : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
}))
