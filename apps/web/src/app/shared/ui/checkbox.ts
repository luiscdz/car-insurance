import { Directive } from '@angular/core';

/** Spartan UI style checkbox: a native checkbox of 24 × 24 px in the primary color (AC-029). */
@Directive({
  selector: 'input[type=checkbox][appCheckbox]',
  host: {
    class:
      'm-0 size-6 flex-none cursor-pointer accent-primary focus-visible:outline-3 ' +
      'focus-visible:outline-offset-2 focus-visible:outline-primary-strong',
  },
})
export class Checkbox {}
