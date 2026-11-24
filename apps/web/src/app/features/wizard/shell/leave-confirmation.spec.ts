import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { screen, waitFor } from '@testing-library/angular';
import { chileContent, colombiaContent } from '../../../../testing/content-fixtures';
import type { WizardCopy } from '@car-insurance/shared';
import type { LeaveDialogCopy } from './components/leave-dialog';
import { LeaveConfirmation } from './leave-confirmation';

/** The wizard's leave copy as the dialog takes it (AC-034). */
const leaveCopy = (copy: WizardCopy): LeaveDialogCopy => ({
  title: copy.leaveTitle,
  message: copy.leaveMessage,
  stayLabel: copy.leaveStayLabel,
  leaveLabel: copy.leaveConfirmLabel,
});

describe('LeaveConfirmation', () => {
  let leave: LeaveConfirmation;
  let trigger: HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LeaveConfirmation] });
    leave = TestBed.inject(LeaveConfirmation);
    trigger = document.createElement('button');
    trigger.textContent = 'Campo';
    document.body.append(trigger);
    trigger.focus();
  });

  afterEach(() => trigger.remove());

  it('AC-034 shows the dialog with the copy of the country, named and described, focusing stay', async () => {
    const answer = leave.ask(leaveCopy(colombiaContent().country.copy));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = document.getElementById(dialog.getAttribute('aria-labelledby') ?? '');
    expect(title?.textContent?.trim()).toBe('¿Quieres salir del formulario?');
    await waitFor(() =>
      expect(
        document.getElementById(dialog.getAttribute('aria-describedby') ?? '')?.textContent?.trim(),
      ).toBe('Perderás los datos que escribiste en este paso.'),
    );
    await waitFor(() =>
      expect(document.activeElement?.textContent?.trim()).toBe('Seguir en el formulario'),
    );
    expect(screen.getByRole('button', { name: 'Salir' })).toBeTruthy();

    screen.getByRole('button', { name: 'Seguir en el formulario' }).click();
    await expect(answer).resolves.toBe(false);
  });

  it('AC-008 AC-034 uses the copy of Chile for its dialog and leave resolves to leave', async () => {
    const answer = leave.ask(leaveCopy(chileContent().country.copy));

    expect(await screen.findByRole('button', { name: 'Seguir cotizando' })).toBeTruthy();
    screen.getByRole('button', { name: 'Abandonar' }).click();

    await expect(answer).resolves.toBe(true);
  });

  it('AC-034 Escape stays and focus returns to the element that had it', async () => {
    const answer = leave.ask(leaveCopy(colombiaContent().country.copy));
    const dialog = await screen.findByRole('alertdialog');
    await waitFor(() => expect(document.activeElement).not.toBe(trigger));

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );

    await expect(answer).resolves.toBe(false);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('AC-034 a second request while the dialog is open reuses the same question', async () => {
    const first = leave.ask(leaveCopy(colombiaContent().country.copy));
    const second = leave.ask(leaveCopy(colombiaContent().country.copy));

    expect(second).toBe(first);
    (await screen.findByRole('button', { name: 'Salir' })).click();
    await expect(first).resolves.toBe(true);
  });

  it('AC-034 AC-035 knows whether the active step has unconfirmed values', () => {
    let unconfirmed = true;
    const callbacks: (() => void)[] = [];
    const destroyRef = {
      onDestroy: (callback: () => void) => callbacks.push(callback),
    } as unknown as DestroyRef;

    expect(leave.hasUnconfirmedValues()).toBe(false);
    leave.track(() => unconfirmed, destroyRef);
    expect(leave.hasUnconfirmedValues()).toBe(true);
    unconfirmed = false;
    expect(leave.hasUnconfirmedValues()).toBe(false);
    unconfirmed = true;
    callbacks.forEach((callback) => callback());
    expect(leave.hasUnconfirmedValues()).toBe(false);
  });

  it('AC-096 shows the processing copy of the summary with the same behavior', async () => {
    const summary = chileContent().country.summaryCopy;
    const answer = leave.ask({
      title: summary.processingLeaveTitle,
      message: summary.processingLeaveMessage,
      stayLabel: summary.processingLeaveStayLabel,
      leaveLabel: summary.processingLeaveConfirmLabel,
    });

    const dialog = await screen.findByRole('alertdialog');
    const title = document.getElementById(dialog.getAttribute('aria-labelledby') ?? '');
    expect(title?.textContent?.trim()).toBe('¿Salir mientras procesamos el pago?');
    await waitFor(() =>
      expect(document.activeElement?.textContent?.trim()).toBe('Seguir esperando'),
    );
    screen.getByRole('button', { name: 'Abandonar' }).click();
    await expect(answer).resolves.toBe(true);
  });

  it('AC-089 AC-096 knows whether the active step processes a payment and with which copy', () => {
    const copy = leaveCopy(colombiaContent().country.copy);
    let processing = true;
    const callbacks: (() => void)[] = [];
    const destroyRef = {
      onDestroy: (callback: () => void) => callbacks.push(callback),
    } as unknown as DestroyRef;

    expect(leave.processingCopy()).toBeNull();
    leave.trackProcessing(() => (processing ? copy : null), destroyRef);
    expect(leave.processingCopy()).toEqual(copy);
    processing = false;
    expect(leave.processingCopy()).toBeNull();
    processing = true;
    callbacks.forEach((callback) => callback());
    expect(leave.processingCopy()).toBeNull();
  });
});
