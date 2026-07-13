import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './', // 👈 importante para build en subcarpetas
  
  server: {
    port: 8080,
  },

  resolve: {
    alias: {
      '@config': path.resolve(__dirname, 'src/config/config.js'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@game': path.resolve(__dirname, 'src/game'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@constants': path.resolve(__dirname, 'src/constants')
    }
  }
});