import { DOCUMENT, Injectable, inject } from '@angular/core';
import { themeSchema } from '@car-insurance/shared';

export interface ThemeLogo {
  readonly url: string;
  readonly alt: string;
}

/** Theme values applied to the page; `null` keeps the default token of the design reference. */
export interface ResolvedTheme {
  readonly primaryColor: string | null;
  readonly accentColor: string | null;
  readonly logo: ThemeLogo | null;
}

/** The default theme of the design reference: CSS defaults and the text placeholder (AC-003). */
export const DEFAULT_THEME: ResolvedTheme = { primaryColor: null, accentColor: null, logo: null };

function absoluteUrl(url: string, mediaBaseUrl: string): string {
  return /^https?:\/\//.test(url) ? url : `${mediaBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Resolves a country theme from Strapi. A missing or malformed theme gives the default theme;
 * a valid theme without a logo keeps its colors and shows the text placeholder (AC-003).
 */
export function resolveTheme(raw: unknown, mediaBaseUrl: string, logoAlt: string): ResolvedTheme {
  const parsed = themeSchema.safeParse(raw);
  if (!parsed.success) {
    return DEFAULT_THEME;
  }
  const { primaryColor, accentColor, logo } = parsed.data;
  return {
    primaryColor,
    accentColor,
    logo: logo
      ? { url: absoluteUrl(logo.url, mediaBaseUrl), alt: logo.alternativeText?.trim() || logoAlt }
      : null,
  };
}

/** CSS custom properties of the design tokens a country theme overrides. */
const THEME_PROPERTIES = { primaryColor: '--primary', accentColor: '--accent' } as const;

/** Applies a theme at runtime as CSS custom properties on the document root (docs/design.md). */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;

  apply(theme: ResolvedTheme): void {
    for (const [key, property] of Object.entries(THEME_PROPERTIES)) {
      const value = theme[key as keyof typeof THEME_PROPERTIES];
      if (value === null) {
        this.root.style.removeProperty(property);
      } else {
        this.root.style.setProperty(property, value);
      }
    }
  }
}
