import { DOCUMENT, Injectable, InjectionToken, inject, signal } from '@angular/core';
import {
  type FieldValue,
  type WizardData,
  wizardDataSchema,
  type WizardStep,
} from '@car-insurance/shared';
import { EMPTY_WIZARD_DATA, reconcile } from './wizard-data';

/** The tab's session storage; `null` when the browser does not offer it. */
export const WIZARD_STORAGE = new InjectionToken<Storage | null>('WIZARD_STORAGE', {
  providedIn: 'root',
  factory: () => {
    try {
      return inject(DOCUMENT).defaultView?.sessionStorage ?? null;
    } catch {
      return null;
    }
  },
});

const STORAGE_KEY_PREFIX = 'wizard:';

/** Storage key of a country's wizard data: data is kept per country (AC-023). */
export function storageKey(code: string): string {
  return `${STORAGE_KEY_PREFIX}${code}`;
}

/**
 * Signals store of the wizard data per country, mirrored to the tab's session storage so it
 * survives going back and reloading and is discarded when the tab closes (AC-020, AC-022, AC-023,
 * AC-026). It is the only code that touches session storage (engineering reference).
 */
@Injectable({ providedIn: 'root' })
export class WizardStateStore {
  private readonly storage = inject(WIZARD_STORAGE);
  private readonly countries = signal<Readonly<Record<string, WizardData>>>({});

  /** The data of a country; reactive when read inside a signal context. */
  data(code: string): WizardData {
    return this.countries()[code] ?? EMPTY_WIZARD_DATA;
  }

  /**
   * Restores a country's data from session storage and reconciles it with the current
   * configuration (AC-025). Malformed stored data is discarded.
   */
  load(code: string, steps: readonly WizardStep[], today: Date): WizardData {
    const data = reconcile(this.read(code), steps, today);
    this.save(code, data);
    return data;
  }

  /** Stores the confirmed values of a step and marks it complete (AC-019). */
  confirmStep(code: string, slug: string, values: Readonly<Record<string, FieldValue>>): void {
    const current = this.data(code);
    this.save(code, {
      steps: { ...current.steps, [slug]: { values: { ...values }, complete: true } },
    });
  }

  private read(code: string): WizardData {
    try {
      const raw = this.storage?.getItem(storageKey(code));
      if (raw == null) {
        return EMPTY_WIZARD_DATA;
      }
      const parsed = wizardDataSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : EMPTY_WIZARD_DATA;
    } catch {
      return EMPTY_WIZARD_DATA;
    }
  }

  private save(code: string, data: WizardData): void {
    this.countries.update((countries) => ({ ...countries, [code]: data }));
    try {
      this.storage?.setItem(storageKey(code), JSON.stringify(data));
    } catch {
      // Storage full or unavailable: the data stays in memory for this page.
    }
  }
}
