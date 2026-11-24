import { DOCUMENT, Injectable, InjectionToken, inject, signal } from '@angular/core';
import {
  type FieldValue,
  type WizardContent,
  type WizardData,
  wizardDataSchema,
} from '@car-insurance/shared';
import {
  EMPTY_WIZARD_DATA,
  reconcile,
  sameValues,
  withChosenPlan,
  withFinalPrice,
  withoutFinalPrice,
} from './wizard-data';

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
   * configuration and plans (AC-025, AC-055). Malformed stored data is discarded.
   */
  load(code: string, content: WizardContent, today: Date): WizardData {
    const data = reconcile(this.read(code), content, today);
    this.save(code, data);
    return data;
  }

  /**
   * Stores the confirmed values of a step and marks it complete (AC-019). Values that differ from
   * the stored ones discard the chosen plan's final price, which was obtained with them (AC-054).
   */
  confirmStep(code: string, slug: string, values: Readonly<Record<string, FieldValue>>): void {
    const current = this.data(code);
    const stored = current.steps[slug]?.values;
    const confirmed: WizardData = {
      ...current,
      steps: { ...current.steps, [slug]: { values: { ...values }, complete: true } },
    };
    const unchanged = stored !== undefined && sameValues(stored, values);
    this.save(code, unchanged ? confirmed : withoutFinalPrice(confirmed));
  }

  /** Stores the chosen plan at once, without a final price (AC-048); the same plan changes nothing. */
  choosePlan(code: string, id: string): void {
    const current = this.data(code);
    if (current.plan?.id !== id) {
      this.save(code, withChosenPlan(current, id));
    }
  }

  /** Discards the stored final price while a new one is obtained (AC-053, AC-056). */
  discardFinalPrice(code: string): void {
    const current = this.data(code);
    if (current.plan?.finalPrice != null) {
      this.save(code, withoutFinalPrice(current));
    }
  }

  /** Stores the final price of a plan only while it is still the chosen one (AC-049, AC-050). */
  storeFinalPrice(code: string, id: string, finalPrice: number): void {
    const current = this.data(code);
    const priced = withFinalPrice(current, id, finalPrice);
    if (priced !== current) {
      this.save(code, priced);
    }
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
