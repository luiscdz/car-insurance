import { describe, expect, it } from 'vitest';
import { runtimeConfigSchema } from './runtime-config.js';
import { wizardDataSchema } from './wizard-data.js';

describe('wizard data schema', () => {
  it('AC-023 accepts stored values of text fields and checkboxes per step', () => {
    const data = {
      steps: {
        'tus-datos': { values: { rut: '12.345.678-5', acepta: true }, complete: true },
      },
    };

    expect(wizardDataSchema.parse(data)).toEqual(data);
  });

  it('AC-048 AC-053 accepts a chosen plan with or without its final price', () => {
    const chosen = { steps: {}, plan: { id: 'co-clasico', finalPrice: null } };
    const priced = { steps: {}, plan: { id: 'co-clasico', finalPrice: 2312500 } };

    expect(wizardDataSchema.parse(chosen)).toEqual(chosen);
    expect(wizardDataSchema.parse(priced)).toEqual(priced);
  });

  it('AC-053 data stored before plans existed is still valid', () => {
    expect(wizardDataSchema.parse({ steps: {} })).toEqual({ steps: {} });
  });

  it.each([
    { id: '', finalPrice: null },
    { id: 'x', finalPrice: 0 },
    { id: 'x', finalPrice: 10.5 },
    { id: 'x' },
  ])('AC-053 rejects a malformed stored plan %j', (plan) => {
    expect(wizardDataSchema.safeParse({ steps: {}, plan }).success).toBe(false);
  });

  it.each([null, { steps: [] }, { steps: { a: { values: { x: 1 }, complete: true } } }, 'texto'])(
    'AC-025 rejects malformed stored data %j',
    (raw) => {
      expect(wizardDataSchema.safeParse(raw).success).toBe(false);
    },
  );
});

describe('runtime config schema', () => {
  it('AC-001 reads the CMS address without a trailing slash', () => {
    expect(runtimeConfigSchema.parse({ cmsUrl: 'http://localhost:1337/' })).toEqual({
      cmsUrl: 'http://localhost:1337',
    });
  });

  it('AC-016 rejects an address that is not http or https', () => {
    expect(runtimeConfigSchema.safeParse({ cmsUrl: 'ftp://cms' }).success).toBe(false);
    expect(runtimeConfigSchema.safeParse({}).success).toBe(false);
  });
});
