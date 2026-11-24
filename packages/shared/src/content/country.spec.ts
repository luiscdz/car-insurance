import { describe, expect, it } from 'vitest';
import { chile, colombia } from '../test-fixtures.js';
import { countryDetailSchema, countrySummarySchema, themeSchema } from './country.js';
import { collectionResponseSchema } from './strapi-envelope.js';

describe('country schemas', () => {
  it.each([colombia(), chile()])('AC-017 accepts the valid country $name', (country) => {
    expect(countryDetailSchema.safeParse(country).success).toBe(true);
  });

  it.each(['leaveTitle', 'leaveMessage', 'leaveStayLabel', 'leaveConfirmLabel', 'continueLabel'])(
    'AC-034 AC-017 rejects a country whose %s copy is missing or blank',
    (key) => {
      const missing = {
        ...colombia(),
        copy: Object.fromEntries(Object.entries(colombia().copy).filter(([name]) => name !== key)),
      };
      const blank = chile();
      (blank.copy as Record<string, unknown>)[key] = '   ';

      expect(countryDetailSchema.safeParse(missing).success).toBe(false);
      expect(countryDetailSchema.safeParse(blank).success).toBe(false);
    },
  );

  it('AC-017 rejects an unknown currency format, locale or code', () => {
    expect(countryDetailSchema.safeParse({ ...colombia(), currency: 'cop' }).success).toBe(false);
    expect(
      countryDetailSchema.safeParse({ ...colombia(), formatLocale: 'not a locale' }).success,
    ).toBe(false);
    expect(countryDetailSchema.safeParse({ ...chile(), code: 'CL' }).success).toBe(false);
  });

  it('AC-001 parses the list of countries in a Strapi envelope', () => {
    const list = collectionResponseSchema(countrySummarySchema).safeParse({
      data: [
        { code: 'cl', name: 'Chile', documentId: 'x' },
        { code: 'co', name: 'Colombia' },
      ],
      meta: { pagination: { total: 2 } },
    });

    expect(list.success).toBe(true);
    expect(list.data?.data.map((country) => country.code)).toEqual(['cl', 'co']);
  });

  it('AC-003 accepts a theme with valid colors and an optional logo', () => {
    expect(themeSchema.safeParse(colombia().theme).success).toBe(true);
    expect(
      themeSchema.safeParse({
        primaryColor: '#123456',
        accentColor: '#abcdef',
        logo: { url: '/uploads/logo.png', alternativeText: null },
      }).success,
    ).toBe(true);
  });

  it.each([
    null,
    {},
    { primaryColor: 'blue', accentColor: '#00AEC7' },
    { primaryColor: '#2D6DF6' },
  ])('AC-003 rejects the missing or malformed theme %j', (theme) => {
    expect(themeSchema.safeParse(theme).success).toBe(false);
  });
});
