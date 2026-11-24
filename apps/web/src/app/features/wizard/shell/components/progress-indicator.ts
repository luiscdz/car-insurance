import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface ProgressStep {
  readonly key: string;
  readonly title: string;
  readonly complete: boolean;
}

/**
 * Lists every step of the country in configured order with its title and marks the current one
 * (AC-019). The label template comes from Strapi with `{current}` and `{total}` (AC-008).
 */
@Component({
  selector: 'app-progress-indicator',
  template: `
    <nav class="mb-8" [attr.aria-label]="label()">
      <p class="mb-2 text-sm font-semibold text-primary-strong" aria-hidden="true">{{ label() }}</p>
      <ol class="m-0 flex list-none flex-wrap gap-2 p-0">
        @for (step of steps(); track step.key; let index = $index) {
          <li
            class="flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-sm"
            [class]="
              index === current()
                ? 'bg-surface-info font-bold text-primary-strong'
                : 'bg-surface-muted text-foreground'
            "
            [attr.aria-current]="index === current() ? 'step' : null"
          >
            <span
              aria-hidden="true"
              class="inline-grid size-6 place-items-center rounded-full border text-[13px] font-bold tabular-nums"
              [class]="
                index === current()
                  ? 'border-primary bg-primary text-primary-foreground'
                  : step.complete
                    ? 'border-primary bg-background text-primary'
                    : 'border-border bg-background'
              "
              >{{ index + 1 }}</span
            >
            {{ step.title }}
          </li>
        }
      </ol>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressIndicator {
  readonly steps = input.required<readonly ProgressStep[]>();
  /** Index of the current step. */
  readonly current = input.required<number>();
  readonly labelTemplate = input.required<string>();

  protected readonly label = computed(() =>
    this.labelTemplate()
      .replaceAll('{current}', String(this.current() + 1))
      .replaceAll('{total}', String(this.steps().length)),
  );
}
