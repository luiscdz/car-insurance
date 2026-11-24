import type { Routes } from '@angular/router';
import { FALLBACK_COPY } from './core/content/fallback-copy';
import { leaveWizardGuard } from './features/wizard/shell/leave-guard';

/**
 * The country code is the first address segment and the step slug the second (ADR-001). Step
 * addresses are child routes of the country, so moving between steps keeps the wizard (AC-035).
 */
export const routes: Routes = [
  {
    path: '',
    title: FALLBACK_COPY.pageTitle,
    loadComponent: () =>
      import('./features/country-selection/country-selection').then((m) => m.CountrySelection),
  },
  {
    path: ':country',
    loadComponent: () => import('./features/wizard/shell/wizard-shell').then((m) => m.WizardShell),
    canDeactivate: [leaveWizardGuard],
    children: [
      { path: '', children: [] },
      { path: ':step', children: [] },
      { path: '**', children: [] },
    ],
  },
];
