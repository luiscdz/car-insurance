import type { PlanCopy } from '@car-insurance/shared';
import { render, screen, within } from '@testing-library/angular';
import { chileContent, colombiaContent } from '../../../../../../testing/content-fixtures';
import { type PlanView, type PriceState, toPlanViews } from '../models/plan-view';
import { PlanCard } from './plan-card';

function viewsOf(content: ReturnType<typeof colombiaContent>) {
  return { views: toPlanViews(content.plans, content.country), copy: content.country.planCopy };
}

async function renderCard(
  plan: PlanView,
  copy: PlanCopy,
  chosen = false,
  price: PriceState | null = null,
) {
  const choose = vi.fn();
  const retry = vi.fn();
  const result = await render(PlanCard, {
    inputs: { plan, copy, chosen, price },
    on: { choose, retry },
  });
  return { ...result, choose, retry, article: screen.getByRole('article') };
}

describe('PlanCard', () => {
  it('AC-037 shows a Colombian plan without benefits and a coverage without highlighted value', async () => {
    const { views, copy } = viewsOf(colombiaContent());
    const { article } = await renderCard(views[0] as PlanView, copy);

    expect(within(article).getByRole('heading', { level: 2 }).textContent?.trim()).toBe(
      'Plan Básico',
    );
    expect(article.textContent).toContain('Lo esencial para circular.');
    expect(article.textContent).toContain('Precio base anual');
    expect(article.textContent).toContain(views[0]?.basePrice);
    const coverages = within(article).getAllByRole('listitem');
    expect(coverages.map((item) => item.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Responsabilidad civil Hasta $ 1.000 millones',
      'Asistencia jurídica',
    ]);
    expect(coverages[0]?.querySelector('strong')?.textContent).toBe('Hasta $ 1.000 millones');
    expect(coverages[1]?.querySelector('strong')).toBeNull();
    expect(within(article).queryByRole('heading', { name: 'Beneficios' })).toBeNull();
    expect(within(article).getByRole('heading', { level: 3 }).textContent?.trim()).toBe(
      'Coberturas',
    );
  });

  it('AC-037 AC-040 shows a Chilean plan with its benefits and the copy of Chile', async () => {
    const { views, copy } = viewsOf(chileContent());
    const full = views.find((view) => view.id === 'cl-full') as PlanView;
    const { article } = await renderCard(full, copy);

    expect(within(article).getByRole('heading', { name: 'Extras' })).toBeTruthy();
    expect(within(article).getByRole('heading', { name: 'Qué cubre' })).toBeTruthy();
    expect(article.textContent).toContain('Auto de reemplazo por 7 días');
    expect(article.textContent).toContain('Desde');
    expect(screen.getByRole('button', { name: 'Quiero este plan: Plan Full' })).toBeTruthy();
  });

  it('AC-038 AC-060 the recommended plan shows its badge, styling and announces the badge with the plan', async () => {
    const { views, copy } = viewsOf(chileContent());
    const full = views.find((view) => view.id === 'cl-full') as PlanView;
    const { article } = await renderCard(full, copy);

    const badge = within(article).getByText('El más elegido');
    expect(article.classList).toContain('border-primary');
    expect(article.classList).toContain('bg-surface-info');
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-describedby')?.split(' ')).toContain(badge.id);
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('AC-038 a plan that is not recommended has no badge and no recommended styling', async () => {
    const { views, copy } = viewsOf(colombiaContent());
    const { article } = await renderCard(views[2] as PlanView, copy);

    expect(within(article).queryByText('Recomendado')).toBeNull();
    expect(article.classList).not.toContain('bg-surface-info');
    expect(screen.getByRole('button').getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
  });

  it('AC-048 AC-060 the chosen plan is pressed and shows the chosen text and a check icon', async () => {
    const { views, copy } = viewsOf(colombiaContent());
    await renderCard(views[1] as PlanView, copy, true, { kind: 'waiting' });

    const button = screen.getByRole('button', {
      name: 'Plan elegido: Plan Clásico',
      pressed: true,
    });
    expect(button.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('AC-045 AC-060 the waiting text and then the final price are in a status region described with the plan', async () => {
    const { views, copy } = viewsOf(colombiaContent());
    const { rerender } = await renderCard(views[0] as PlanView, copy, true, { kind: 'waiting' });

    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Calculando tu precio…');
    expect(screen.getByRole('button').getAttribute('aria-describedby')).toContain(status.id);

    await rerender({
      inputs: {
        plan: views[0],
        copy,
        chosen: true,
        price: { kind: 'ready', amount: '$ 1.500.000' },
      },
      partialUpdate: true,
    });
    expect(screen.getByRole('status').textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Tu precio anual $ 1.500.000',
    );
  });

  it('AC-047 the price error shows the message and the retry action, announced', async () => {
    const { views, copy } = viewsOf(chileContent());
    const { retry } = await renderCard(views[0] as PlanView, copy, true, { kind: 'error' });

    expect(screen.getByRole('status').textContent).toContain('El precio no está disponible.');
    screen.getByRole('button', { name: 'Volver a intentar' }).click();
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('AC-045 a plan that is not chosen shows no final price even if one is given', async () => {
    const { views, copy } = viewsOf(colombiaContent());
    await renderCard(views[0] as PlanView, copy, false, { kind: 'ready', amount: '$ 1' });

    expect(screen.getByRole('status').textContent?.trim()).toBe('');
  });

  it('AC-048 activating the choice action emits choose', async () => {
    const { views, copy } = viewsOf(colombiaContent());
    const { choose } = await renderCard(views[0] as PlanView, copy);

    screen.getByRole('button', { name: 'Elegir este plan: Plan Básico' }).click();

    expect(choose).toHaveBeenCalledTimes(1);
  });
});
