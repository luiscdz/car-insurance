import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import type { CountrySummary } from '@car-insurance/shared';
import { CONTENT_READER } from '../../core/content/content-reader';
import { FALLBACK_COPY } from '../../core/content/fallback-copy';
import { toCountryList } from '../../core/content/wizard-content';
import { DEFAULT_THEME, ThemeService } from '../../core/country/theme';
import { Button } from '../../shared/ui/button';
import { Loader } from '../../shared/ui/loader';
import { StatusMessage } from '../../shared/ui/status-message';
import { CountryList } from './components/country-list';

type View =
  | { readonly kind: 'loading' | 'unavailable' | 'not-available' }
  | { readonly kind: 'ready'; readonly countries: readonly CountrySummary[] };

/**
 * Root address: the person chooses among the countries published in Strapi (AC-001). Its heading
 * and title are fallback copy; loading, unavailable and invalid states are controlled (AC-015 to
 * AC-017).
 */
@Component({
  selector: 'app-country-selection',
  imports: [Button, CountryList, Loader, StatusMessage],
  template: `
    <div class="h-1.5 bg-primary-strong"></div>
    <div class="h-1 bg-accent"></div>
    <main class="mx-auto max-w-240 px-4 pt-6 pb-12">
      @switch (view().kind) {
        @case ('loading') {
          <app-loader [label]="copy.loading" />
        }
        @case ('unavailable') {
          <app-status-message [message]="copy.unavailable">
            <button type="button" appButton="cta" (click)="retry()">{{ copy.retry }}</button>
          </app-status-message>
        }
        @case ('not-available') {
          <app-status-message [message]="copy.notAvailableNow" />
        }
        @default {
          <h1
            class="mb-6 text-2xl leading-tight font-bold text-balance text-primary-strong md:text-[2rem]"
          >
            {{ copy.countrySelectionHeading }}
          </h1>
          <app-country-list [countries]="countries()" />
        }
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountrySelection {
  private readonly reader = inject(CONTENT_READER);

  protected readonly copy = FALLBACK_COPY;

  private readonly result = resource({
    loader: async () => toCountryList(await this.reader.readCountries()),
  });

  protected readonly view = computed<View>(() => {
    if (this.result.isLoading()) {
      return { kind: 'loading' };
    }
    if (this.result.error()) {
      return { kind: 'unavailable' };
    }
    const result = this.result.value();
    if (result === undefined || result.kind === 'invalid' || result.countries.length === 0) {
      return { kind: 'not-available' };
    }
    return { kind: 'ready', countries: result.countries };
  });

  protected readonly countries = computed(() => {
    const view = this.view();
    return view.kind === 'ready' ? view.countries : [];
  });

  constructor() {
    inject(ThemeService).apply(DEFAULT_THEME);
  }

  protected retry(): void {
    this.result.reload();
  }
}
