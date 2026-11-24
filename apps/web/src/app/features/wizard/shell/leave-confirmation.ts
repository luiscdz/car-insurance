import { type DestroyRef, Injectable, inject } from '@angular/core';
import { BrnDialogService } from '@spartan-ng/brain/dialog';
import { firstValueFrom } from 'rxjs';
import {
  LEAVE_DIALOG_INITIAL_FOCUS,
  LeaveDialog,
  type LeaveDialogContext,
  type LeaveDialogCopy,
} from './components/leave-dialog';

/** Tells the dialog copy while a payment is processed, and `null` otherwise (AC-096). */
export type ProcessingCheck = () => LeaveDialogCopy | null;

/**
 * Asks before something is lost when leaving (AC-034, AC-096). Scoped to the wizard shell; the
 * active step registers how to tell whether it has unconfirmed values and whether a payment is
 * being processed.
 */
@Injectable()
export class LeaveConfirmation {
  private readonly dialogs = inject(BrnDialogService);
  private check: (() => boolean) | null = null;
  private processing: ProcessingCheck | null = null;
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

  trackProcessing(check: ProcessingCheck, destroyRef: DestroyRef): void {
    this.processing = check;
    destroyRef.onDestroy(() => {
      if (this.processing === check) {
        this.processing = null;
      }
    });
  }

  /** The dialog copy while the active step processes a payment, or `null` (AC-096). */
  processingCopy(): LeaveDialogCopy | null {
    return this.processing?.() ?? null;
  }

  /**
   * Opens the leave dialog and resolves `true` to leave or `false` to stay; Escape stays. Focus
   * moves to the stay action and returns to the element that had it (AC-034).
   */
  ask(copy: LeaveDialogCopy): Promise<boolean> {
    this.pending ??= this.open(copy).finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  private async open(copy: LeaveDialogCopy): Promise<boolean> {
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
