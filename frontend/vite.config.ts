import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const srcDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src');

/**
 * The hero headline is painted with a self-hosted variable face that is only
 * referenced from CSS, so the browser discovers it after the stylesheet parses.
 * Emitting a preload tag with the hashed URL puts it on the wire next to the
 * scripts, which is what removes the swap shift on the sections below the fold.
 * The mono face is deliberately left out: on a throttled connection its 39 KB
 * competes with the entry chunk and it gates nothing.
 */
function preloadSelfHostedFonts(): Plugin {
  return {
    name: 'preload-self-hosted-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return [];
        return Object.keys(ctx.bundle)
          .filter((file) => /\/outfit-latin-wght-normal-[\w-]+\.woff2$/.test(file))
          .map((file) => ({
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              crossorigin: 'anonymous',
              href: `/${file}`,
            },
            injectTo: 'head-prepend' as const,
          }));
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), preloadSelfHostedFonts()],
  resolve: {
    alias: {
      '@': srcDir,
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query', 'zustand'],
          'motion-vendor': ['motion'],
          'gsap-vendor': ['gsap'],
        },
      },
    },
  },
});
