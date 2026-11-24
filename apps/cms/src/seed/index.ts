import type { Core } from '@strapi/strapi';
import { type CountrySeed, type PlanSeed, SEED_COUNTRIES } from './countries';

type FieldSeed = NonNullable<CountrySeed['steps'][number]['fields']>[number];

async function createPlan(strapi: Core.Strapi, countryId: string, plan: PlanSeed): Promise<void> {
  await strapi.documents('api::plan.plan').create({
    status: 'published',
    data: {
      country: countryId,
      name: plan.name,
      description: plan.description,
      basePrice: plan.basePrice,
      currency: plan.currency,
      order: plan.order,
      recommended: plan.recommended === true,
      active: true,
      coverages: plan.coverages.map(({ name, highlight }) => ({
        name,
        highlight: highlight ?? null,
      })),
      benefits: (plan.benefits ?? []).map(({ text }) => ({ text })),
    },
  });
}

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
      pricingInput: field.pricingInput ?? null,
    },
  });
}

async function createCountry(strapi: Core.Strapi, seed: CountrySeed): Promise<void> {
  const { code, name, currency, formatLocale, theme, copy, planCopy } = seed.country;
  const country = await strapi.documents('api::country.country').create({
    status: 'published',
    data: { code, name, currency, formatLocale, theme, copy, planCopy },
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
  for (const plan of seed.plans) {
    await createPlan(strapi, country.documentId, plan);
  }
}

/**
 * Seeds Colombia and Chile with their steps, fields and plans, published, only when no country
 * exists yet, so later edits made by
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
