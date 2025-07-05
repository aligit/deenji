/// <reference types="vitest" />

import analog from '@analogjs/platform';
import { defineConfig, Plugin } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    esbuild: false,
    root: __dirname,
    cacheDir: `../node_modules/.vite`,

    ssr: {
      noExternal: ['@analogjs/trpc', '@trpc/server'],
    },

    build: {
      outDir: '../dist/./deenji/client',
      target: ['es2020'],
      ...(mode === 'production'
        ? {
            sourcemap: false,
            reportCompressedSize: false,
            chunkSizeWarningLimit: 1000,
            minify: 'esbuild',
          }
        : {
            sourcemap: true,
            reportCompressedSize: false,
          }),
    },
    server: {
      fs: {
        allow: ['.'],
      },
    },
    plugins: [
      analog({
        nitro: {
          routeRules: {
            '/': {
              prerender: false,
            },
          },
        },
      }),

      nxViteTsPaths(),
    ],
    test: {
      globals: true,
      setupFiles: ['src/test-setup.ts'],
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: [
          'node_modules/',
          'dist/',
          'coverage/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/test-setup.ts',
        ],
      },
      // Browser testing configuration (optional)
      // browser: {
      //   enabled: true,
      //   name: 'chromium',
      //   headless: true, // set to false for debugging
      //   provider: 'playwright',
      // },
    },
    define: {
      'import.meta.vitest': mode !== 'production',
    },
  };
});
