import { defineConfig } from 'vite';
import path from 'path';

// Vite config to create manual chunks: vendor (node_modules), game-scene, assets
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // split the heavy game-scene module into its own chunk
          if (id.includes(path.join('src', 'gameScene')) || id.includes('src/gameScene')) {
            return 'game-scene';
          }
          // small heuristic to group assets
          if (id.match(/\.(png|jpg|jpeg|svg|css|json)$/)) {
            return 'assets';
          }
        }
      }
    }
  }
});

