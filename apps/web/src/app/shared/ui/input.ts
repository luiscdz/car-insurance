import { Directive } from '@angular/core';

/** Spartan UI style text control (input or select): 48 px high, 12 px radius, 1 px border. */
@Directive({
  selector: 'input[appInput], select[appInput]',
  host: {
    class:
      'block min-h-12 w-full min-w-0 appearance-none rounded-md border border-border bg-background ' +
      'px-3.5 py-2.5 font-semibold text-primary-strong placeholder:font-normal ' +
      'placeholder:text-foreground placeholder:opacity-100 hover:border-primary ' +
      'focus-visible:border-primary focus-visible:outline-3 focus-visible:outline-offset-1 ' +
      'focus-visible:outline-primary-strong aria-invalid:border-2 aria-invalid:border-danger ' +
      'aria-invalid:px-[13px] aria-invalid:py-[9px] data-empty:font-normal data-empty:text-foreground',
  },
})
export class Input {}
