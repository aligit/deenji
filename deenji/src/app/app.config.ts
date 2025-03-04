import '@angular/localize/init';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideFileRouter, requestContextInterceptor } from '@analogjs/router';

import { provideTrpcClient } from '../trpc-client';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { registerLocaleData } from '@angular/common';
import localeFa from '@angular/common/locales/fa';
import { LOCALE_ID } from '@angular/core';

registerLocaleData(localeFa);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideFileRouter(),
    provideClientHydration(),
    { provide: LOCALE_ID, useValue: 'fa' },
    provideHttpClient(
      withFetch(),
      withInterceptors([requestContextInterceptor])
    ),

    provideTrpcClient(),
    provideAngularSvgIcon(),
  ],
};
