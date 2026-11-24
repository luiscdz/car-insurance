import { describe, expect, it } from 'vitest';
import {
  paymentRequestSchema,
  paymentResponseSchema,
  QUOTE_NUMBER_PATTERN,
  quoteNumberSchema,
} from './payment.js';

describe('payment schemas', () => {
  it('AC-079 accepts a request with only the country code and the plan identifier', () => {
    const request = { country: 'co', plan: 'abc123' };

    expect(paymentRequestSchema.parse(request)).toEqual(request);
  });

  it.each([
    ['an entered document number', { numeroDocumento: '1234567890' }],
    ['an entered RUT', { rut: '12.345.678-5' }],
    ['a price', { amount: 1 }],
    ['the plan name', { planName: 'Plan Full' }],
  ])('AC-079 rejects a request that carries %s', (_, extra) => {
    expect(paymentRequestSchema.safeParse({ country: 'cl', plan: 'x', ...extra }).success).toBe(
      false,
    );
  });

  it.each([{}, { country: 'CO', plan: 'x' }, { country: 'co', plan: ' ' }, { plan: 'x' }])(
    'AC-080 rejects the malformed request %j',
    (request) => {
      expect(paymentRequestSchema.safeParse(request).success).toBe(false);
    },
  );

  it('AC-084 accepts quote numbers of both countries in the agreed format', () => {
    expect(quoteNumberSchema.parse('CO-20261123-7KQ2MX')).toBe('CO-20261123-7KQ2MX');
    expect(QUOTE_NUMBER_PATTERN.test('CL-20261123-A9F03Z')).toBe(true);
  });

  it.each([
    'co-20261123-7KQ2MX',
    'CO-2026112-7KQ2MX',
    'CO-20261123-7KQ2M',
    'CO-20261123-7kq2mx',
    'COL-20261123-7KQ2MX',
    'CO_20261123_7KQ2MX',
  ])('AC-084 rejects the malformed quote number %s', (value) => {
    expect(quoteNumberSchema.safeParse(value).success).toBe(false);
  });

  it('AC-081 reads an approval with a quote number and a rejection', () => {
    expect(
      paymentResponseSchema.parse({
        data: { status: 'approved', quoteNumber: 'CL-20261123-A9F03Z' },
      }),
    ).toEqual({ data: { status: 'approved', quoteNumber: 'CL-20261123-A9F03Z' } });
    expect(paymentResponseSchema.parse({ data: { status: 'rejected' } })).toEqual({
      data: { status: 'rejected' },
    });
  });

  it.each([
    { data: { status: 'approved' } },
    { data: { status: 'approved', quoteNumber: 'abc' } },
    { data: { status: 'pending' } },
    { data: null },
    {},
  ])('AC-081 rejects the invalid answer %j', (answer) => {
    expect(paymentResponseSchema.safeParse(answer).success).toBe(false);
  });
});
