import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import {
  Router,
  provideRouter,
  withComponentInputBinding,
  withRouterConfig,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { fireEvent, screen, waitFor } from '@testing-library/angular';
import {
  envelope,
  FakeContentReader,
  FakePriceQuote,
  MemoryStorage,
  rawChile,
  rawChilePlans,
  rawChileSteps,
  rawPlan,
  TODAY,
} from '../../../../testing/content-fixtures';
import { routes } from '../../../app.routes';
import { CLOCK } from '../../../core/clock';
import { CONTENT_READER } from '../../../core/content/content-reader';
import { FALLBACK_COPY } from '../../../core/content/fallback-copy';
import { PRICE_QUOTE } from '../../../core/quote/price-quote';
import { WIZARD_STORAGE } from '../../../core/wizard-state/wizard-state';

let reader: FakeContentReader;
let quote: FakePriceQuote;
let storage: MemoryStorage;
let harness: RouterTestingHarness;

async function open(url: string): Promise<void> {
  harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url);
  await settle();
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  await harness.fixture.whenStable();
}

/** Renders without waiting for stability, which a pending price request would prevent. */
async function render(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  harness.fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve));
}

const router = () => TestBed.inject(Router);

async function fillChileFirstStep(): Promise<void> {
  fireEvent.input(await screen.findByRole('textbox', { name: /RUT/ }), {
    target: { value: '1234567-8' },
  });
  fireEvent.input(screen.getByLabelText(/Fecha de nacimiento/), {
    target: { value: '1990-01-01' },
  });
  await settle();
}

