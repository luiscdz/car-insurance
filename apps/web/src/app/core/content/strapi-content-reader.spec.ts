import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppConfig } from '../config/app-config';
import { StrapiContentReader } from './strapi-content-reader';

describe('StrapiContentReader', () => {
  let http: HttpTestingController;
  let reader: StrapiContentReader;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        StrapiContentReader,
        { provide: AppConfig, useValue: { cmsUrl: async () => 'http://cms.test' } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    reader = TestBed.inject(StrapiContentReader);
  });

  afterEach(() => http.verify());

  const nextTask = () => new Promise((resolve) => setTimeout(resolve));

  it('AC-001 reads the published countries by name without any token', async () => {
    const result = reader.readCountries();

    await nextTask();
    const [request] = http.match((r) => r.url === 'http://cms.test/api/countries');
    expect(request?.request.params.get('sort[0]')).toBe('name:asc');
    expect(request?.request.headers.has('Authorization')).toBe(false);
    expect(request?.request.cache).toBe('no-store');
    request?.flush({ data: [] });
    await expect(result).resolves.toEqual({ data: [] });
  });

  it('AC-004 AC-026 requests the country and its steps filtered only by the country code', async () => {
    const read = reader.readWizard('cl');
    await nextTask();
    const requests = http.match(() => true);

    expect(requests.map((r) => r.request.url).sort()).toEqual([
      'http://cms.test/api/countries',
      'http://cms.test/api/wizard-steps',
    ]);
    for (const request of requests) {
      const params = request.request.params;
      const filters = params.keys().filter((key) => key.startsWith('filters'));
      expect(filters.map((key) => params.get(key))).toEqual(['cl']);
      expect(request.request.method).toBe('GET');
      expect(request.request.body).toBeNull();
      expect(request.request.cache).toBe('no-store');
    }
    const steps = requests.find((r) => r.request.url.endsWith('/wizard-steps'));
    expect(steps?.request.params.get('populate[fields][sort][0]')).toBe('order:asc');
    expect(steps?.request.params.get('populate[fields][sort][1]')).toBe('createdAt:asc');

    for (const request of requests) {
      request.flush({ data: [request.request.url] });
    }
    await expect(read).resolves.toEqual({
      country: { data: ['http://cms.test/api/countries'] },
      steps: { data: ['http://cms.test/api/wizard-steps'] },
      mediaBaseUrl: 'http://cms.test',
    });
  });

  it('AC-016 rejects when Strapi answers with an error', async () => {
    const read = reader.readCountries();
    await nextTask();
    http.expectOne(() => true).flush('down', { status: 503, statusText: 'Unavailable' });

    await expect(read).rejects.toBeTruthy();
  });
});
