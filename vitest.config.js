import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['dotenv/config'],
    include: ['tests/**/*.test.js'],
    testTimeout: 30000,
    coverage: {
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
