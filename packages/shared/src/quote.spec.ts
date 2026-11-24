import { describe, expect, it } from 'vitest';
import { priceQuoteRequestSchema, priceQuoteResponseSchema } from './quote.js';

describe('price quote schemas', () => {
  it('AC-046 accepts the country, the plan and the two derived ages, each age optional', () => {
    const full = { country: 'co', plan: 'abc123', policyholderAge: 22, vehicleAge: 8 };

    expect(priceQuoteRequestSchema.parse(full)).toEqual(full);
    expect(priceQuoteRequestSchema.parse({ country: 'cl', plan: 'x', vehicleAge: -1 })).toEqual({
      country: 'cl',
      plan: 'x',
      vehicleAge: -1,
    });
  });

  it.each([
    ['an entered birth date', { birthDate: '1990-01-01' }],
    ['an entered document number', { numeroDocumento: '1234567890' }],
    ['a base price sent by the browser', { basePrice: 1 }],
  ])('AC-046 rejects a request that carries %s', (_, extra) => {
    expect(
      priceQuoteRequestSchema.safeParse({
        country: 'co',
        plan: 'abc',
        policyholderAge: 30,
        ...extra,
      }).success,
    ).toBe(false);
  });

  it.each([
    ['an age that is not a whole number', { policyholderAge: 30.5 }],
    ['an age sent as text', { vehicleAge: '8' }],
    ['a country that is not a code', { country: 'CO' }],
    ['a blank plan', { plan: ' ' }],
  ])('AC-045 rejects a request with %s', (_, change) => {
    expect(
      priceQuoteRequestSchema.safeParse({ country: 'cl', plan: 'abc', ...change }).success,
    ).toBe(false);
  });

  it('AC-047 accepts only a whole final price greater than zero', () => {
    expect(priceQuoteResponseSchema.parse({ data: { finalPrice: 455000 } }).data.finalPrice).toBe(
      455000,
    );
    for (const finalPrice of [0, -5, 10.5, '455000', null]) {
      expect(priceQuoteResponseSchema.safeParse({ data: { finalPrice } }).success).toBe(false);
    }
    expect(priceQuoteResponseSchema.safeParse({ error: 'x' }).success).toBe(false);
  });
});
