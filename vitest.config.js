// core/vitest.config.js
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.{test,spec}.js'],
    exclude: ['node_modules',
      'dist',
      '**/*.d.ts',
      'tests/index.test.js',
      'tests/integration/**/*',
      'tests/utils/imageUtils.test.js',
      'tests/utils/zipUtils.test.js'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})