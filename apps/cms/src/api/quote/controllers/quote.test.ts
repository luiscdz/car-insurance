import type { Core } from '@strapi/strapi';
import { describe, expect, it, vi } from 'vitest';
import type { QuoteService } from '../services/quote';
import quoteController, { type QuoteContext } from './quote';

function setup(price: QuoteService['price']) {
  const service: QuoteService = { price: vi.fn(price) };
  const log = vi.fn();
  const strapi = {
    service: (uid: string) => (uid === 'api::quote.quote' ? service : undefined),
    log: { info: log, debug: log, warn: log, error: log },
  } as unknown as Core.Strapi;
  return { controller: quoteController({ strapi }), service, log };
}

function context(body: unknown): QuoteContext {
  return { request: { body }, status: 200, body: undefined };
}

describe('price quote controller', () => {
  it('AC-045 answers the final price of a valid request', async () => {
    const { controller, service } = setup(async () => 1500000);
    const ctx = context({ country: 'co', plan: 'co-basico', policyholderAge: 22, vehicleAge: 8 });

    await controller.price(ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({ data: { finalPrice: 1500000 } });
    expect(service.price).toHaveBeenCalledWith({
      country: 'co',
      plan: 'co-basico',
      policyholderAge: 22,
      vehicleAge: 8,
    });
  });

  it.each([
    ['no body', undefined],
    ['an age that is not a whole number', { country: 'co', plan: 'x', policyholderAge: 22.5 }],
    ['an age sent as text', { country: 'cl', plan: 'x', vehicleAge: '8' }],
    ['a base price sent by the browser', { country: 'co', plan: 'x', basePrice: 1 }],
    ['an entered value', { country: 'co', plan: 'x', placa: 'ABC123' }],
    ['no plan', { country: 'co' }],
  ])('AC-045 AC-046 answers a generic error without echoing the input for %s', async (_, body) => {
    const { controller, service, log } = setup(async () => 1);
    const ctx = context(body);

    await controller.price(ctx);

    expect(ctx.status).toBe(400);
    expect(JSON.stringify(ctx.body)).not.toMatch(/ABC123|22\.5|basePrice|placa/);
    expect(service.price).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('AC-045 answers not found when the plan is not published, active and of the country', async () => {
    const { controller } = setup(async () => null);
    const ctx = context({ country: 'cl', plan: 'co-basico', policyholderAge: 30 });

    await controller.price(ctx);

    expect(ctx.status).toBe(404);
    expect(ctx.body).toEqual({
      data: null,
      error: { status: 404, name: 'NotFoundError', message: 'Plan not available' },
    });
  });
});
