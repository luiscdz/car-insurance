import { InjectionToken } from '@angular/core';

/** Raw responses needed to build one country's wizard; validated by the caller (P3). */
export interface RawWizardContent {
  readonly country: unknown;
  readonly steps: unknown;
  /** The country's published, active plans (AC-036, AC-059). */
  readonly plans: unknown;
  /** Base address media URLs from Strapi are relative to. */
  readonly mediaBaseUrl: string;
}

/** Reads published content from Strapi. Every request filters by the country code (ADR-001). */
export interface ContentReader {
  readCountries(): Promise<unknown>;
  readWizard(code: string): Promise<RawWizardContent>;
}

export const CONTENT_READER = new InjectionToken<ContentReader>('CONTENT_READER');
