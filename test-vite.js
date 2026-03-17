import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    lib: {
      entry: 'test-entry.js',
      formats: ['es']
    }
  }
});
