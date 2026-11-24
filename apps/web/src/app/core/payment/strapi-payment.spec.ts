import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { PaymentRequest } from '@car-insurance/shared';
import { AppConfig } from '../config/app-config';
import { StrapiPayment } from './strapi-payment';

const URL = 'http://cms.test/api/quote/pay';

describe('StrapiPayment', () => {
  let http: HttpTestingController;
  let payment: StrapiPayment;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        StrapiPayment,
        { provide: AppConfig, useValue: { cmsUrl: async () => 'http://cms.test' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    payment = TestBed.inject(StrapiPayment);
  });

  afterEach(() => http.verify());

  const nextTask = () => new Promise((resolve) => setTimeout(resolve));

  it.each([
    ['co', 'co-clasico', 'CO-20261123-7KQ2MX'],
    ['cl', 'cl-full', 'CL-20261123-A9F03Z'],
  ])(
    'AC-079 AC-082 %s: posts only the country and the plan, without any token, and reads the approval',
    async (country, plan, quoteNumber) => {
      const result = payment.pay({ country, plan });
      await nextTask();

      const request = http.expectOne(URL);
      expect(request.request.method).toBe('POST');
      expect(Object.keys(request.request.body as object).sort()).toEqual(['country', 'plan']);
      expect(request.request.body).toEqual({ country, plan });
      expect(request.request.headers.has('Authorization')).toBe(false);
      expect(request.request.cache).toBe('no-store');
      expect(request.request.params.keys()).toEqual([]);
      request.flush({ data: { status: 'approved', quoteNumber } });
      await expect(result).resolves.toEqual({ kind: 'approved', quoteNumber });
    },
  );

  it('AC-079 never sends a request that carries anything else', async () => {
    const tampered = { country: 'cl', plan: 'x', rut: '12.345.678-5' } as PaymentRequest;

    await expect(payment.pay(tampered)).rejects.toBeTruthy();
    http.expectNone(URL);
  });

  it('AC-081 reads a rejection', async () => {
    const result = payment.pay({ country: 'co', plan: 'co-basico' });
    await nextTask();

    http.expectOne(URL).flush({ data: { status: 'rejected' } });
    await expect(result).resolves.toEqual({ kind: 'rejected' });
  });

  it.each([
    ['an approval without a quote number', { data: { status: 'approved' } }],
    ['a malformed quote number', { data: { status: 'approved', quoteNumber: 'co-1-x' } }],
    ['an unknown status', { data: { status: 'pending' } }],
    ['no data', {}],
  ])('AC-081 rejects an answer with %s', async (_, answer) => {
    const result = payment.pay({ country: 'cl', plan: 'cl-full' });
    await nextTask();

    http.expectOne(URL).flush(answer);
    await expect(result).rejects.toBeTruthy();
  });

  it.each([
    [400, 'Bad Request'],
    [500, 'Server Error'],
  ])('AC-081 rejects on an HTTP error %s', async (status, statusText) => {
    const result = payment.pay({ country: 'cl', plan: 'cl-full' });
    await nextTask();

    http.expectOne(URL).flush({ error: 'x' }, { status, statusText });
    await expect(result).rejects.toBeTruthy();
  });

  it('AC-081 rejects on a network failure', async () => {
    const result = payment.pay({ country: 'co', plan: 'co-basico' });
    await nextTask();

    http.expectOne(URL).error(new ProgressEvent('error'));
    await expect(result).rejects.toBeTruthy();
  });

  it('AC-096 stops waiting when the request is aborted', async () => {
    const controller = new AbortController();
    const result = payment.pay({ country: 'co', plan: 'co-global' }, controller.signal);
    await nextTask();
    const request = http.expectOne(URL);

    controller.abort();

    await expect(result).rejects.toBeTruthy();
    expect(request.cancelled).toBe(true);
  });
});
