import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CountrySummary } from '@car-insurance/shared';

/** One link per published country, labeled with the country name from Strapi (AC-001). */
@Component({
  selector: 'app-country-list',
  imports: [RouterLink],
  template: `
    <ul class="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
      @for (country of countries(); track country.code) {
        <li>
          <a
            [routerLink]="['/', country.code]"
            class="group flex min-h-18 items-center justify-between rounded-lg border border-border bg-background px-5 py-4 text-xl font-bold text-primary-strong no-underline transition-colors hover:border-primary hover:bg-surface-info focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-strong"
          >
            {{ country.name }}
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              class="size-6 flex-none text-primary transition-transform motion-safe:group-hover:translate-x-1"
            >
              <path
                d="M9 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
        </li>
      }
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryList {
  readonly countries = input.required<readonly CountrySummary[]>();
}
