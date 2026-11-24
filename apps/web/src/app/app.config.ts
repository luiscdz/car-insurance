import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { CONTENT_READER } from './core/content/content-reader';
import { StrapiContentReader } from './core/content/strapi-content-reader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
      withComponentInputBinding(),
      // A cancelled back or forward navigation restores the browser history (AC-034).
      withRouterConfig({ canceledNavigationResolution: 'computed' }),
    ),
    { provide: CONTENT_READER, useClass: StrapiContentReader },
  ],
};
