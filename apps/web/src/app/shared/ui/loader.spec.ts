import { render, screen } from '@testing-library/angular';
import { Loader } from './loader';

describe('Loader', () => {
  it('AC-015 shows a visible loader and announces its label as a status', async () => {
    const { fixture } = await render(Loader, { inputs: { label: 'Cargando…' } });
    await fixture.whenStable();

    expect(screen.getByTestId('loader')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Cargando…');
  });

  it('AC-015 AC-030 the spinner only turns when the system allows motion', async () => {
    await render(Loader, { inputs: { label: 'Cargando…' } });

    const spinner = screen.getByTestId('loader').querySelector('span');
    expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    expect(spinner?.classList.contains('motion-safe:animate-spin')).toBe(true);
    expect(spinner?.classList.contains('animate-spin')).toBe(false);
  });
});
