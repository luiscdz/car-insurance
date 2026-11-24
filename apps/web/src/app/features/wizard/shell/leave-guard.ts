import type { CanDeactivateFn } from '@angular/router';

/** A component that can tell whether the person may leave it for a target address. */
export interface LeaveAware {
  canLeave(targetUrl: string): boolean | Promise<boolean>;
}

/**
 * Asks the wizard whether the person may go to the target address. It runs on every navigation
 * (`runGuardsAndResolvers: 'always'`): the wizard asks before unconfirmed values are lost when
 * leaving it (AC-034, AC-035) and before any move while a payment is processed (AC-096).
 */
export const leaveWizardGuard: CanDeactivateFn<LeaveAware> = (component, _route, _state, next) =>
  component.canLeave(next.url);
