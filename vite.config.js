import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      writeBundle() {
        // Copy manifest.json to dist
        copyFileSync('manifest.json', 'dist/manifest.json');

        // Create icons directory and copy icons
        try {
          mkdirSync('dist/icons', { recursive: true });
          // If you have icons, copy them here
          // copyFileSync('public/icons/icon16.png', 'dist/icons/icon16.png');
          // copyFileSync('public/icons/icon48.png', 'dist/icons/icon48.png');
          // copyFileSync('public/icons/icon128.png', 'dist/icons/icon128.png');
        } catch (e) {
          console.log('Icons directory handling:', e.message);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        background: resolve(__dirname, 'src/background/index.js'),
        content: resolve(__dirname, 'src/content/index.js')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Keep the same directory structure
          const name = chunkInfo.name;
          if (name === 'background') {
            return 'src/background/index.js';
          }
          if (name === 'content') {
            return 'src/content/index.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Handle different asset types
          if (assetInfo.name === 'sidepanel.html') {
            return 'sidepanel.html';
          }
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/[name]-[hash].css';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    },
    sourcemap: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
