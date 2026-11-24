import { TestBed } from '@angular/core/testing';
import { BrnDialogService } from '@spartan-ng/brain/dialog';
import { screen, waitFor, within } from '@testing-library/angular';
import { toParagraphs } from '../models/terms-paragraphs';
import { TERMS_DIALOG_INITIAL_FOCUS, TermsDialog, type TermsDialogContext } from './terms-dialog';

const TEXT = 'Primero.\n\nLínea uno\nLínea dos\n\nTexto con <b>marca</b> y **negrita**.';

describe('TermsDialog', () => {
  let trigger: HTMLButtonElement;

  beforeEach(() => {
    trigger = document.createElement('button');
    trigger.textContent = 'Ver términos';
    document.body.append(trigger);
    trigger.focus();
  });

  afterEach(() => trigger.remove());

  function open() {
    return TestBed.inject(BrnDialogService).open<Omit<TermsDialogContext, 'close'>, undefined>(
      TermsDialog,
      undefined,
      { title: 'Términos y condiciones', closeLabel: 'Cerrar', paragraphs: toParagraphs(TEXT) },
      { role: 'dialog', autoFocus: TERMS_DIALOG_INITIAL_FOCUS, restoreFocus: true },
    );
  }

  it('AC-074 shows each block as a paragraph, keeps inner line breaks and interprets no markup', async () => {
    open();

    const dialog = await screen.findByRole('dialog', { name: 'Términos y condiciones' });
    const paragraphs = [...dialog.querySelectorAll('p')];
    expect(paragraphs.map((p) => p.textContent?.trim())).toEqual([
      'Primero.',
      'Línea uno\nLínea dos',
      'Texto con <b>marca</b> y **negrita**.',
    ]);
    expect(paragraphs[1]?.className).toContain('whitespace-pre-line');
    expect(dialog.querySelector('b, strong')).toBeNull();
  });

  it('AC-075 is modal, focuses its title, scrolls its text apart from the title and closes with the close action', async () => {
    open();

    const dialog = await screen.findByRole('dialog', { name: 'Términos y condiciones' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = within(dialog).getByRole('heading', { level: 2 });
    await waitFor(() => expect(document.activeElement).toBe(title));
    const body = dialog.querySelector('[data-terms-body]') as HTMLElement;
    expect(body.className).toContain('overflow-y-auto');
    expect(body.contains(title)).toBe(false);

    within(dialog).getByRole('button', { name: 'Cerrar' }).click();

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('AC-075 Escape closes and returns focus', async () => {
    open();
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(document.activeElement).not.toBe(trigger));

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
