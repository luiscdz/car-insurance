import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type DestroyRef,
  type ElementRef,
  type Type,
  afterRenderEffect,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  resource,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, PRIMARY_OUTLET, Router, RouterLink } from '@angular/router';
import type {
  FieldValue,
  StoredStep,
  WizardContent,
  WizardCopy,
  WizardStep,
} from '@car-insurance/shared';
import { filter, map } from 'rxjs';
import { CLOCK } from '../../../core/clock';
import { CONTENT_READER } from '../../../core/content/content-reader';
import { FALLBACK_COPY } from '../../../core/content/fallback-copy';
import { toWizardContent } from '../../../core/content/wizard-content';
import {
  DEFAULT_THEME,
  type ResolvedTheme,
  ThemeService,
  resolveTheme,
} from '../../../core/country/theme';
import { isStepComplete, resolveStep } from '../../../core/wizard-state/wizard-data';
import { WizardStateStore } from '../../../core/wizard-state/wizard-state';
import { Button } from '../../../shared/ui/button';
import { Loader } from '../../../shared/ui/loader';
import { StatusMessage } from '../../../shared/ui/status-message';
import { type ProgressStep, ProgressIndicator } from './components/progress-indicator';
import { LeaveConfirmation } from './leave-confirmation';
import type { LeaveAware } from './leave-guard';
import { STEP_CONTEXT, STEP_HEADING_ID, type StepContext } from './step-context';
import { STEP_COMPONENTS } from './step-registry';

interface LoadedWizard {
  readonly content: WizardContent;
  readonly theme: ResolvedTheme;
}

type LoadResult =
  | { readonly kind: 'ready'; readonly wizard: LoadedWizard }
  | { readonly kind: 'not-found' | 'invalid' };

type ShellState = 'loading' | 'unavailable' | 'not-found' | 'invalid' | 'ready';

interface RenderedStep {
  readonly key: string;
  readonly component: Type<unknown>;
  readonly inputs: { readonly step: WizardStep };
}

/** Copy used only while no country content is loaded; no step is rendered then. */
const NO_COPY: WizardCopy = {
  continueLabel: '',
  backLabel: '',
  progressLabel: '',
  leaveTitle: '',
  leaveMessage: '',
  leaveStayLabel: '',
  leaveConfirmLabel: '',
};

function addressSegments(router: Router, url: string): string[] {
  return (router.parseUrl(url).root.children[PRIMARY_OUTLET]?.segments ?? []).map((s) => s.path);
}

/**
 * The wizard of the country in the first address segment (ADR-001). It loads and validates the
 * country's content, applies its theme, resolves the step from the address, shows the progress
 * and the step component registered for the step type, and asks before unconfirmed values are
 * lost when leaving the wizard (REQ-001 to REQ-005). Plans load with the rest of the content, so
 * their loading, failure and invalid states are the wizard's (AC-059).
 */
