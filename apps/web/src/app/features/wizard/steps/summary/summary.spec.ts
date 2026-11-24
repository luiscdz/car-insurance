import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import type { WizardContent, WizardStep } from '@car-insurance/shared';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/angular';
import {
  chileContent,
  colombiaContent,
  FakePayment,
  MemoryStorage,
  TODAY,
} from '../../../../../testing/content-fixtures';
import { FakeStepContext } from '../../../../../testing/fake-step-context';
import { PAYMENT } from '../../../../core/payment/payment';
import { formatPrice } from '../../../../shared/utils/format-price';
import { WIZARD_STORAGE, WizardStateStore } from '../../../../core/wizard-state/wizard-state';
import { STEP_CONTEXT, STEP_HEADING_ID } from '../../shell/step-context';
import { Summary } from './summary';

const summaryStep = (content: WizardContent) =>
  content.steps.find((step) => step.type === 'summary') as WizardStep;

const intl = (amount: number, currency: string, locale: string) =>
  formatPrice(amount, currency, locale);

const COLOMBIA_VALUES = {
  'tipo-documento': 'cc',
  'numero-documento': '1234567890',
  placa: 'abc123',
  'uso-particular': true,
};

const CHILE_VALUES = {
  'tus-datos': { rut: '12345678-k', 'fecha-nacimiento': '1990-03-05' },
  'tu-vehiculo': { marca: 'toyota', anio: '2020' },
};

/** Stores complete data and a priced plan for the country, as the plan step leaves them. */
function quoted(store: WizardStateStore, content: WizardContent): void {
  if (content.country.code === 'co') {
    store.confirmStep('co', 'tus-datos-y-tu-vehiculo', COLOMBIA_VALUES);
    store.choosePlan('co', 'co-clasico');
    store.storeFinalPrice('co', 'co-clasico', 2312500);
  } else {
    store.confirmStep('cl', 'tus-datos', CHILE_VALUES['tus-datos']);
    store.confirmStep('cl', 'tu-vehiculo', CHILE_VALUES['tu-vehiculo']);
    store.choosePlan('cl', 'cl-full');
    store.storeFinalPrice('cl', 'cl-full', 624000);
  }
}

interface Setup {
  readonly content: WizardContent;
  readonly before?: (store: WizardStateStore) => void;
}

async function setup({ content, before }: Setup) {
  const payment = new FakePayment();
  const context = new FakeStepContext().withContent(content);
  const plansStep = content.steps.find((step) => step.type === 'plans') as WizardStep;
  context.previousStepLink.set(['/', content.country.code, plansStep.slug]);
  const heading = document.createElement('h1');
  heading.id = STEP_HEADING_ID;
  heading.tabIndex = -1;
  heading.textContent = summaryStep(content).title;
  document.body.append(heading);
  const result = await render(Summary, {
    inputs: { step: summaryStep(content) },
    providers: [
      provideRouter([]),
      { provide: WIZARD_STORAGE, useValue: new MemoryStorage() },
      { provide: STEP_CONTEXT, useValue: context },
      { provide: PAYMENT, useValue: payment },
    ],
    configureTestBed: (testBed) => {
      const store = testBed.inject(WizardStateStore);
      store.load(content.country.code, content, TODAY);
      quoted(store, content);
      before?.(store);
    },
  });
  const store = TestBed.inject(WizardStateStore);
  // A pending payment keeps the application unstable, so tests render explicitly.
  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    result.fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
  };
  return { ...result, payment, context, store, settle, heading, code: content.country.code };
}

const payButton = () => document.getElementById('pay') as HTMLButtonElement;
const checkbox = () => screen.getByRole('checkbox') as HTMLInputElement;

async function accept(settle: () => Promise<void>): Promise<void> {
  fireEvent.click(checkbox());
  await settle();
}

afterEach(() => {
  document.getElementById(STEP_HEADING_ID)?.remove();
  document.querySelectorAll('[aria-modal]').forEach((element) => element.remove());
});

