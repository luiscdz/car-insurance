import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrnAlertDialogDescription, BrnAlertDialogTitle } from '@spartan-ng/brain/alert-dialog';
import { injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import type { WizardCopy } from '@car-insurance/shared';
import { Button } from '../../../../shared/ui/button';

export interface LeaveDialogContext {
  readonly copy: WizardCopy;
  readonly close: (leave?: boolean) => void;
}

/** Selector of the action that receives focus when the dialog opens (AC-034). */
export const LEAVE_DIALOG_INITIAL_FOCUS = '[data-leave-stay]';

/**
 * The application's leave dialog (AC-034): title, message, leave and stay actions with the
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
      {{ context.copy.leaveTitle }}
    </h2>
    <p brnAlertDialogDescription class="mb-6 text-pretty">{{ context.copy.leaveMessage }}</p>
    <div class="flex flex-col-reverse gap-3 min-[480px]:flex-row min-[480px]:justify-end">
      <button type="button" appButton="secondary" (click)="context.close(true)">
        {{ context.copy.leaveConfirmLabel }}
      </button>
      <button type="button" appButton="cta" data-leave-stay (click)="context.close(false)">
        {{ context.copy.leaveStayLabel }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveDialog {
  protected readonly context = injectBrnDialogContext<LeaveDialogContext>();
}
