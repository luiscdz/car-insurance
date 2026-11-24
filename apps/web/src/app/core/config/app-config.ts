import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { runtimeConfigSchema } from '@car-insurance/shared';
import { firstValueFrom } from 'rxjs';

/** Address of the runtime configuration, served next to the application. */
export const RUNTIME_CONFIG_PATH = 'config.json';

/**
 * Runtime configuration read from `config.json`, so one build serves every environment (P1).
 * It is validated before use; a failed or invalid read is retried on the next request.
 */
@Injectable({ providedIn: 'root' })
export class AppConfig {
  private readonly http = inject(HttpClient);
  private cmsUrlRequest: Promise<string> | null = null;

  /** Base address of the Strapi content API. */
  cmsUrl(): Promise<string> {
    this.cmsUrlRequest ??= firstValueFrom(
      this.http.get<unknown>(RUNTIME_CONFIG_PATH, { cache: 'no-store' }),
    )
      .then((raw) => runtimeConfigSchema.parse(raw).cmsUrl)
      .catch((error: unknown) => {
        this.cmsUrlRequest = null;
        throw error;
      });
    return this.cmsUrlRequest;
  }
}