describe('WizardShell', () => {
  beforeEach(() => {
    reader = new FakeContentReader();
    quote = new FakePriceQuote();
    storage = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          routes,
          withComponentInputBinding(),
          withRouterConfig({ canceledNavigationResolution: 'computed' }),
        ),
        { provide: CONTENT_READER, useValue: reader },
        { provide: PRICE_QUOTE, useValue: quote },
        { provide: WIZARD_STORAGE, useValue: storage },
        { provide: CLOCK, useValue: () => TODAY },
      ],
    });
  });

  it('AC-001 AC-004 the country address opens its first step at its own address', async () => {
    await open('/co');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tus datos y tu vehículo' }),
    ).toBeTruthy();
    expect(router().url).toBe('/co/tus-datos-y-tu-vehiculo');
    expect(reader.requests).toEqual(['co']);
    expect(TestBed.inject(Title).getTitle()).toBe('Tus datos y tu vehículo – Colombia');
  });

  it('AC-008 AC-019 shows the progress of Chile with its own copy and every step', async () => {
    await open('/cl');

    const progress = await screen.findByRole('navigation', { name: 'Etapa 1 / 4' });
    expect(progress.querySelectorAll('li')).toHaveLength(4);
    expect(progress.querySelector('[aria-current="step"]')?.textContent).toContain('Tus datos');
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeTruthy();
  });

  it('AC-008 Colombia shows its own copy for the same elements', async () => {
    await open('/co');

    expect(await screen.findByRole('navigation', { name: 'Paso 1 de 3' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeTruthy();
  });

  it('AC-003 applies the theme of Chile with its logo and Colombia with the placeholder', async () => {
    const root = TestBed.inject(DOCUMENT).documentElement;
    await open('/cl');
    await screen.findByRole('heading', { level: 1, name: 'Tus datos' });

    expect(root.style.getPropertyValue('--primary')).toBe('#123456');
    expect(screen.getByRole('img', { name: 'Logo de prueba' }).getAttribute('src')).toBe(
      'http://cms.test/uploads/logo-cl.png',
    );

    await harness.navigateByUrl('/co');
    await settle();
    await screen.findByRole('heading', { level: 1, name: 'Tus datos y tu vehículo' });
    expect(root.style.getPropertyValue('--primary')).toBe('#2D6DF6');
    expect(screen.getByText(FALLBACK_COPY.logoPlaceholder)).toBeTruthy();
  });

  it('AC-003 a malformed theme uses the default theme and the wizard still works', async () => {
    reader.wizards.set('cl', {
      country: envelope([rawChile({ theme: { primaryColor: 'rojo', accentColor: '#000000' } })]),
      steps: envelope(rawChileSteps()),
    });
    const root = TestBed.inject(DOCUMENT).documentElement;
    root.style.setProperty('--primary', '#999999');

    await open('/cl');

    expect(await screen.findByRole('heading', { level: 1, name: 'Tus datos' })).toBeTruthy();
    expect(root.style.getPropertyValue('--primary')).toBe('');
    expect(screen.getByText(FALLBACK_COPY.logoPlaceholder)).toBeTruthy();
  });

  it.each(['/xx', '/CO', '/xx/tus-datos'])(
    'AC-002 %s shows that the country is not available with a link to the root',
    async (url) => {
      await open(url);

      const alert = await screen.findByRole('alert');
      expect(alert.textContent).toContain(FALLBACK_COPY.countryNotAvailable);
      expect(
        screen.getByRole('link', { name: FALLBACK_COPY.chooseCountry }).getAttribute('href'),
      ).toBe('/');
      expect(screen.queryByRole('heading')).toBeNull();
      expect(screen.queryByRole('textbox')).toBeNull();
    },
  );

  it('AC-015 shows only the loader with its announced label while the content loads', async () => {
    reader.hold = true;
    harness = await RouterTestingHarness.create();
    void harness.navigateByUrl('/cl');

    expect(await screen.findByTestId('loader')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(FALLBACK_COPY.loading));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(TestBed.inject(Title).getTitle()).toBe(FALLBACK_COPY.pageTitle);
    reader.hold = false;
  });

  it('AC-016 shows the unavailable message; retry loads the form and keeps stored data', async () => {
    storage.setItem(
      'wizard:cl',
      JSON.stringify({ steps: { 'tus-datos': { values: { rut: '1234567-8' }, complete: false } } }),
    );
    reader.fail = true;
    await open('/cl');

    expect((await screen.findByRole('alert')).textContent).toContain(FALLBACK_COPY.unavailable);
    expect(screen.queryByRole('textbox')).toBeNull();
    reader.fail = false;
    screen.getByRole('button', { name: FALLBACK_COPY.retry }).click();

    const rut = (await screen.findByRole('textbox', { name: /RUT/ })) as HTMLInputElement;
    expect(rut.value).toBe('1234567-8');
  });

  it('AC-017 invalid content shows the not available message and no part of the wizard', async () => {
    reader.wizards.set('cl', {
      country: envelope([rawChile()]),
      steps: envelope(rawChileSteps().filter((step) => step['type'] !== 'summary')),
    });
    await open('/cl');

    expect((await screen.findByRole('alert')).textContent).toContain(FALLBACK_COPY.notAvailableNow);
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('AC-019 continue stores the values, shows the next step at its address and focuses its heading', async () => {
    await open('/cl');
    await fillChileFirstStep();

    screen.getByRole('button', { name: 'Siguiente' }).click();
    await settle();

    const heading = await screen.findByRole('heading', { level: 1, name: 'Tu vehículo' });
    expect(router().url).toBe('/cl/tu-vehiculo');
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(
      screen.getByRole('navigation').querySelector('[aria-current="step"]')?.textContent,
    ).toContain('Tu vehículo');
    expect(JSON.parse(storage.getItem('wizard:cl') ?? '{}').steps['tus-datos'].complete).toBe(true);
  });

  it('AC-020 the back action shows the previous step with its values and no error', async () => {
    await open('/cl');
    expect(screen.queryByRole('link', { name: 'Atrás' })).toBeNull();
    await fillChileFirstStep();
    screen.getByRole('button', { name: 'Siguiente' }).click();
    await settle();

    (await screen.findByRole('link', { name: 'Atrás' })).click();
    await settle();

    expect(await screen.findByRole('heading', { level: 1, name: 'Tus datos' })).toBeTruthy();
    expect(router().url).toBe('/cl/tus-datos');
    expect((screen.getByRole('textbox', { name: /RUT/ }) as HTMLInputElement).value).toBe(
      '1234567-8',
    );
    expect(document.querySelectorAll('[aria-invalid="true"]')).toHaveLength(0);
  });

  it('AC-024 a later step address without the earlier step complete leads to the first step', async () => {
    await open('/cl/tu-vehiculo');

    expect(await screen.findByRole('heading', { level: 1, name: 'Tus datos' })).toBeTruthy();
    await waitFor(() => expect(router().url).toBe('/cl/tus-datos'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('AC-024 an unknown step address leads to the first step that is not complete', async () => {
    storage.setItem(
      'wizard:cl',
      JSON.stringify({
        steps: {
          'tus-datos': {
            values: { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01' },
            complete: true,
          },
        },
      }),
    );
    await open('/cl/no-existe');

    expect(await screen.findByRole('heading', { level: 1, name: 'Tu vehículo' })).toBeTruthy();
    await waitFor(() => expect(router().url).toBe('/cl/tu-vehiculo'));
  });

  it('AC-022 opening the address of a reachable step shows that step with the completed data', async () => {
    storage.setItem(
      'wizard:cl',
      JSON.stringify({
        steps: {
          'tus-datos': {
            values: { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01' },
            complete: true,
          },
        },
      }),
    );
    await open('/cl/tu-vehiculo');

    expect(await screen.findByRole('heading', { level: 1, name: 'Tu vehículo' })).toBeTruthy();
    expect(router().url).toBe('/cl/tu-vehiculo');
  });

  it('AC-034 leaving for the root with unconfirmed values asks; stay keeps the step and values', async () => {
    await open('/cl');
    fireEvent.input(await screen.findByRole('textbox', { name: /RUT/ }), {
      target: { value: '123' },
    });
    await settle();

    const navigation = router().navigateByUrl('/');
    const stay = await screen.findByRole('button', { name: 'Seguir cotizando' });
    stay.click();

    await expect(navigation).resolves.toBe(false);
    expect(router().url).toBe('/cl/tus-datos');
    expect((screen.getByRole('textbox', { name: /RUT/ }) as HTMLInputElement).value).toBe('123');
  });

  it('AC-034 leaving for another country with unconfirmed values asks; leave proceeds and discards them', async () => {
    await open('/cl');
    fireEvent.input(await screen.findByRole('textbox', { name: /RUT/ }), {
      target: { value: '123' },
    });
    await settle();

    const navigation = router().navigateByUrl('/co');
    (await screen.findByRole('button', { name: 'Abandonar' })).click();

    await expect(navigation).resolves.toBe(true);
    await settle();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tus datos y tu vehículo' }),
    ).toBeTruthy();
    expect(storage.getItem('wizard:cl')).toBe(JSON.stringify({ steps: {} }));
  });

  it('AC-034 leaving through the dialog keeps the data of the completed steps', async () => {
    await open('/cl');
    await fillChileFirstStep();
    screen.getByRole('button', { name: 'Siguiente' }).click();
    await settle();
    fireEvent.input(await screen.findByRole('textbox', { name: /Año/ }), {
      target: { value: '2020' },
    });
    await settle();

    const navigation = router().navigateByUrl('/');
    (await screen.findByRole('button', { name: 'Abandonar' })).click();
    await expect(navigation).resolves.toBe(true);
    await settle();

    const stored = JSON.parse(storage.getItem('wizard:cl') ?? '{}');
    expect(stored.steps['tus-datos']).toEqual({
      values: { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01' },
      complete: true,
    });
    expect(stored.steps['tu-vehiculo']).toBeUndefined();

    await router().navigateByUrl('/cl/tu-vehiculo');
    await settle();
    expect(await screen.findByRole('heading', { level: 1, name: 'Tu vehículo' })).toBeTruthy();
    expect(((await screen.findByRole('textbox', { name: /Año/ })) as HTMLInputElement).value).toBe(
      '',
    );
  });

  it('AC-034 without unconfirmed values leaving the wizard does not ask', async () => {
    await open('/cl');
    await screen.findByRole('textbox', { name: /RUT/ });

    await expect(router().navigateByUrl('/')).resolves.toBe(true);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('AC-035 going back to another step of the same wizard does not ask and discards typed values', async () => {
    await open('/cl');
    await fillChileFirstStep();
    screen.getByRole('button', { name: 'Siguiente' }).click();
    await settle();
    fireEvent.input(await screen.findByRole('textbox', { name: /Año/ }), {
      target: { value: '2020' },
    });
    await settle();

    await expect(router().navigateByUrl('/cl/tus-datos')).resolves.toBe(true);
    await settle();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await router().navigateByUrl('/cl/tu-vehiculo');
    await settle();

    expect(((await screen.findByRole('textbox', { name: /Año/ })) as HTMLInputElement).value).toBe(
      '',
    );
  });

  const chileFormsDone = {
    'tus-datos': {
      values: { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01' },
      complete: true,
    },
    'tu-vehiculo': { values: { marca: 'toyota', anio: '2020' }, complete: true },
  };

  it('AC-059 an invalid plan shows the not available message and no part of the wizard', async () => {
    reader.wizards.set('cl', {
      country: envelope([rawChile()]),
      steps: envelope(rawChileSteps()),
      plans: envelope([...rawChilePlans(), rawPlan({ documentId: 'x', currency: 'COP' })]),
    });
    await open('/cl/elige-tu-plan');

    expect((await screen.findByRole('alert')).textContent).toContain(FALLBACK_COPY.notAvailableNow);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.queryByRole('article')).toBeNull();
  });

  it('AC-059 a plans failure shows the unavailable state; retry loads plans and keeps stored data', async () => {
    storage.setItem(
      'wizard:cl',
      JSON.stringify({ steps: chileFormsDone, plan: { id: 'cl-full', finalPrice: null } }),
    );
    reader.fail = true;
    await open('/cl/elige-tu-plan');

    expect((await screen.findByRole('alert')).textContent).toContain(FALLBACK_COPY.unavailable);
    expect(screen.queryByRole('article')).toBeNull();
    reader.fail = false;
    screen.getByRole('button', { name: FALLBACK_COPY.retry }).click();

    expect(await screen.findByRole('heading', { level: 1, name: 'Elige tu plan' })).toBeTruthy();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /Plan Full$/ }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(reader.requests).toEqual(['cl', 'cl']);
  });

  it('AC-056 the summary address with complete form steps and no final price leads to the plan step', async () => {
    storage.setItem('wizard:cl', JSON.stringify({ steps: chileFormsDone }));
    await open('/cl/resumen-y-pago');

    expect(await screen.findByRole('heading', { level: 1, name: 'Elige tu plan' })).toBeTruthy();
    await waitFor(() => expect(router().url).toBe('/cl/elige-tu-plan'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('AC-056 the plan address with an empty tab leads to the first step', async () => {
    await open('/cl/elige-tu-plan');

    expect(await screen.findByRole('heading', { level: 1, name: 'Tus datos' })).toBeTruthy();
    await waitFor(() => expect(router().url).toBe('/cl/tus-datos'));
  });

  it('AC-050 continue with a final price shows the summary step, focuses its heading and marks the plan step complete', async () => {
    storage.setItem('wizard:cl', JSON.stringify({ steps: chileFormsDone }));
    await open('/cl/elige-tu-plan');
    (await screen.findByRole('button', { name: /Plan Full$/ })).click();
    await render();
    quote.last().resolve(624000);
    await settle();

    screen.getByRole('button', { name: 'Siguiente' }).click();
    await settle();

    const heading = await screen.findByRole('heading', { level: 1, name: 'Resumen y pago' });
    expect(router().url).toBe('/cl/resumen-y-pago');
    await waitFor(() => expect(document.activeElement).toBe(heading));
    const progress = screen.getByRole('navigation', { name: 'Etapa 4 / 4' });
    expect(progress.querySelector('[aria-current="step"]')?.textContent).toContain(
      'Resumen y pago',
    );
    const planItem = [...progress.querySelectorAll('li')][2];
    expect(planItem?.querySelector('span')?.className).toContain('text-primary');
    expect(JSON.parse(storage.getItem('wizard:cl') ?? '{}').plan).toEqual({
      id: 'cl-full',
      finalPrice: 624000,
    });
    expect(screen.getByRole('link', { name: 'Atrás' })).toBeTruthy();
  });

  it('AC-057 leaving the plan step for the root never asks', async () => {
    storage.setItem('wizard:cl', JSON.stringify({ steps: chileFormsDone }));
    await open('/cl/elige-tu-plan');
    (await screen.findByRole('button', { name: /Plan Full$/ })).click();
    await render();

    await expect(router().navigateByUrl('/')).resolves.toBe(true);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
