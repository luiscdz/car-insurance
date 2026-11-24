import { DestroyRef, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import type { FieldValue, StoredStep, WizardCopy, WizardStep } from '@car-insurance/shared';
import { fireEvent, render, screen } from '@testing-library/angular';
import { chileContent, colombiaContent, TODAY } from '../../../../../testing/content-fixtures';
import { CLOCK } from '../../../../core/clock';
import { FALLBACK_COPY } from '../../../../core/content/fallback-copy';
import { STEP_CONTEXT, type StepContext } from '../../shell/step-context';
import { FormStep } from './form-step';

class FakeStepContext implements StepContext {
  readonly copy = signal<WizardCopy>(colombiaContent().country.copy);
  readonly previousStepLink = signal<readonly string[] | null>(null);
  readonly stored: Record<string, StoredStep> = {};
  readonly confirmed: { slug: string; values: Readonly<Record<string, FieldValue>> }[] = [];
  unconfirmed: (() => boolean) | null = null;

  storedStep(slug: string): StoredStep | undefined {
    return this.stored[slug];
  }
  confirm(slug: string, values: Readonly<Record<string, FieldValue>>): void {
    this.confirmed.push({ slug, values });
  }
  trackUnconfirmed(check: () => boolean, destroyRef: DestroyRef): void {
    this.unconfirmed = check;
    destroyRef.onDestroy(() => (this.unconfirmed = null));
  }
}

async function setup(step: WizardStep, context = new FakeStepContext()) {
  const result = await render(FormStep, {
    inputs: { step },
    providers: [
      provideRouter([]),
      { provide: STEP_CONTEXT, useValue: context },
      { provide: CLOCK, useValue: () => TODAY },
    ],
  });
  return { ...result, context };
}

const colombiaStep = () => colombiaContent().steps[0] as WizardStep;
const chileFirstStep = () => chileContent().steps[0] as WizardStep;
const chileSecondStep = () => chileContent().steps[1] as WizardStep;
const continueButton = () => screen.getByRole('button', { name: /Continuar|Siguiente/ });

describe('FormStep', () => {
  it('AC-004 shows exactly the fields of the step in configured order', async () => {
    await setup(colombiaStep());

    expect(screen.getAllByRole('combobox').length + screen.getAllByRole('textbox').length).toBe(2);
    const labels = [...document.querySelectorAll('label')].map((l) =>
      l.textContent?.replace('*', '').trim(),
    );
    expect(labels).toEqual(['Tipo de documento', 'Placa', 'El vehículo es de uso particular']);
  });

  it('AC-011 the continue action looks disabled, stays focusable and becomes enabled when valid', async () => {
    const { fixture } = await setup(chileFirstStep());
    const button = continueButton();

    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(false);
    button.focus();
    expect(document.activeElement).toBe(button);

    fireEvent.input(screen.getByRole('textbox', { name: /RUT/ }), {
      target: { value: '1234567-8' },
    });
    fireEvent.input(screen.getByLabelText(/Fecha de nacimiento/), {
      target: { value: '1990-01-01' },
    });
    await fixture.whenStable();

    expect(button.getAttribute('aria-disabled')).toBe('false');
  });

  it('AC-011 activating continue with invalid fields stays, shows every error and focuses the first invalid field', async () => {
    const { fixture, context } = await setup(colombiaStep());

    fireEvent.click(continueButton());
    await fixture.whenStable();

    expect(context.confirmed).toEqual([]);
    expect(screen.getByText('Selecciona un tipo de documento.')).toBeTruthy();
    expect(screen.getByText('Ingresa una placa válida.')).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole('combobox', { name: /Tipo de documento/ }),
    );
    expect(document.activeElement?.getAttribute('aria-describedby')).toContain(
      'field-tipo-documento-error',
    );
  });

  it('AC-011 AC-027 the first invalid field receives focus with its error already associated', async () => {
    const { fixture } = await setup(chileFirstStep());
    const atFocus: { id: string; invalid: string | null; describedBy: string | null }[] = [];
    const record = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      atFocus.push({
        id: target.id,
        invalid: target.getAttribute('aria-invalid'),
        describedBy: target.getAttribute('aria-describedby'),
      });
    };
    document.addEventListener('focusin', record);

    fireEvent.click(continueButton());
    await fixture.whenStable();
    document.removeEventListener('focusin', record);

    expect(atFocus).toEqual([{ id: 'field-rut', invalid: 'true', describedBy: 'field-rut-error' }]);
    expect(document.getElementById('field-rut-error')?.textContent).toContain(
      'Ingresa un RUT válido.',
    );
  });

  it('AC-011 focus moves to the first invalid field in display order', async () => {
    const { fixture } = await setup(colombiaStep());
    const select = screen.getByRole('combobox', { name: /Tipo de documento/ });
    fireEvent.input(select, { target: { value: 'cc' } });
    await fixture.whenStable();

    fireEvent.click(continueButton());
    await fixture.whenStable();

    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /Placa/ }));
  });

  it('AC-019 continue with every field valid stores the values of the step', async () => {
    const { fixture, context } = await setup(chileFirstStep());
    fireEvent.input(screen.getByRole('textbox', { name: /RUT/ }), {
      target: { value: ' 1234567-k ' },
    });
    fireEvent.input(screen.getByLabelText(/Fecha de nacimiento/), {
      target: { value: '2008-11-23' },
    });
    await fixture.whenStable();

    fireEvent.click(continueButton());

    expect(context.confirmed).toEqual([
      { slug: 'tus-datos', values: { rut: '1234567-k', 'fecha-nacimiento': '2008-11-23' } },
    ]);
  });

  it('AC-021 activating continue twice in quick succession advances once', async () => {
    const { fixture, context } = await setup(colombiaStep());
    fireEvent.input(screen.getByRole('combobox', { name: /Tipo de documento/ }), {
      target: { value: 'cc' },
    });
    fireEvent.input(screen.getByRole('textbox', { name: /Placa/ }), {
      target: { value: 'ABC123' },
    });
    await fixture.whenStable();

    fireEvent.click(continueButton());
    fireEvent.click(continueButton());
    fireEvent.submit(continueButton().closest('form') as HTMLFormElement);

    expect(context.confirmed).toHaveLength(1);
    expect(context.confirmed[0]?.values).toEqual({
      'tipo-documento': 'cc',
      placa: 'ABC123',
      'uso-particular': false,
    });
  });

  it('AC-008 the continue and back labels come from the country copy', async () => {
    const context = new FakeStepContext();
    context.copy.set(chileContent().country.copy);
    context.previousStepLink.set(['/', 'cl', 'tus-datos']);
    await setup(chileSecondStep(), context);

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Atrás' }).getAttribute('href')).toBe('/cl/tus-datos');
  });

  it('AC-020 the first step offers no back action and stored values come back without errors', async () => {
    const context = new FakeStepContext();
    context.stored['tus-datos'] = {
      values: { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01' },
      complete: true,
    };
    await setup(chileFirstStep(), context);

    expect(screen.queryByRole('link')).toBeNull();
    expect((screen.getByRole('textbox', { name: /RUT/ }) as HTMLInputElement).value).toBe(
      '1234567-8',
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(document.querySelectorAll('[aria-invalid="true"]')).toHaveLength(0);
  });

  it('AC-018 a form step without fields shows the not available message and cannot advance', async () => {
    const context = new FakeStepContext();
    context.previousStepLink.set(['/', 'cl', 'tus-datos']);
    await setup({ ...chileSecondStep(), fields: [] }, context);

    expect(screen.getByRole('alert').textContent).toContain(FALLBACK_COPY.notAvailableNow);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('link', { name: 'Volver' })).toBeTruthy();
  });

  it('AC-033 the browser asks before unloading only while there are unconfirmed values', async () => {
    const { fixture } = await setup(colombiaStep());
    const unload = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };

    expect(unload()).toBe(false);
    fireEvent.input(screen.getByRole('textbox', { name: /Placa/ }), { target: { value: 'ABC' } });
    await fixture.whenStable();
    expect(unload()).toBe(true);

    fireEvent.input(screen.getByRole('textbox', { name: /Placa/ }), { target: { value: '  ' } });
    await fixture.whenStable();
    expect(unload()).toBe(false);
  });

  it('AC-033 AC-034 values equal to the stored ones are not unconfirmed', async () => {
    const context = new FakeStepContext();
    context.stored['tus-datos'] = {
      values: { rut: '1234567-8', 'fecha-nacimiento': '1990-01-01' },
      complete: true,
    };
    const { fixture } = await setup(chileFirstStep(), context);
    const rut = screen.getByRole('textbox', { name: /RUT/ });

    expect(context.unconfirmed?.()).toBe(false);
    fireEvent.input(rut, { target: { value: '7654321-0' } });
    await fixture.whenStable();
    expect(context.unconfirmed?.()).toBe(true);
    fireEvent.input(rut, { target: { value: '1234567-8' } });
    await fixture.whenStable();
    expect(context.unconfirmed?.()).toBe(false);
  });
});
