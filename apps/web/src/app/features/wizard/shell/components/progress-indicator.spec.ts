import { render, screen } from '@testing-library/angular';
import { ProgressIndicator } from './progress-indicator';

const chileSteps = [
  { key: 'tus-datos', title: 'Tus datos', complete: true },
  { key: 'tu-vehiculo', title: 'Tu vehículo', complete: false },
  { key: 'elige-tu-plan', title: 'Elige tu plan', complete: false },
  { key: 'resumen-y-pago', title: 'Resumen y pago', complete: false },
];

describe('ProgressIndicator', () => {
  it('AC-019 lists every step in order and marks the current one', async () => {
    await render(ProgressIndicator, {
      inputs: { steps: chileSteps, current: 1, labelTemplate: 'Paso {current} de {total}' },
    });

    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '1 Tus datos',
      '2 Tu vehículo',
      '3 Elige tu plan',
      '4 Resumen y pago',
    ]);
    expect(items.map((item) => item.getAttribute('aria-current'))).toEqual([
      null,
      'step',
      null,
      null,
    ]);
    expect(screen.getByRole('navigation', { name: 'Paso 2 de 4' })).toBeTruthy();
  });

  it('AC-008 AC-019 uses the label template of the country from Strapi', async () => {
    await render(ProgressIndicator, {
      inputs: {
        steps: chileSteps.slice(0, 3),
        current: 0,
        labelTemplate: 'Etapa {current} / {total}',
      },
    });

    expect(screen.getByRole('navigation', { name: 'Etapa 1 / 3' })).toBeTruthy();
  });

  it('AC-083 marks every step complete when all are, keeping the current step', async () => {
    await render(ProgressIndicator, {
      inputs: {
        steps: chileSteps.map((step) => ({ ...step, complete: true })),
        current: 3,
        labelTemplate: 'Paso {current} de {total}',
      },
    });

    const items = screen.getAllByRole('listitem');
    const numbers = items.map((item) => item.querySelector('span')?.classList);
    expect(numbers.every((c) => c?.contains('bg-background') && c.contains('text-primary'))).toBe(
      true,
    );
    expect(numbers.some((c) => c?.contains('text-primary-foreground'))).toBe(false);
    expect(items.map((item) => item.getAttribute('aria-current'))).toEqual([
      null,
      null,
      null,
      'step',
    ]);
  });
});
