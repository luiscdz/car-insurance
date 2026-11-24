import type { WizardData } from '@car-insurance/shared';
import {
  chileContent,
  colombiaContent,
  colombiaPricingFields,
  colombiaFields,
  rawField,
} from '../../../../../../testing/content-fixtures';
import { toSummarySections } from './summary-view';

const intlDate = (locale: string, year: number, month: number, day: number) =>
  new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));

const chileData: WizardData = {
  steps: {
    'tus-datos': {
      values: { rut: '12345678-k', 'fecha-nacimiento': '1990-03-05' },
      complete: true,
    },
    'tu-vehiculo': { values: { marca: 'toyota', anio: '2020' }, complete: true },
  },
};

describe('toSummarySections', () => {
  it('AC-067 AC-068 AC-069 Chile: one section per form step in configured order with presented values', () => {
    const content = chileContent();

    const sections = toSummarySections(content, chileData, content.country.summaryCopy);

    expect(sections).toEqual([
      {
        slug: 'tus-datos',
        title: 'Tus datos',
        rows: [
          { key: 'rut', label: 'RUT', value: '•••••678-k' },
          {
            key: 'fecha-nacimiento',
            label: 'Fecha de nacimiento',
            value: intlDate('es-CL', 1990, 3, 5),
          },
        ],
      },
      {
        slug: 'tu-vehiculo',
        title: 'Tu vehículo',
        rows: [
          { key: 'marca', label: 'Marca', value: 'Toyota' },
          { key: 'anio', label: 'Año del vehículo', value: '2020' },
        ],
      },
    ]);
  });

  it('AC-067 AC-068 AC-069 Colombia: one section with the select label, the masked document, the plate as entered and the checkbox as yes', () => {
    const content = colombiaContent([...colombiaFields(), ...colombiaPricingFields()]);
    const data: WizardData = {
      steps: {
        'tus-datos-y-tu-vehiculo': {
          values: {
            'tipo-documento': 'cc',
            'numero-documento': '1234567890',
            placa: 'abc123',
            'uso-particular': true,
            'fecha-nacimiento': '1990-03-05',
            anio: '2020',
          },
          complete: true,
        },
      },
    };

    const sections = toSummarySections(content, data, content.country.summaryCopy);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.title).toBe('Tus datos y tu vehículo');
    expect(sections[0]?.rows.map((row) => [row.label, row.value])).toEqual([
      ['Tipo de documento', 'Cédula de ciudadanía'],
      ['Número de documento', '••••••7890'],
      ['Placa', 'abc123'],
      ['El vehículo es de uso particular', 'Sí'],
      ['Fecha de nacimiento', intlDate('es-CO', 1990, 3, 5)],
      ['Año del vehículo', '2020'],
    ]);
  });

  it('AC-068 a checkbox with a stored value is always listed, unchecked as the no text', () => {
    const content = colombiaContent();
    const data: WizardData = {
      steps: {
        'tus-datos-y-tu-vehiculo': {
          values: { 'tipo-documento': 'ce', 'uso-particular': false },
          complete: true,
        },
      },
    };

    const rows = toSummarySections(content, data, content.country.summaryCopy)[0]?.rows;

    expect(rows?.map((row) => [row.key, row.value])).toEqual([
      ['tipo-documento', 'Cédula de extranjería'],
      ['uso-particular', 'No'],
    ]);
  });

  it('AC-068 AC-073 the yes and no texts come from the country copy', () => {
    const content = colombiaContent();
    const copy = { ...content.country.summaryCopy, yesLabel: 'Afirmativo', noLabel: 'Negativo' };
    const data: WizardData = {
      steps: { 'tus-datos-y-tu-vehiculo': { values: { 'uso-particular': true }, complete: true } },
    };

    expect(toSummarySections(content, data, copy)[0]?.rows[0]?.value).toBe('Afirmativo');
  });

  it('AC-068 an optional field left empty and fields without a stored value are not listed', () => {
    const content = colombiaContent([
      ...colombiaFields(),
      rawField({ name: 'color', label: 'Color', required: false, order: 9 }),
    ]);
    const data: WizardData = {
      steps: {
        'tus-datos-y-tu-vehiculo': {
          values: { placa: 'ABC123', color: '   ', 'tipo-documento': 'desconocido' },
          complete: true,
        },
      },
    };

    const rows = toSummarySections(content, data, content.country.summaryCopy)[0]?.rows;

    expect(rows?.map((row) => row.key)).toEqual(['placa']);
  });

  it('AC-067 shows only the data stored for this country and no step without form fields', () => {
    const content = chileContent();
    const sections = toSummarySections(
      content,
      { steps: { 'tus-datos-y-tu-vehiculo': { values: { placa: 'ABC123' }, complete: true } } },
      content.country.summaryCopy,
    );

    expect(sections.map((section) => [section.slug, section.rows.length])).toEqual([
      ['tus-datos', 0],
      ['tu-vehiculo', 0],
    ]);
  });
});
