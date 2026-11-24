import { InjectionToken } from '@angular/core';

/** Returns the current date and time of the person's device. */
export type Clock = () => Date;

/**
 * Source of the current date used by date-relative validations (AC-013, AC-014). Tests replace it
 * with a fixed date.
 */
export const CLOCK = new InjectionToken<Clock>('CLOCK', {
  providedIn: 'root',
  factory: () => () => new Date(),
});
