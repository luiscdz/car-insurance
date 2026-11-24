import { type DestroyRef, Injectable, inject } from '@angular/core';
import type { WizardCopy } from '@car-insurance/shared';
import { BrnDialogService } from '@spartan-ng/brain/dialog';
import { firstValueFrom } from 'rxjs';
import {
  LEAVE_DIALOG_INITIAL_FOCUS,
  LeaveDialog,
  type LeaveDialogContext,
} from './components/leave-dialog';

/**
 * Asks before unconfirmed values are lost when leaving the wizard (AC-034). Scoped to the wizard
 * shell; the active step registers how to tell whether it has unconfirmed values.
 */
@Injectable()
export class LeaveConfirmation {
  private readonly dialogs = inject(BrnDialogService);
  private check: (() => boolean) | null = null;
  private pending: Promise<boolean> | null = null;

  track(check: () => boolean, destroyRef: DestroyRef): void {
    this.check = check;
    destroyRef.onDestroy(() => {
      if (this.check === check) {
        this.check = null;
      }
    });
  }

  hasUnconfirmedValues(): boolean {
    return this.check?.() ?? false;
  }

  /**
   * Opens the leave dialog and resolves `true` to leave or `false` to stay; Escape stays. Focus
   * moves to the stay action and returns to the element that had it (AC-034).
   */
  ask(copy: WizardCopy): Promise<boolean> {
    this.pending ??= this.open(copy).finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  private async open(copy: WizardCopy): Promise<boolean> {
    const ref = this.dialogs.open<Omit<LeaveDialogContext, 'close'>, boolean>(
      LeaveDialog,
      undefined,
      { copy },
      {
        role: 'alertdialog',
        autoFocus: LEAVE_DIALOG_INITIAL_FOCUS,
        restoreFocus: true,
        closeOnOutsidePointerEvents: false,
        backdropClass: 'bg-foreground/55',
      },
    );
    return (await firstValueFrom(ref.closed$)) === true;
  }
}
