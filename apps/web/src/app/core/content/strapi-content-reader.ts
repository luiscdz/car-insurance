import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../config/app-config';
import type { ContentReader, RawWizardContent } from './content-reader';

/** Largest page Strapi returns (config/api.ts `maxLimit`). */
const PAGE_SIZE = '100';

const COUNTRY_LIST_PARAMS = {
  'fields[0]': 'code',
  'fields[1]': 'name',
  'sort[0]': 'name:asc',
  'pagination[pageSize]': PAGE_SIZE,
};

const COUNTRY_PARAMS = {
  'fields[0]': 'code',
  'fields[1]': 'name',
  'fields[2]': 'currency',
  'fields[3]': 'formatLocale',
  'populate[theme][populate][logo][fields][0]': 'url',
  'populate[theme][populate][logo][fields][1]': 'alternativeText',
  'populate[copy]': 'true',
};

const STEP_PARAMS = {
  'sort[0]': 'order:asc',
  'sort[1]': 'createdAt:asc',
  'pagination[pageSize]': PAGE_SIZE,
  'populate[fields][sort][0]': 'order:asc',
  'populate[fields][sort][1]': 'createdAt:asc',
  'populate[fields][populate][options]': 'true',
  'populate[fields][populate][validation]': 'true',
};

/**
 * Reads the wizard content through Strapi's read-only public role; no token is sent (P4). Only
 * published entries are returned by the content API, and responses are never cached (AC-007).
 */
@Injectable()
export class StrapiContentReader implements ContentReader {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfig);

  async readCountries(): Promise<unknown> {
    return this.get('/api/countries', COUNTRY_LIST_PARAMS);
  }

  async readWizard(code: string): Promise<RawWizardContent> {
    const [country, steps, mediaBaseUrl] = await Promise.all([
      this.get('/api/countries', { ...COUNTRY_PARAMS, 'filters[code][$eq]': code }),
      this.get('/api/wizard-steps', { ...STEP_PARAMS, 'filters[country][code][$eq]': code }),
      this.config.cmsUrl(),
    ]);
    return { country, steps, mediaBaseUrl };
  }

  private async get(path: string, params: Record<string, string>): Promise<unknown> {
    const base = await this.config.cmsUrl();
    return firstValueFrom(
      this.http.get<unknown>(`${base}${path}`, {
        params: new HttpParams({ fromObject: params }),
        cache: 'no-store',
      }),
    );
  }
}
