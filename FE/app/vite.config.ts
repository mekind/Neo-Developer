import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

function resolveBasePath() {
  const repository = process.env.GITHUB_REPOSITORY
  const repoName = repository?.split('/')[1]

  if (!repoName) {
    return '/'
  }

  return `/${repoName}/`
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
