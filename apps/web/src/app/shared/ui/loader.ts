import { ChangeDetectionStrategy, Component, afterNextRender, input, signal } from '@angular/core';

/**
 * Visible loader with a label announced as a status (AC-015). The spinner only turns when the
 * person's system allows motion; with reduced motion it stays visible and still (AC-030).
 */
@Component({
  selector: 'app-loader',
  template: `
    <div class="flex flex-col items-center px-4 py-12" data-testid="loader">
      <span
        aria-hidden="true"
        class="block size-10 rounded-full border-4 border-surface-info border-t-primary motion-safe:animate-spin"
      ></span>
    </div>
    <p role="status" class="sr-only">{{ announced() }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Loader {
  readonly label = input.required<string>();

  /** Filled after the first render so the live region announces it. */
  protected readonly announced = signal('');

  constructor() {
    afterNextRender(() => this.announced.set(this.label()));
  }
}
