import type { Core } from '@strapi/strapi';
import { type CountrySeed, SEED_COUNTRIES } from './countries';

type FieldSeed = NonNullable<CountrySeed['steps'][number]['fields']>[number];

async function createField(strapi: Core.Strapi, stepId: string, field: FieldSeed): Promise<void> {
  await strapi.documents('api::form-field.form-field').create({
    status: 'published',
    data: {
      step: stepId,
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required ?? false,
      placeholder: field.placeholder ?? null,
      helpText: field.helpText ?? null,
      errorMessage: field.errorMessage,
      order: field.order,
      options: (field.options ?? []).map(({ value, label, order }) => ({ value, label, order })),
      validation: field.validation ?? null,
    },
  });
}

async function createCountry(strapi: Core.Strapi, seed: CountrySeed): Promise<void> {
  const { code, name, currency, formatLocale, theme, copy } = seed.country;
  const country = await strapi.documents('api::country.country').create({
    status: 'published',
    data: { code, name, currency, formatLocale, theme, copy },
  });
  for (const step of seed.steps) {
    const created = await strapi.documents('api::wizard-step.wizard-step').create({
      status: 'published',
      data: {
        country: country.documentId,
        slug: step.slug,
        title: step.title,
        type: step.type,
        order: step.order,
      },
    });
    for (const field of step.fields ?? []) {
      await createField(strapi, created.documentId, field);
    }
  }
}

/**
 * Seeds Colombia and Chile, published, only when no country exists yet, so later edits made by
 * the business team are never overwritten (docs/architecture.md).
 */
export async function seedWhenEmpty(strapi: Core.Strapi): Promise<boolean> {
  const countries = await strapi.db.query('api::country.country').count();
  if (countries > 0) {
    return false;
  }
  for (const seed of SEED_COUNTRIES) {
    await createCountry(strapi, seed);
  }
  strapi.log.info(`Seeded ${SEED_COUNTRIES.length} countries`);
  return true;
}
