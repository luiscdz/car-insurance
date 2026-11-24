import type { Core } from '@strapi/strapi';
import { describe, expect, it, vi } from 'vitest';
import quoteService from './quote';

interface StoredPlan {
  readonly documentId: string;
  readonly country: string;
  readonly basePrice: number;
  readonly active: boolean;
  readonly published: boolean;
}

const PLANS: readonly StoredPlan[] = [
  { documentId: 'co-basico', country: 'co', basePrice: 1200000, active: true, published: true },
  { documentId: 'co-antiguo', country: 'co', basePrice: 900000, active: false, published: true },
  { documentId: 'co-borrador', country: 'co', basePrice: 3000000, active: true, published: false },
  { documentId: 'cl-esencial', country: 'cl', basePrice: 350000, active: true, published: true },
];

interface Query {
  status: string;
  filters: { documentId: string; active: boolean; country: { code: string } };
  fields: string[];
}

/** A Strapi whose document service can only read plans; any write or log call is recorded. */
function fakeStrapi() {
  const calls: string[] = [];
  const queries: Query[] = [];
  const record = (name: string) =>
    vi.fn((...args: unknown[]) => calls.push(`${name} ${JSON.stringify(args)}`));
  const documents = (uid: string) => ({
    findFirst: async (query: Query) => {
      queries.push(query);
      const { documentId, active, country } = query.filters;
      const plan = PLANS.find(
        (candidate) =>
          uid === 'api::plan.plan' &&
          candidate.published === (query.status === 'published') &&
          candidate.documentId === documentId &&
          candidate.active === active &&
          candidate.country === country.code,
      );
      return plan ? { documentId: plan.documentId, basePrice: plan.basePrice } : null;
    },
    create: record('create'),
    update: record('update'),
    delete: record('delete'),
    publish: record('publish'),
  });
  const log = {
    info: record('log'),
    debug: record('log'),
    warn: record('log'),
    error: record('log'),
  };
  const strapi = { documents, log, db: { query: record('db') } } as unknown as Core.Strapi;
  return { strapi, calls, queries };
}

describe('price quote service', () => {
  it('AC-045 computes the final price from the published, active plan of the country', async () => {
    const { strapi, queries } = fakeStrapi();
    const service = quoteService({ strapi });

    await expect(
      service.price({ country: 'co', plan: 'co-basico', policyholderAge: 22, vehicleAge: 8 }),
    ).resolves.toBe(1500000);
    await expect(
      service.price({ country: 'cl', plan: 'cl-esencial', policyholderAge: 70, vehicleAge: 15 }),
    ).resolves.toBe(455000);
    expect(queries[0]).toEqual({
      status: 'published',
      filters: { documentId: 'co-basico', active: true, country: { code: 'co' } },
      fields: ['basePrice'],
    });
  });

  it('AC-045 answers no price for a plan that is inactive, not published, unknown or of another country', async () => {
    const service = quoteService(fakeStrapi());

    for (const request of [
      { country: 'co', plan: 'co-antiguo' },
      { country: 'co', plan: 'co-borrador' },
      { country: 'co', plan: 'no-existe' },
      { country: 'co', plan: 'cl-esencial' },
      { country: 'cl', plan: 'co-basico' },
    ]) {
      await expect(service.price(request)).resolves.toBeNull();
    }
  });

  it('AC-046 stores nothing and logs no input', async () => {
    const { strapi, calls } = fakeStrapi();

    await quoteService({ strapi }).price({
      country: 'co',
      plan: 'co-basico',
      policyholderAge: 40,
      vehicleAge: 3,
    });
    await quoteService({ strapi }).price({ country: 'co', plan: 'no-existe' });

    expect(calls).toEqual([]);
  });
});

describe('simulated payment service', () => {
  const now = () => new Date(Date.UTC(2026, 10, 23, 12, 0, 0));

  it('AC-080 AC-084 approves a published, active plan of the country with a new quote number', async () => {
    const { strapi, queries } = fakeStrapi();
    const service = quoteService({ strapi }, now);

    const colombia = await service.pay({ country: 'co', plan: 'co-basico' });
    const chile = await service.pay({ country: 'cl', plan: 'cl-esencial' });

    expect(colombia).toEqual({ status: 'approved', quoteNumber: expect.any(String) });
    expect(colombia.status === 'approved' && colombia.quoteNumber).toMatch(
      /^CO-20261123-[A-Z0-9]{6}$/,
    );
    expect(chile.status === 'approved' && chile.quoteNumber).toMatch(/^CL-20261123-[A-Z0-9]{6}$/);
    expect(queries[0]).toEqual({
      status: 'published',
      filters: { documentId: 'co-basico', active: true, country: { code: 'co' } },
      fields: ['basePrice'],
    });
  });

  it.each([
    ['an inactive plan', { country: 'co', plan: 'co-antiguo' }],
    ['an unpublished plan', { country: 'co', plan: 'co-borrador' }],
    ['an unknown plan', { country: 'co', plan: 'no-existe' }],
    ['a plan of another country', { country: 'co', plan: 'cl-esencial' }],
    ['a plan of another country, for Chile', { country: 'cl', plan: 'co-basico' }],
  ])('AC-080 rejects %s without a quote number', async (_, request) => {
    const service = quoteService(fakeStrapi(), now);

    await expect(service.pay(request)).resolves.toEqual({ status: 'rejected' });
  });

  it('AC-079 stores nothing and logs no input', async () => {
    const { strapi, calls } = fakeStrapi();

    await quoteService({ strapi }).pay({ country: 'co', plan: 'co-basico' });
    await quoteService({ strapi }).pay({ country: 'cl', plan: 'no-existe' });

    expect(calls).toEqual([]);
  });
});