describe('Summary', () => {
  it('AC-067 AC-070 AC-073 Colombia: one data section, the chosen plan and its stored final price with the copy of Colombia', async () => {
    await setup({ content: colombiaContent() });

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim())).toEqual([
      'Tus datos y tu vehículo',
      'Tu plan',
    ]);
    const plan = screen.getByRole('region', { name: 'Tu plan' });
    expect(within(plan).getByText('Plan Clásico')).toBeTruthy();
    expect(within(plan).getByText('Tu precio anual')).toBeTruthy();
    expect(plan.textContent).toContain(intl(2312500, 'COP', 'es-CO'));
    expect(document.body.textContent).not.toMatch(/Plan Básico|Plan Global|Coberturas/);
    expect(document.body.textContent).not.toContain(intl(1850000, 'COP', 'es-CO'));
    expect(screen.getByRole('button', { name: 'Pagar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ver términos y condiciones' })).toBeTruthy();
  });

  it('AC-067 AC-070 AC-073 Chile: two data sections in configured order with the copy of Chile', async () => {
    await setup({ content: chileContent() });

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent?.trim())).toEqual([
      'Tus datos',
      'Tu vehículo',
      'Plan elegido',
    ]);
    const vehicle = screen.getByRole('region', { name: 'Tu vehículo' });
    const terms = [...vehicle.querySelectorAll('dt')].map((dt) => dt.textContent?.trim());
    const values = [...vehicle.querySelectorAll('dd')].map((dd) => dd.textContent?.trim());
    expect(terms).toEqual(['Marca', 'Año del vehículo']);
    expect(values).toEqual(['Toyota', '2020']);
    expect(screen.getByText('Tu monto anual')).toBeTruthy();
    expect(screen.getByText(intl(624000, 'CLP', 'es-CL'))).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pagar ahora' })).toBeTruthy();
    expect(
      screen.getByRole('checkbox', { name: 'Acepto las condiciones del seguro' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Leer las condiciones' })).toBeTruthy();
  });

  it.each([
    ['Colombia', colombiaContent, '1234567890', '••••••7890'],
    ['Chile', chileContent, '12345678-k', '•••••678-k'],
  ])(
    'AC-069 AC-090 %s: the identity document number is masked and its complete value is nowhere in the step',
    async (_, content, full, masked) => {
      const { container } = await setup({ content: content() });

      expect(screen.getByText(masked).tagName).toBe('DD');
      expect(container.innerHTML).not.toContain(full);
      expect(document.body.innerHTML).not.toContain(full);
    },
  );

  it('AC-071 AC-090 each edit action leads to its form step and names its section', async () => {
    await setup({ content: chileContent() });

    const personal = screen.getByRole('link', { name: 'Modificar Tus datos' });
    const vehicle = screen.getByRole('link', { name: 'Modificar Tu vehículo' });
    expect(personal.textContent?.trim()).toBe('Modificar');
    expect(personal.getAttribute('href')).toBe('/cl/tus-datos');
    expect(vehicle.getAttribute('href')).toBe('/cl/tu-vehiculo');
  });

  it('AC-072 the change plan and back actions lead to the plan step', async () => {
    await setup({ content: colombiaContent() });

    expect(screen.getByRole('link', { name: 'Cambiar plan' }).getAttribute('href')).toBe(
      '/co/elige-tu-plan',
    );
    expect(screen.getByRole('link', { name: 'Volver' }).getAttribute('href')).toBe(
      '/co/elige-tu-plan',
    );
  });

  it('AC-076 AC-090 pay without accepting sends nothing, asks to accept next to the checkbox and focuses it', async () => {
    const { payment, settle } = await setup({ content: colombiaContent() });

    expect(checkbox().checked).toBe(false);
    expect(payButton().getAttribute('aria-disabled')).toBe('true');
    expect(payButton().hasAttribute('disabled')).toBe(false);
    payButton().focus();
    expect(document.activeElement).toBe(payButton());

    fireEvent.click(payButton());
    await settle();

    expect(payment.requests).toEqual([]);
    const message = screen.getByRole('alert');
    expect(message.textContent?.trim()).toBe('Acepta los términos y condiciones para poder pagar.');
    expect(checkbox().getAttribute('aria-describedby')).toBe(message.id);
    expect(checkbox().getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(checkbox());
  });

  it('AC-076 checking enables pay and removes the message; unchecking disables pay again', async () => {
    const { settle } = await setup({ content: chileContent() });
    fireEvent.click(payButton());
    await settle();
    expect(screen.getByRole('alert').textContent).toContain('Debes aceptar las condiciones');

    await accept(settle);

    expect(screen.queryByRole('alert')).toBeNull();
    expect(checkbox().hasAttribute('aria-describedby')).toBe(false);
    expect(payButton().getAttribute('aria-disabled')).toBe('false');

    fireEvent.click(checkbox());
    await settle();
    expect(payButton().getAttribute('aria-disabled')).toBe('true');
  });

  it('AC-078 AC-079 AC-090 one request with only the country and plan; everything locks while it is processed', async () => {
    const { payment, context, settle } = await setup({ content: colombiaContent() });
    await accept(settle);

    fireEvent.click(payButton());
    fireEvent.click(payButton());
    fireEvent.keyDown(payButton(), { key: 'Enter' });
    fireEvent.click(payButton());
    await settle();

    expect(payment.requests).toHaveLength(1);
    expect(payment.last().request).toEqual({ country: 'co', plan: 'co-clasico' });
    expect(payButton().getAttribute('aria-busy')).toBe('true');
    expect(payButton().getAttribute('aria-disabled')).toBe('true');
    expect(payButton().textContent?.trim()).toBe('Procesando tu pago…');
    expect(screen.getByRole('status').textContent?.trim()).toBe('Procesando tu pago…');
    expect(checkbox().disabled).toBe(true);
    const viewTerms = screen.getByRole('button', { name: 'Ver términos y condiciones' });
    expect(viewTerms.getAttribute('aria-disabled')).toBe('true');
    for (const name of ['Editar Tus datos y tu vehículo', 'Cambiar plan', 'Volver']) {
      const link = screen.getByRole('link', { name });
      expect(link.hasAttribute('href')).toBe(false);
      expect(link.getAttribute('aria-disabled')).toBe('true');
    }
    expect(context.processing?.()).toEqual({
      title: '¿Quieres salir mientras procesamos tu pago?',
      message: 'Si sales ahora, tu pago no quedará registrado.',
      stayLabel: 'Esperar el pago',
      leaveLabel: 'Salir',
    });

    fireEvent.click(viewTerms);
    await settle();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it.each([
    ['a rejection', (payment: FakePayment) => payment.last().resolve({ kind: 'rejected' })],
    ['a failure', (payment: FakePayment) => payment.last().reject(new Error('network'))],
  ])(
    'AC-081 AC-090 %s shows the payment error next to pay, keeps everything and lets the person pay again',
    async (_, fail) => {
      const { payment, store, settle } = await setup({ content: chileContent() });
      await accept(settle);
      payButton().focus();
      fireEvent.click(payButton());
      await settle();

      fail(payment);
      await settle();

      const error = screen.getByRole('alert');
      expect(error.textContent?.trim()).toBe('No fue posible procesar tu pago.');
      expect(payButton().getAttribute('aria-describedby')).toBe(error.id);
      expect(payButton().getAttribute('aria-disabled')).toBe('false');
      expect(payButton().hasAttribute('aria-busy')).toBe(false);
      expect(document.activeElement).toBe(payButton());
      expect(checkbox().checked).toBe(true);
      expect(checkbox().disabled).toBe(false);
      expect(store.data('cl').plan).toEqual({ id: 'cl-full', finalPrice: 624000 });
      expect(store.data('cl').confirmation).toBeUndefined();

      fireEvent.click(payButton());
      await settle();

      expect(screen.queryByRole('alert')).toBeNull();
      expect(payment.requests).toHaveLength(2);
      payment.last().resolve({ kind: 'approved', quoteNumber: 'CL-20261123-A9F03Z' });
      await settle();
      expect(screen.getByText('CL-20261123-A9F03Z')).toBeTruthy();
    },
  );

  it.each([
    [
      'Colombia',
      colombiaContent,
      'CO-20261123-7KQ2MX',
      'Plan Clásico',
      intl(2312500, 'COP', 'es-CO'),
    ],
    ['Chile', chileContent, 'CL-20261123-A9F03Z', 'Plan Full', intl(624000, 'CLP', 'es-CL')],
  ])(
    'AC-083 AC-085 AC-090 %s: an approval stores and shows the confirmation in place of the summary',
    async (_, content, quoteNumber, planName, amount) => {
      const { payment, context, store, settle, heading, code, container } = await setup({
        content: content(),
      });
      const copy = content().country.summaryCopy;
      await accept(settle);
      fireEvent.click(payButton());
      await settle();

      payment.last().resolve({ kind: 'approved', quoteNumber });
      await settle();

      expect(store.data(code).confirmation).toEqual({
        planId: payment.last().request.plan,
        planName,
        amount: store.data(code).plan?.finalPrice,
        quoteNumber,
      });
      expect(context.heading()).toBe(copy.confirmationTitle);
      await waitFor(() => expect(document.activeElement).toBe(heading));
      expect(screen.getByRole('status').textContent?.trim()).toBe(
        `${copy.confirmationTitle}. ${copy.confirmationMessage}`,
      );
      expect(screen.getByText(copy.confirmationMessage)).toBeTruthy();
      const pairs = [...container.querySelectorAll('dt')].map((dt) => [
        dt.textContent?.trim(),
        dt.nextElementSibling?.textContent?.trim(),
      ]);
      expect(pairs).toEqual([
        [copy.quoteNumberLabel, quoteNumber],
        [copy.planLabel, planName],
        [copy.amountPaidLabel, amount],
      ]);
      expect(screen.queryByRole('checkbox')).toBeNull();
      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.queryByRole('button', { name: copy.payLabel })).toBeNull();
      expect(screen.queryByRole('button', { name: copy.viewTermsLabel })).toBeNull();
      expect(screen.getByRole('button', { name: copy.newQuoteLabel })).toBeTruthy();
      expect(container.textContent).not.toMatch(/1234567890|7890|678-k|abc123|Toyota|2020/);
      expect(context.processing?.()).toBeNull();
    },
  );

  it('AC-085 a stored confirmation shows the confirmation, never the summary with pay', async () => {
    const { payment } = await setup({
      content: colombiaContent(),
      before: (store) =>
        store.storeConfirmation('co', {
          planId: 'co-clasico',
          planName: 'Plan Clásico',
          amount: 2312500,
          quoteNumber: 'CO-20261123-7KQ2MX',
        }),
    });

    expect(screen.getByText('CO-20261123-7KQ2MX')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Pagar' })).toBeNull();
    expect(payment.requests).toEqual([]);
  });

  it('AC-087 new quote discards the country data and opens the first step without asking', async () => {
    const { payment, store, settle } = await setup({ content: chileContent() });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    await accept(settle);
    fireEvent.click(payButton());
    await settle();
    payment.last().resolve({ kind: 'approved', quoteNumber: 'CL-20261123-A9F03Z' });
    await settle();

    fireEvent.click(screen.getByRole('button', { name: 'Cotizar de nuevo' }));

    expect(store.data('cl')).toEqual({ steps: {} });
    expect(navigate).toHaveBeenCalledWith(['/', 'cl', 'tus-datos']);
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('AC-089 nothing to lose when no payment is processed: no dialog, no browser confirmation', async () => {
    const { context, payment, settle } = await setup({ content: colombiaContent() });
    await accept(settle);

    expect(context.unconfirmed?.()).toBe(false);
    expect(context.processing?.()).toBeNull();
    const idle = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(idle);
    expect(idle.defaultPrevented).toBe(false);

    fireEvent.click(payButton());
    await settle();
    payment.last().resolve({ kind: 'rejected' });
    await settle();
    const afterError = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(afterError);
    expect(afterError.defaultPrevented).toBe(false);
    expect(context.processing?.()).toBeNull();
  });

  it('AC-096 the browser confirmation is requested only while a payment is processed', async () => {
    const { settle } = await setup({ content: chileContent() });
    await accept(settle);
    fireEvent.click(payButton());
    await settle();

    const processing = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(processing);

    expect(processing.defaultPrevented).toBe(true);
  });

  it('AC-096 an answer after leaving the step is ignored and nothing is stored', async () => {
    const { payment, store, settle, fixture } = await setup({ content: colombiaContent() });
    await accept(settle);
    fireEvent.click(payButton());
    await settle();
    const pending = payment.last();

    fixture.destroy();
    expect(pending.signal?.aborted).toBe(true);
    pending.resolve({ kind: 'approved', quoteNumber: 'CO-20261123-7KQ2MX' });
    await new Promise((resolve) => setTimeout(resolve));

    expect(store.data('co').confirmation).toBeUndefined();
  });

  it('AC-096 an answer while a dialog is open is applied at once without moving focus', async () => {
    const { payment, store, settle, heading } = await setup({ content: chileContent() });
    await accept(settle);
    fireEvent.click(payButton());
    await settle();
    const dialog = document.createElement('div');
    dialog.setAttribute('aria-modal', 'true');
    const stay = document.createElement('button');
    dialog.append(stay);
    document.body.append(dialog);
    stay.focus();

    payment.last().resolve({ kind: 'approved', quoteNumber: 'CL-20261123-A9F03Z' });
    await settle();

    expect(store.data('cl').confirmation?.quoteNumber).toBe('CL-20261123-A9F03Z');
    expect(document.activeElement).toBe(stay);
    expect(document.activeElement).not.toBe(heading);
  });

  it('AC-083 AC-096 an approval during a dialog, then stay: focus moves to the confirmation title', async () => {
    const { payment, store, settle, heading } = await setup({ content: colombiaContent() });
    await accept(settle);
    payButton().focus();
    fireEvent.click(payButton());
    await settle();
    const dialog = document.createElement('div');
    dialog.setAttribute('aria-modal', 'true');
    const stay = document.createElement('button');
    dialog.append(stay);
    document.body.append(dialog);
    stay.focus();

    payment.last().resolve({ kind: 'approved', quoteNumber: 'CO-20261123-7KQ2MX' });
    await settle();
    expect(store.data('co').confirmation).toBeDefined();
    expect(document.activeElement).toBe(stay);

    dialog.remove();
    expect(document.activeElement).toBe(document.body);

    await waitFor(() => expect(document.activeElement).toBe(heading));
  });

  it('AC-074 AC-075 AC-090 view terms opens the modal dialog of the country, focused on its title; Escape returns focus', async () => {
    const { settle } = await setup({ content: colombiaContent() });
    await accept(settle);
    const viewTerms = screen.getByRole('button', { name: 'Ver términos y condiciones' });
    viewTerms.focus();

    fireEvent.click(viewTerms);

    const dialog = await screen.findByRole('dialog', { name: 'Términos y condiciones' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    await waitFor(() =>
      expect(document.activeElement?.textContent?.trim()).toBe('Términos y condiciones'),
    );
    expect([...dialog.querySelectorAll('p')].map((p) => p.textContent?.trim())).toEqual([
      'Términos ficticios de Colombia.',
      'Línea de atención: 601 000 0000\nHorario: lunes a viernes.',
      'El texto <b>no</b> interpreta **marcas**.',
    ]);
    expect(dialog.querySelector('b')).toBeNull();

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(viewTerms));
    expect(checkbox().checked).toBe(true);
  });

  it('AC-074 AC-075 Chile: the close action closes the dialog of Chile and returns focus', async () => {
    await setup({ content: chileContent() });
    const viewTerms = screen.getByRole('button', { name: 'Leer las condiciones' });
    viewTerms.focus();

    fireEvent.click(viewTerms);
    const dialog = await screen.findByRole('dialog', { name: 'Condiciones del seguro' });
    expect(dialog.textContent).toContain('Condiciones ficticias de Chile.');
    expect(dialog.textContent).not.toContain('Colombia');

    within(dialog).getByRole('button', { name: 'Volver al resumen' }).click();

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(viewTerms));
    expect(checkbox().checked).toBe(false);
  });
});
