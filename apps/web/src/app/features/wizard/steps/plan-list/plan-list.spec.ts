import { provideRouter } from '@angular/router';
import type { WizardContent, WizardStep } from '@car-insurance/shared';
import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/angular';
import {
  chileContent,
  colombiaContent,
  FakePriceQuote,
  MemoryStorage,
  TODAY,
} from '../../../../../testing/content-fixtures';
import { FakeStepContext } from '../../../../../testing/fake-step-context';
import { CLOCK } from '../../../../core/clock';
import { PRICE_QUOTE } from '../../../../core/quote/price-quote';
import { WIZARD_STORAGE, WizardStateStore } from '../../../../core/wizard-state/wizard-state';
import { STEP_CONTEXT, STEP_HEADING_ID } from '../../shell/step-context';
import { PlanList } from './plan-list';

const planStep = (content: WizardContent) =>
  content.steps.find((step) => step.type === 'plans') as WizardStep;

const intl = (amount: number, currency: string, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    amount,
  );

const chileValues = {
  'tus-datos': { rut: '1234567-8', 'fecha-nacimiento': '1956-11-24' },
  'tu-vehiculo': { marca: 'toyota', anio: '2011' },
};

interface Setup {
  readonly content: WizardContent;
  readonly before?: (store: WizardStateStore) => void;
}

async function setup({ content, before }: Setup) {
  const quote = new FakePriceQuote();
  const context = new FakeStepContext().withContent(content);
  context.previousStepLink.set(['/', content.country.code, content.steps[0]?.slug ?? '']);
  const heading = document.createElement('h1');
  heading.id = STEP_HEADING_ID;
  heading.textContent = planStep(content).title;
  document.body.append(heading);
  const result = await render(PlanList, {
    inputs: { step: planStep(content) },
    providers: [
      provideRouter([]),
      { provide: WIZARD_STORAGE, useValue: new MemoryStorage() },
      { provide: STEP_CONTEXT, useValue: context },
      { provide: PRICE_QUOTE, useValue: quote },
      { provide: CLOCK, useValue: () => TODAY },
    ],
    configureTestBed: (testBed) => {
      const store = testBed.inject(WizardStateStore);
      store.load(content.country.code, content, TODAY);
      before?.(store);
    },
  });
  const store = TestBed.inject(WizardStateStore);
  // A pending price request keeps the application unstable, so tests render explicitly.
  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    result.fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
  };

  return { ...result, quote, context, store, settle, code: content.country.code };
}

const card = (name: string) => screen.getByRole('article', { name });
const chooseButton = (name: RegExp | string) => screen.getByRole('button', { name });
const continueButton = (label = 'Continuar') => screen.getByRole('button', { name: label });

afterEach(() => document.getElementById(STEP_HEADING_ID)?.remove());

