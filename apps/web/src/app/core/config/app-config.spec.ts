import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppConfig, RUNTIME_CONFIG_PATH } from './app-config';

describe('AppConfig', () => {
  let http: HttpTestingController;
  let config: AppConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withFetch()), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    config = TestBed.inject(AppConfig);
  });

  afterEach(() => http.verify());

  it('AC-001 reads the Strapi address once from the runtime configuration', async () => {
    const first = config.cmsUrl();
    http.expectOne(RUNTIME_CONFIG_PATH).flush({ cmsUrl: 'http://cms.test/' });

    await expect(first).resolves.toBe('http://cms.test');
    await expect(config.cmsUrl()).resolves.toBe('http://cms.test');
    http.expectNone(RUNTIME_CONFIG_PATH);
  });

  it('AC-016 an invalid or failed configuration read fails and is retried next time', async () => {
    const invalid = config.cmsUrl();
    http.expectOne(RUNTIME_CONFIG_PATH).flush({ cmsUrl: 'nota url' });
    await expect(invalid).rejects.toBeTruthy();

    const failed = config.cmsUrl();
    http.expectOne(RUNTIME_CONFIG_PATH).flush('down', { status: 404, statusText: 'Not Found' });
    await expect(failed).rejects.toBeTruthy();

    const retried = config.cmsUrl();
    http.expectOne(RUNTIME_CONFIG_PATH).flush({ cmsUrl: 'https://cms.example' });
    await expect(retried).resolves.toBe('https://cms.example');
  });
});
