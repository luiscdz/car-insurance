import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { PriceQuoteRequest } from '@car-insurance/shared';
import { AppConfig } from '../config/app-config';
import { StrapiPriceQuote } from './strapi-price-quote';

describe('StrapiPriceQuote', () => {
  let http: HttpTestingController;
  let quote: StrapiPriceQuote;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        StrapiPriceQuote,
        { provide: AppConfig, useValue: { cmsUrl: async () => 'http://cms.test' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    quote = TestBed.inject(StrapiPriceQuote);
  });

  afterEach(() => http.verify());

  const nextTask = () => new Promise((resolve) => setTimeout(resolve));

  it('AC-045 AC-046 AC-066 posts only the country, the plan and the derived ages, without any token', async () => {
    const result = quote.finalPrice({
      country: 'co',
      plan: 'co-basico',
      policyholderAge: 22,
      vehicleAge: 8,
    });
    await nextTask();

    const request = http.expectOne('http://cms.test/api/quote/price');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      country: 'co',
      plan: 'co-basico',
      policyholderAge: 22,
      vehicleAge: 8,
    });
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.cache).toBe('no-store');
    expect(request.request.params.keys()).toEqual([]);
    request.flush({ data: { finalPrice: 1500000 } });
    await expect(result).resolves.toBe(1500000);
  });

  it('AC-046 never sends a request that carries anything else', async () => {
    const tampered = { country: 'cl', plan: 'x', rut: '12.345.678-5' } as PriceQuoteRequest;

    await expect(quote.finalPrice(tampered)).rejects.toBeTruthy();
    http.expectNone('http://cms.test/api/quote/price');
  });

  it.each([
    ['a decimal price', { data: { finalPrice: 10.5 } }],
    ['a price of 0', { data: { finalPrice: 0 } }],
    ['no price', { data: {} }],
  ])('AC-047 rejects an answer with %s', async (_, answer) => {
    const result = quote.finalPrice({ country: 'cl', plan: 'cl-full' });
    await nextTask();

    http.expectOne('http://cms.test/api/quote/price').flush(answer);
    await expect(result).rejects.toBeTruthy();
  });

  it('AC-047 rejects on an HTTP error', async () => {
    const result = quote.finalPrice({ country: 'cl', plan: 'cl-full' });
    await nextTask();

    http
      .expectOne('http://cms.test/api/quote/price')
      .flush({ error: 'x' }, { status: 404, statusText: 'Not Found' });
    await expect(result).rejects.toBeTruthy();
  });

  it('AC-049 stops waiting when the request is aborted', async () => {
    const controller = new AbortController();
    const result = quote.finalPrice({ country: 'co', plan: 'co-global' }, controller.signal);
    await nextTask();
    const request = http.expectOne('http://cms.test/api/quote/price');

    controller.abort();

    await expect(result).rejects.toBeTruthy();
    expect(request.cancelled).toBe(true);
  });
});
