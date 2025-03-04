/// <reference types="vitest" />
import analog from '@analogjs/platform';
import { defineConfig, Plugin } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// Custom i18n plugin
function i18nPlugin(): Plugin {
  return {
    name: 'vite-plugin-i18n',
    configResolved(config) {
      // Make sure @angular/localize is not externalized
      if (config.build?.ssr) {
        const noExternal = config.ssr?.noExternal || [];
        if (Array.isArray(noExternal)) {
          config.ssr.noExternal = [...noExternal, '@angular/localize'];
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Get the locale from environment variables
  const locale = process.env['LOCALE'] || 'fa';

  return {
    esbuild: false,
    root: __dirname,
    cacheDir: `../node_modules/.vite`,
    ssr: {
      noExternal: ['@analogjs/trpc', '@trpc/server', '@angular/localize'],
    },
    build: {
      outDir: '../dist/./deenji/client',
      reportCompressedSize: true,
      target: ['es2020'],
      sourcemap: mode !== 'production',
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
        // Any other valid Analog options here
      }),
      nxViteTsPaths(),
      i18nPlugin(),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      reporters: ['default'],
    },
    define: {
      'import.meta.vitest': mode !== 'production',
      // Define global constants for i18n
      __LOCALE__: JSON.stringify(locale),
    },
    resolve: {
      dedupe: ['@angular/localize', '@angular/core'],
    },
  };
});