describe('PlanList', () => {
  it('AC-036 AC-040 shows the plans of Colombia in order with the copy of Colombia', async () => {
    await setup({ content: colombiaContent() });

    expect(
      screen.getAllByRole('article').map((article) => article.getAttribute('aria-labelledby')),
    ).toHaveLength(3);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim())).toEqual([
      'Plan Básico',
      'Plan Clásico',
      'Plan Global',
    ]);
    expect(screen.getAllByRole('button', { name: /^Elegir este plan:/ })).toHaveLength(3);
    expect(screen.getByText('Recomendado')).toBeTruthy();
  });

  it('AC-036 AC-040 shows the plans of Chile in order with the copy of Chile', async () => {
    await setup({ content: chileContent() });

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim())).toEqual([
      'Plan Esencial',
      'Plan Full',
      'Plan Premium',
    ]);
    expect(screen.getAllByRole('button', { name: /^Quiero este plan:/ })).toHaveLength(3);
    expect(screen.getByText('El más elegido')).toBeTruthy();
    expect(screen.getAllByText('Desde')).toHaveLength(3);
  });

  it('AC-038 no plan is chosen in advance and continue looks disabled', async () => {
    const { quote } = await setup({ content: colombiaContent() });

    expect(screen.queryAllByRole('button', { pressed: true })).toEqual([]);
    expect(continueButton().getAttribute('aria-disabled')).toBe('true');
    expect(quote.requests).toEqual([]);
  });

  it('AC-060 the plans are one group named by the step heading', async () => {
    await setup({ content: chileContent() });

    expect(screen.getByRole('group', { name: 'Elige tu plan' })).toBeTruthy();
  });

  it('AC-045 AC-048 choosing a plan stores it at once and shows the wait as a status, then the final price', async () => {
    const { quote, store, settle } = await setup({
      content: chileContent(),
      before: (store) => {
        store.confirmStep('cl', 'tus-datos', chileValues['tus-datos']);
        store.confirmStep('cl', 'tu-vehiculo', chileValues['tu-vehiculo']);
      },
    });

    chooseButton('Quiero este plan: Plan Esencial').click();
    await settle();

    expect(store.data('cl').plan).toEqual({ id: 'cl-esencial', finalPrice: null });
    expect(quote.last().request).toEqual({
      country: 'cl',
      plan: 'cl-esencial',
      policyholderAge: 69,
      vehicleAge: 15,
    });
    const esencial = card('Plan Esencial');
    expect(within(esencial).getByRole('status').textContent).toContain('Estamos calculando…');
    expect(chooseButton('Tu elección: Plan Esencial').getAttribute('aria-pressed')).toBe('true');
    for (const other of ['Plan Full', 'Plan Premium']) {
      expect(within(card(other)).getByRole('status').textContent?.trim()).toBe('');
    }

    quote.last().resolve(437500);
    await settle();

    expect(within(esencial).getByRole('status').textContent?.replace(/\s+/g, ' ').trim()).toBe(
      `Tu precio final ${intl(437500, 'CLP', 'es-CL')}`,
    );
    expect(store.data('cl').plan).toEqual({ id: 'cl-esencial', finalPrice: 437500 });
    expect(continueButton('Siguiente').getAttribute('aria-disabled')).toBe('false');
  });

  it('AC-048 choosing another plan moves the mark and removes the previous final price (Colombia)', async () => {
    const { quote, store, settle } = await setup({ content: colombiaContent() });
    chooseButton(/Plan Básico$/).click();
    await settle();
    quote.last().resolve(1200000);
    await settle();

    chooseButton(/Plan Global$/).click();
    await settle();

    expect(screen.getAllByRole('button', { pressed: true })).toEqual([
      screen.getByRole('button', { name: 'Plan elegido: Plan Global' }),
    ]);
    expect(within(card('Plan Básico')).getByRole('status').textContent?.trim()).toBe('');
    expect(store.data('co').plan).toEqual({ id: 'co-global', finalPrice: null });
    expect(quote.requests).toHaveLength(2);
  });

  it('AC-049 only the price of the plan chosen last is shown, whatever order answers arrive in', async () => {
    const { quote, store, settle } = await setup({ content: colombiaContent() });
    chooseButton(/Plan Básico$/).click();
    await settle();
    chooseButton(/Plan Clásico$/).click();
    await settle();
    chooseButton(/Plan Global$/).click();
    await settle();
    const [basic, classic, global] = quote.requests;

    global?.resolve(2600000);
    await settle();
    basic?.resolve(1200000);
    classic?.reject(new Error('late'));
    await settle();

    expect(basic?.signal?.aborted).toBe(true);
    expect(classic?.signal?.aborted).toBe(true);
    expect(within(card('Plan Global')).getByRole('status').textContent).toContain(
      intl(2600000, 'COP', 'es-CO'),
    );
    expect(within(card('Plan Básico')).getByRole('status').textContent?.trim()).toBe('');
    expect(store.data('co').plan).toEqual({ id: 'co-global', finalPrice: 2600000 });
  });

  it('AC-049 a late answer for an earlier plan never replaces the wait of the latest choice', async () => {
    const { quote, store, settle } = await setup({ content: chileContent() });
    chooseButton(/Plan Esencial$/).click();
    await settle();
    chooseButton(/Plan Full$/).click();
    await settle();

    quote.requests[0]?.resolve(350000);
    await settle();

    expect(within(card('Plan Full')).getByRole('status').textContent).toContain(
      'Estamos calculando…',
    );
    expect(store.data('cl').plan).toEqual({ id: 'cl-full', finalPrice: null });
  });

  it('AC-049 choosing the plan already chosen sends no request and changes nothing', async () => {
    const { quote, settle, container } = await setup({ content: chileContent() });
    chooseButton(/Plan Full$/).click();
    await settle();
    quote.last().resolve(520000);
    await settle();
    const before = container.innerHTML;

    chooseButton(/Plan Full$/).click();
    await settle();

    expect(quote.requests).toHaveLength(1);
    expect(container.innerHTML).toBe(before);
  });

  it.each([
    ['an HTTP error', new Error('404')],
    ['a network failure', new TypeError('Failed to fetch')],
    ['an invalid answer', new Error('Invalid input')],
  ])(
    'AC-047 %s shows the price error with retry; the plan stays chosen and continue does not advance',
    async (_, error) => {
      const { quote, context, settle } = await setup({ content: chileContent() });
      chooseButton(/Plan Full$/).click();
      await settle();

      quote.last().reject(error);
      await settle();

      const status = within(card('Plan Full')).getByRole('status');
      expect(status.textContent).toContain('El precio no está disponible.');
      expect(status.textContent).not.toMatch(/404|fetch|Invalid/);
      expect(chooseButton(/Plan Full$/).getAttribute('aria-pressed')).toBe('true');
      expect(continueButton('Siguiente').getAttribute('aria-disabled')).toBe('true');

      continueButton('Siguiente').click();
      await settle();
      expect(context.advanced).toEqual([]);
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Volver a intentar' }),
      );

      screen.getByRole('button', { name: 'Volver a intentar' }).click();
      await settle();
      expect(quote.requests).toHaveLength(2);
      expect(status.textContent).toContain('Estamos calculando…');
      expect(document.activeElement).toBe(status);
      quote.last().resolve(520000);
      await settle();
      expect(status.textContent).toContain(intl(520000, 'CLP', 'es-CL'));
    },
  );

  it('AC-047 choosing another plan replaces the error with the request for the new plan', async () => {
    const { quote, settle } = await setup({ content: colombiaContent() });
    chooseButton(/Plan Básico$/).click();
    await settle();
    quote.last().reject(new Error('down'));
    await settle();

    chooseButton(/Plan Clásico$/).click();
    await settle();

    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
    expect(within(card('Plan Clásico')).getByRole('status').textContent).toContain('Calculando');
  });

  it('AC-050 continue with a chosen plan and its final price moves to the next step, keeping both', async () => {
    const content = colombiaContent();
    const { quote, context, store, settle } = await setup({ content });
    chooseButton(/Plan Clásico$/).click();
    await settle();
    quote.last().resolve(1850000);
    await settle();

    continueButton().click();

    expect(context.advanced).toEqual(['elige-tu-plan']);
    expect(store.data('co').plan).toEqual({ id: 'co-clasico', finalPrice: 1850000 });
  });

  it('AC-052 activating continue twice in quick succession advances once', async () => {
    const { quote, context, settle } = await setup({ content: chileContent() });
    chooseButton(/Plan Premium$/).click();
    await settle();
    quote.last().resolve(690000);
    await settle();

    continueButton('Siguiente').click();
    continueButton('Siguiente').click();
    fireEvent.keyDown(continueButton('Siguiente'), { key: 'Enter' });

    expect(context.advanced).toEqual(['elige-tu-plan']);
  });

  it('AC-051 continue without a choice shows the message with the plans, focuses the first plan and stays', async () => {
    const { context, settle } = await setup({ content: chileContent() });
    const button = continueButton('Siguiente');
    expect(button.hasAttribute('disabled')).toBe(false);

    button.click();
    await settle();

    const message = screen.getByRole('alert');
    expect(message.textContent).toContain('Selecciona un plan.');
    expect(screen.getByRole('group').getAttribute('aria-describedby')).toBe(message.id);
    expect(document.activeElement).toBe(chooseButton(/Plan Esencial$/));
    expect(context.advanced).toEqual([]);

    chooseButton(/Plan Full$/).click();
    await settle();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('group').hasAttribute('aria-describedby')).toBe(false);
  });

  it('AC-051 continue while the final price is obtained focuses the price status and stays', async () => {
    const { context, settle } = await setup({ content: colombiaContent() });
    chooseButton(/Plan Global$/).click();
    await settle();

    continueButton().click();
    await settle();

    expect(document.activeElement).toBe(within(card('Plan Global')).getByRole('status'));
    expect(context.advanced).toEqual([]);
  });

  it('AC-053 a stored choice is shown chosen and its final price is requested again on display', async () => {
    const { quote, store, settle } = await setup({
      content: chileContent(),
      before: (store) => {
        store.choosePlan('cl', 'cl-full');
        store.storeFinalPrice('cl', 'cl-full', 624000);
      },
    });
    await settle();

    expect(chooseButton(/Plan Full$/).getAttribute('aria-pressed')).toBe('true');
    expect(quote.requests.map((pending) => pending.request.plan)).toEqual(['cl-full']);
    expect(store.data('cl').plan).toEqual({ id: 'cl-full', finalPrice: null });
    expect(within(card('Plan Full')).getByRole('status').textContent).toContain(
      'Estamos calculando…',
    );
  });

  it('AC-054 the final price is requested with the ages derived from the current data', async () => {
    const { quote, settle } = await setup({
      content: chileContent(),
      before: (store) => {
        store.confirmStep('cl', 'tus-datos', { rut: '1', 'fecha-nacimiento': '2004-11-23' });
        store.choosePlan('cl', 'cl-esencial');
      },
    });
    await settle();

    expect(quote.last().request).toEqual({
      country: 'cl',
      plan: 'cl-esencial',
      policyholderAge: 22,
    });
  });

  it('AC-057 the plan step never reports unconfirmed values nor prevents leaving the page', async () => {
    const { context, settle } = await setup({ content: colombiaContent() });
    expect(context.unconfirmed?.()).toBe(false);

    chooseButton(/Plan Básico$/).click();
    await settle();
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);

    expect(context.unconfirmed?.()).toBe(false);
    expect(event.defaultPrevented).toBe(false);
  });

  it('AC-058 without plans shows the no-plans message, the back action and nothing else', async () => {
    await setup({ content: chileContent([]) });

    expect(screen.getByRole('alert').textContent).toContain('No hay planes para cotizar.');
    expect(screen.getByRole('link', { name: 'Atrás' })).toBeTruthy();
    expect(screen.queryAllByRole('button')).toEqual([]);
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('AC-060 each choice action names its plan and is described by the badge and the prices', async () => {
    await setup({ content: colombiaContent() });

    const classic = chooseButton('Elegir este plan: Plan Clásico');
    const described = (classic.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent?.replace(/\s+/g, ' ').trim());
    expect(described[0]).toBe('Recomendado');
    expect(described[1]).toContain('Precio base anual');
    await waitFor(() => expect(described).toHaveLength(3));
  });
});
