import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  untracked,
} from '@angular/core';
import type { FieldValue, FormFieldContent } from '@car-insurance/shared';
import { fireEvent, render, screen } from '@testing-library/angular';
import {
  chileContent,
  colombiaContent,
  field,
  TODAY,
} from '../../../../../../testing/content-fixtures';
import { CLOCK } from '../../../../../core/clock';
import type { FieldView } from '../models/field-view';
import { FieldFormFactory } from '../services/field-form';
import { DynamicField } from './dynamic-field';
import { FIELD_RENDERERS } from './field-renderers';

@Component({
  selector: 'app-dynamic-field-host',
  imports: [DynamicField],
  providers: [FieldFormFactory],
  template: `<app-dynamic-field [view]="view()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DynamicFieldHost {
  readonly config = input.required<FormFieldContent>();
  readonly stored = input<Record<string, FieldValue> | undefined>(undefined);
  private readonly forms = inject(FieldFormFactory);

  readonly view = computed<FieldView>(() => {
    const config = this.config();
    const form = untracked(() => this.forms.create([config], this.stored()));
    const control = form.controls[0];
    if (!control) {
      throw new Error('No control');
    }
    return { control, renderer: FIELD_RENDERERS[config.type] };
  });
}

async function renderField(config: FormFieldContent, stored?: Record<string, FieldValue>) {
  return render(DynamicFieldHost, {
    inputs: { config, stored },
    providers: [{ provide: CLOCK, useValue: () => TODAY }],
  });
}

const colombianFields = colombiaContent().steps[0]?.fields ?? [];
const chileanFields = [
  ...(chileContent().steps[0]?.fields ?? []),
  ...(chileContent().steps[1]?.fields ?? []),
];
const byName = (fields: readonly FormFieldContent[], name: string) => {
  const found = fields.find((candidate) => candidate.name === name);
  if (!found) {
    throw new Error(name);
  }
  return found;
};

describe('DynamicField', () => {
  it('AC-005 a text field shows its label above, the required marker and its help text below', async () => {
    const { container } = await renderField(byName(colombianFields, 'placa'));

    const input = screen.getByRole('textbox', { name: /Placa/ });
    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('placeholder')).toBe('Ej: ABC123');
    const label = container.querySelector('label');
    expect(label?.textContent?.trim()).toMatch(/^Placa\s*\*$/);
    expect(label?.querySelector('[aria-hidden="true"]')?.textContent).toBe('*');
    const help = screen.getByText('Tres letras seguidas de tres números.');
    expect(label?.compareDocumentPosition(input)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(input.compareDocumentPosition(help)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('AC-005 AC-027 an optional field without help has no marker and no description', async () => {
    const { container } = await renderField(
      field({ name: 'comentario', label: 'Comentario', required: false }),
    );

    const input = screen.getByRole('textbox', { name: 'Comentario' });
    expect(container.querySelector('label [aria-hidden]')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(input.getAttribute('aria-required')).toBe('false');
  });

  it('AC-005 a number field gives a numeric input', async () => {
    await renderField(byName(chileanFields, 'anio'));

    const input = screen.getByRole('textbox', { name: /Año del vehículo/ });
    expect(input.getAttribute('inputmode')).toBe('numeric');
  });

  it('AC-005 a date field gives a date input', async () => {
    const { container } = await renderField(byName(chileanFields, 'fecha-nacimiento'));

    expect(container.querySelector('input')?.getAttribute('type')).toBe('date');
    expect(screen.getByLabelText(/Fecha de nacimiento/)).toBeTruthy();
  });

  it('AC-005 a checkbox field gives a checkbox whose text is the label', async () => {
    await renderField(byName(colombianFields, 'uso-particular'));

    const checkbox = screen.getByRole('checkbox', { name: 'El vehículo es de uso particular' });
    expect((checkbox as HTMLInputElement).checked).toBe(false);
  });

  it('AC-006 a select offers exactly its options in configured order with none chosen', async () => {
    await renderField(byName(colombianFields, 'tipo-documento'));

    const select = screen.getByRole('combobox', { name: /Tipo de documento/ }) as HTMLSelectElement;
    const options = [...select.options];
    expect(options.map((option) => option.textContent?.trim())).toEqual([
      'Selecciona tu tipo de documento',
      'Cédula de ciudadanía',
      'Cédula de extranjería',
    ]);
    expect(options[0]?.disabled).toBe(true);
    expect(select.value).toBe('');
  });

  it('AC-006 the makes of Chile are offered in their order', async () => {
    await renderField(byName(chileanFields, 'marca'));

    const select = screen.getByRole('combobox', { name: /Marca/ }) as HTMLSelectElement;
    expect([...select.options].slice(1).map((option) => option.value)).toEqual([
      'toyota',
      'suzuki',
    ]);
  });

  it('AC-010 no error is shown before the person leaves the field', async () => {
    const { fixture } = await renderField(byName(colombianFields, 'placa'));
    const input = screen.getByRole('textbox', { name: /Placa/ });

    fireEvent.input(input, { target: { value: 'x' } });
    await fixture.whenStable();

    expect(screen.queryByText('Ingresa una placa válida.')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBe('false');
  });

  it('AC-009 AC-010 AC-027 leaving an invalid field shows its configured error, associated and announced as invalid', async () => {
    const { fixture } = await renderField(byName(colombianFields, 'placa'));
    const input = screen.getByRole('textbox', { name: /Placa/ });

    fireEvent.input(input, { target: { value: 'AB12' } });
    fireEvent.blur(input);
    await fixture.whenStable();

    const error = screen.getByText('Ingresa una placa válida.').closest('p');
    expect(error?.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('field-placa-help field-placa-error');
    expect(error?.id).toBe('field-placa-error');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.compareDocumentPosition(error as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('AC-010 the error disappears as soon as the value becomes valid', async () => {
    const { fixture } = await renderField(byName(colombianFields, 'placa'));
    const input = screen.getByRole('textbox', { name: /Placa/ });
    fireEvent.blur(input);
    await fixture.whenStable();
    expect(screen.getByText('Ingresa una placa válida.')).toBeTruthy();

    fireEvent.input(input, { target: { value: 'abc123' } });
    await fixture.whenStable();

    expect(screen.queryByText('Ingresa una placa válida.')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBe('field-placa-help');
  });

  it('AC-009 a field shows its single message whichever validation fails', async () => {
    const { fixture } = await renderField(byName(chileanFields, 'anio'));
    const input = screen.getByRole('textbox', { name: /Año/ });

    for (const value of ['', '1990', '2020.5', 'abc']) {
      fireEvent.input(input, { target: { value } });
      fireEvent.blur(input);
      await fixture.whenStable();
      expect(screen.getAllByText('Ingresa un año válido.')).toHaveLength(1);
    }
  });

  it('AC-020 a stored value is shown with no error displayed', async () => {
    await renderField(byName(colombianFields, 'tipo-documento'), { 'tipo-documento': 'ce' });

    const select = screen.getByRole('combobox', { name: /Tipo de documento/ }) as HTMLSelectElement;
    expect(select.value).toBe('ce');
    expect(screen.queryByText('Selecciona un tipo de documento.')).toBeNull();
  });
});
