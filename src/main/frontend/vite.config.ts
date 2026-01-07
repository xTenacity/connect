import { defineConfig } from 'vite';

// When running inside the editor typechecker there may be no @types/node installed;
// declare a loose `process` to allow reading env vars without failing the typecheck.
declare const process: any;

// Vite config to create manual chunks: vendor (node_modules), game-scene, assets
// publicDir set to 'assets' so files in src/main/frontend/assets are served at /assets
// base can be overridden via VITE_BASE env var (useful if serving under a subpath in production)
export default defineConfig({
  base: (process && process.env && process.env.VITE_BASE) || '/',
  publicDir: 'assets',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // normalize path separators so we only need to check one pattern
          const normalized = id.split('\\').join('/');

          // use includes for clearer intent
          if (normalized.includes('node_modules')) {
            return 'vendor';
          }
          // split the heavy game-scene module into its own chunk
          if (normalized.includes('src/gameScene')) {
            return 'game-scene';
          }
          // small heuristic to group assets
          if (normalized.match(/\.(png|jpg|jpeg|svg|css|json)$/)) {
            return 'assets';
          }
        }
      }
    }
  }
});
