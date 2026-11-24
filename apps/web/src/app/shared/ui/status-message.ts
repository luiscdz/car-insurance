import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A controlled state message announced to assistive technologies, with an icon so color is not
 * the only cue; an optional action (retry, link) is projected below it (AC-002, AC-016 to AC-018).
 */
@Component({
  selector: 'app-status-message',
  template: `
    <div role="alert" class="flex flex-col items-center px-4 py-12 text-center">
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 24 24"
        class="mb-3 size-10 text-danger"
      >
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M12 7v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <circle cx="12" cy="17" r="1.3" fill="currentColor" />
      </svg>
      <p class="mb-4 max-w-[40ch] text-lg text-pretty">{{ message() }}</p>
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusMessage {
  readonly message = input.required<string>();
}
