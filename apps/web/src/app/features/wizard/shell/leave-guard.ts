import type { CanDeactivateFn } from '@angular/router';

/** A component that can tell whether the person may leave it for a target address. */
export interface LeaveAware {
  canLeave(targetUrl: string): boolean | Promise<boolean>;
}

/**
 * Asks before leaving the country's wizard for the root address or another country's wizard
 * (AC-034). Moves between steps of the same wizard never deactivate it, so they never ask
 * (AC-035).
 */
export const leaveWizardGuard: CanDeactivateFn<LeaveAware> = (component, _route, _state, next) =>
  component.canLeave(next.url);
