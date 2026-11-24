import { planSchema, type Plan } from '@car-insurance/shared';
import {
  chileContent,
  colombiaContent,
  rawChile,
  rawPlan,
} from '../../../../../../testing/content-fixtures';
import { toPlanViews } from './plan-view';

const chile = chileContent().country;
const plan = (documentId: string, recommended: boolean): Plan =>
  planSchema.parse(rawPlan({ documentId, currency: 'CLP', recommended }));

describe('toPlanViews', () => {
  it('AC-038 distinguishes the single recommended plan of Colombia', () => {
    const { plans, country } = colombiaContent();

    expect(toPlanViews(plans, country).map((view) => [view.name, view.recommended])).toEqual([
      ['Plan Básico', false],
      ['Plan Clásico', true],
      ['Plan Global', false],
    ]);
  });

  it('AC-038 distinguishes no plan when none is recommended', () => {
    const views = toPlanViews([plan('a', false), plan('b', false)], chile);

    expect(views.some((view) => view.recommended)).toBe(false);
  });

  it('AC-038 distinguishes only the first of several recommended plans, keeping the order', () => {
    const views = toPlanViews([plan('a', false), plan('b', true), plan('c', true)], chile);

    expect(views.map((view) => [view.id, view.recommended])).toEqual([
      ['a', false],
      ['b', true],
      ['c', false],
    ]);
  });

  it('AC-042 formats base prices with the currency and locale of each country', () => {
    const colombia = colombiaContent();
    const [chileFirst] = toPlanViews(chileContent().plans, chile);
    const [colombiaFirst] = toPlanViews(colombia.plans, colombia.country);

    expect(chileFirst?.basePrice).toBe(
      new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }).format(350000),
    );
    expect(colombiaFirst?.basePrice).toBe(
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(1200000),
    );
    expect(rawChile()['formatLocale']).toBe('es-CL');
  });

  it('AC-037 keeps coverages and benefits in configured order with unique keys', () => {
    const { plans, country } = colombiaContent();
    const views = toPlanViews(plans, country);

    expect(views[2]?.benefits).toEqual(['Vehículo de reemplazo por 20 días', 'Conductor elegido']);
    expect(views[0]?.coverages.map((coverage) => coverage.highlight)).toEqual([
      'Hasta $ 1.000 millones',
      null,
    ]);
    expect(new Set(views.map((view) => view.key)).size).toBe(views.length);
  });
});
