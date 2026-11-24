import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrnAlertDialogDescription, BrnAlertDialogTitle } from '@spartan-ng/brain/alert-dialog';
import { injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { Button } from '../../../../shared/ui/button';

/**
 * The texts of a leave dialog, from the country's content: the wizard's copy for unconfirmed
 * values (AC-034) or the summary copy while a payment is processed (AC-096).
 */
export interface LeaveDialogCopy {
  readonly title: string;
  readonly message: string;
  readonly stayLabel: string;
  readonly leaveLabel: string;
}

export interface LeaveDialogContext {
  readonly copy: LeaveDialogCopy;
  readonly close: (leave?: boolean) => void;
}

/** Selector of the action that receives focus when the dialog opens (AC-034). */
export const LEAVE_DIALOG_INITIAL_FOCUS = '[data-leave-stay]';

/**
 * The application's leave dialog (AC-034, AC-096): title, message, leave and stay actions with the
 * country's copy from Strapi. On phones the stay action sits on top; the DOM order is leave, stay.
 */
@Component({
  selector: 'app-leave-dialog',
  imports: [BrnAlertDialogDescription, BrnAlertDialogTitle, Button],
  host: {
    class:
      'block w-[min(440px,calc(100vw-32px))] rounded-lg bg-background p-6 text-foreground shadow-2xl',
  },
  template: `
    <h2
      brnAlertDialogTitle
      class="mb-2 text-[22px] leading-snug font-bold text-balance text-primary-strong"
    >
      {{ context.copy.title }}
    </h2>
    <p brnAlertDialogDescription class="mb-6 text-pretty">{{ context.copy.message }}</p>
    <div class="flex flex-col-reverse gap-3 min-[480px]:flex-row min-[480px]:justify-end">
      <button type="button" appButton="secondary" (click)="context.close(true)">
        {{ context.copy.leaveLabel }}
      </button>
      <button type="button" appButton="cta" data-leave-stay (click)="context.close(false)">
        {{ context.copy.stayLabel }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveDialog {
  protected readonly context = injectBrnDialogContext<LeaveDialogContext>();
}
