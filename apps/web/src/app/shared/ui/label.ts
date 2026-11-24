import { Directive } from '@angular/core';

/** Spartan UI style field label: above the control, 14 px, semibold, in the primary color. */
@Directive({
  selector: 'label[appLabel]',
  host: { class: 'text-sm font-semibold text-primary' },
})
export class Label {}
