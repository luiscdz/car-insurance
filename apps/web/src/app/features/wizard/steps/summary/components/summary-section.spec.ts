import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { SummarySection } from './summary-section';

const rows = [
  { key: 'rut', label: 'RUT', value: '•••••678-k' },
  { key: 'fecha-nacimiento', label: 'Fecha de nacimiento', value: '05-03-1990' },
];

async function setup(locked = false) {
  return render(SummarySection, {
    inputs: {
      headingId: 'summary-tus-datos',
      title: 'Tus datos',
      rows,
      action: { label: 'Editar', name: 'Editar Tus datos', link: ['/', 'cl', 'tus-datos'] },
      locked,
    },
    providers: [provideRouter([])],
  });
}

describe('SummarySection', () => {
  it('AC-067 AC-090 is a region named by its heading with label and value pairs as terms and descriptions', async () => {
    const { container } = await setup();

    const region = screen.getByRole('region', { name: 'Tus datos' });
    expect(screen.getByRole('heading', { level: 2, name: 'Tus datos' })).toBeTruthy();
    const pairs = [...region.querySelectorAll('dl > div')].map((row) => [
      row.querySelector('dt')?.textContent?.trim(),
      row.querySelector('dd')?.textContent?.trim(),
    ]);
    expect(pairs).toEqual([
      ['RUT', '•••••678-k'],
      ['Fecha de nacimiento', '05-03-1990'],
    ]);
    expect(container.querySelector('dd')?.getAttribute('aria-label')).toBeNull();
  });

  it('AC-071 AC-090 the edit action shows its label, is named with the section title and links to the step', async () => {
    await setup();

    const link = screen.getByRole('link', { name: 'Editar Tus datos' });
    expect(link.textContent?.trim()).toBe('Editar');
    expect(link.getAttribute('href')).toBe('/cl/tus-datos');
    expect(link.hasAttribute('aria-disabled')).toBe(false);
  });

  it('AC-078 a locked action has no link and is exposed as disabled', async () => {
    await setup(true);

    const link = screen.getByRole('link', { name: 'Editar Tus datos' });
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
  });
});
