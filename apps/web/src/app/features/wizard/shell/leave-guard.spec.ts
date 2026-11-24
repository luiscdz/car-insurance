import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { type LeaveAware, leaveWizardGuard } from './leave-guard';

describe('leaveWizardGuard', () => {
  it('AC-034 AC-035 asks the wizard whether it may leave for the target address', () => {
    const targets: string[] = [];
    const wizard: LeaveAware = {
      canLeave: (url) => {
        targets.push(url);
        return url === '/cl';
      },
    };
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    expect(leaveWizardGuard(wizard, route, state, { url: '/cl' } as RouterStateSnapshot)).toBe(
      true,
    );
    expect(leaveWizardGuard(wizard, route, state, { url: '/' } as RouterStateSnapshot)).toBe(false);
    expect(targets).toEqual(['/cl', '/']);
  });
});
