import { render, screen } from '@testing-library/angular';
import { StatusMessage } from './status-message';

describe('StatusMessage', () => {
  it('AC-016 AC-017 announces the message as an alert with an icon and the projected action', async () => {
    await render(
      `<app-status-message message="No pudimos cargar el formulario."><button>Reintentar</button></app-status-message>`,
      { imports: [StatusMessage] },
    );

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('No pudimos cargar el formulario.');
    expect(alert.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });
});