@Component({
  selector: 'app-wizard-shell',
  imports: [Button, Loader, NgComponentOutlet, ProgressIndicator, RouterLink, StatusMessage],
  providers: [
    LeaveConfirmation,
    { provide: STEP_CONTEXT, useExisting: forwardRef(() => WizardShell) },
  ],
  templateUrl: './wizard-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardShell implements StepContext, LeaveAware {
  /** Country code from the first address segment. */
  readonly country = input.required<string>();

  private readonly reader = inject(CONTENT_READER);
  private readonly store = inject(WizardStateStore);
  private readonly router = inject(Router);
  private readonly clock = inject(CLOCK);
  private readonly leave = inject(LeaveConfirmation);
  private readonly stepComponents = inject(STEP_COMPONENTS);
  protected readonly fallback = FALLBACK_COPY;
  protected readonly headingId = STEP_HEADING_ID;

  private readonly loaded = resource({
    params: () => this.country(),
    loader: ({ params }) => this.load(params),
  });

  protected readonly state = computed<ShellState>(() => {
    if (this.loaded.isLoading()) {
      return 'loading';
    }
    if (this.loaded.error()) {
      return 'unavailable';
    }
    return this.loaded.value()?.kind ?? 'loading';
  });

  protected readonly wizard = computed<LoadedWizard | null>(() => {
    const result = this.state() === 'ready' ? this.loaded.value() : undefined;
    return result?.kind === 'ready' ? result.wizard : null;
  });

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Step slug of the address: `null` for `/{code}`, an impossible slug for deeper addresses. */
  private readonly requestedSlug = computed(() => {
    const segments = addressSegments(this.router, this.url());
    if (segments.length > 2) {
      return '';
    }
    return segments[1] ?? null;
  });

  private readonly resolution = computed(() => {
    const wizard = this.wizard();
    if (!wizard) {
      return null;
    }
    const { country, steps } = wizard.content;
    return resolveStep(steps, this.store.data(country.code), this.requestedSlug());
  });

  protected readonly currentIndex = computed(() => this.resolution()?.index ?? 0);

  protected readonly currentStep = computed(() => {
    const index = this.resolution()?.index;
    return index === undefined ? null : (this.wizard()?.content.steps[index] ?? null);
  });

  protected readonly progressSteps = computed<readonly ProgressStep[]>(() => {
    const wizard = this.wizard();
    if (!wizard) {
      return [];
    }
    const data = this.store.data(wizard.content.country.code);
    return wizard.content.steps.map((step) => ({
      key: step.slug,
      title: step.title,
      complete: isStepComplete(data, step),
    }));
  });

  protected readonly renderedSteps = computed<readonly RenderedStep[]>(() => {
    const wizard = this.wizard();
    const step = this.currentStep();
    const component = step ? this.stepComponents[step.type] : undefined;
    if (!wizard || !step || !component) {
      return [];
    }
    return [{ key: `${wizard.content.country.code}/${step.slug}`, component, inputs: { step } }];
  });

  readonly copy = computed(() => this.wizard()?.content.country.copy ?? NO_COPY);

  readonly content = computed<WizardContent | null>(() => this.wizard()?.content ?? null);

  readonly previousStepLink = computed<readonly string[] | null>(() => {
    const wizard = this.wizard();
    const index = this.resolution()?.index ?? 0;
    const previous = index > 0 ? wizard?.content.steps[index - 1] : undefined;
    return wizard && previous ? ['/', wizard.content.country.code, previous.slug] : null;
  });

  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly stepKey = computed(() => this.renderedKey());
  private lastStepKey: string | null = null;

  constructor() {
    const theme = inject(ThemeService);
    const title = inject(Title);

    effect(() => theme.apply(this.wizard()?.theme ?? DEFAULT_THEME));

    effect(() => {
      const step = this.currentStep();
      const name = this.wizard()?.content.country.name;
      title.setTitle(step && name ? `${step.title} – ${name}` : FALLBACK_COPY.pageTitle);
    });

    // The address shows the resolved step; redirects replace history entries (AC-024).
    effect(() => {
      const resolution = this.resolution();
      const wizard = this.wizard();
      const step = this.currentStep();
      if (resolution?.redirect && wizard && step) {
        untracked(
          () =>
            void this.router.navigate(['/', wizard.content.country.code, step.slug], {
              replaceUrl: true,
            }),
        );
      }
    });

    // When the step changes, focus moves to the new step's heading (AC-019).
    afterRenderEffect(() => {
      const key = this.stepKey();
      const heading = this.heading();
      if (key === null || !heading) {
        return;
      }
      if (this.lastStepKey !== null && this.lastStepKey !== key) {
        heading.nativeElement.focus();
      }
      this.lastStepKey = key;
    });
  }

  storedStep(slug: string): StoredStep | undefined {
    const wizard = this.wizard();
    return wizard ? this.store.data(wizard.content.country.code).steps[slug] : undefined;
  }

  confirm(slug: string, values: Readonly<Record<string, FieldValue>>): void {
    const wizard = this.wizard();
    if (!wizard) {
      return;
    }
    this.store.confirmStep(wizard.content.country.code, slug, values);
    this.advance(slug);
  }

  advance(slug: string): void {
    const wizard = this.wizard();
    if (!wizard) {
      return;
    }
    const { country, steps } = wizard.content;
    const next = steps[steps.findIndex((step) => step.slug === slug) + 1];
    if (next) {
      void this.router.navigate(['/', country.code, next.slug]);
    }
  }

  trackUnconfirmed(check: () => boolean, destroyRef: DestroyRef): void {
    this.leave.track(check, destroyRef);
  }

  /**
   * Leaving for the root address or another country's wizard asks first when the current step
   * has unconfirmed values (AC-034); moves within the same wizard never ask (AC-035).
   */
  canLeave(targetUrl: string): boolean | Promise<boolean> {
    const target = addressSegments(this.router, targetUrl)[0] ?? null;
    const wizard = this.wizard();
    if (target === this.country() || !wizard || !this.leave.hasUnconfirmedValues()) {
      return true;
    }
    return this.leave.ask(wizard.content.country.copy);
  }

  protected retry(): void {
    this.loaded.reload();
  }

  private renderedKey(): string | null {
    const wizard = this.wizard();
    const step = this.currentStep();
    return wizard && step ? `${wizard.content.country.code}/${step.slug}` : null;
  }

  private async load(code: string): Promise<LoadResult> {
    const raw = await this.reader.readWizard(code);
    const result = toWizardContent(code, raw.country, raw.steps, raw.plans);
    if (result.kind !== 'ready') {
      return result;
    }
    const { content } = result;
    this.store.load(code, content, this.clock());
    const theme = resolveTheme(content.country.theme, raw.mediaBaseUrl, content.country.name);
    return { kind: 'ready', wizard: { content, theme } };
  }
}
