import '@analogjs/vitest-angular/setup-zone';

import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { getTestBed } from '@angular/core/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Mock environment variables for tests
vi.mock('process', () => ({
  env: {
    VITE_ELASTICSEARCH_URL: 'http://localhost:9200',
  },
}));

// Mock import.meta.env
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_ELASTICSEARCH_URL: 'http://localhost:9200',
      },
    },
  },
  writable: true,
});
