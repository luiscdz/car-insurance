# Implementation plan for CHG-001

Supporting work artifact for the plan stage. It owns no contract, release membership or status: the approved proposal and the CAP-001 snapshot are the authority, and a behavior change goes back to the proposal and a new approval.

## Approved intent, bases and references

| Item | Value |
| --- | --- |
| Change | CHG-001, kind `evolution`, origin US-01 |
| Approved proposal digest | `3c6df305a8fa0075571146e6906deca182c864031e8eb64e24605b7bd6064192` |
| Capability | CAP-001 (new), proposed snapshot `d9a109a9933d4153ee9a5295d15a679e3561ced3e0104bcbf99c35f5fe2120fb` |
| Component | `app` (user-facing) |
| Base | CAP-001 / `app`: none (expected absence) |
| Scope | REQ-001 to REQ-007, AC-001 to AC-035; owner answers Q1 to Q9; N1 to N5 accepted as proposed at approval |
| Architecture decisions | ADR-001 (accepted, pin current) |
| Agreed references | architecture, context, design, engineering, stack, verification, principles, flow |
| Knowledge skill | `country-content` (plan, implement, review) |
| Design reference | prototype `docs/prototypes/us-01/index.html`, sha256 `5b7026e77914d263aa19b7dcc8858ce3328bc4593a16af0585785dfc5aef40f2` (owner-approved checkpoint per the coordinator). Visual and interaction reference only; not production code. |

Excluded by the proposal and not planned here: plan list (US-02) and summary and payment (US-03) rendering and behavior, price and payment endpoints, terms, RUT check-character verification, maximum age, request timeouts, leave confirmation in browsers without the native one.

Owner design decision carried into this plan: help text, placeholders, empty select and date text, and inactive progress items use `--foreground`, not `--muted` (`#888B8D` is 3.4:1 on white, below AA).

## Real repositories and component responsibilities

One repository (`.`), component `app`. Observed state: the scaffold only. `apps/web/src/app` has an empty `routes` array and `App` with a router outlet; `apps/cms/src/api` is empty and `src/index.ts` has empty `register` and `bootstrap`; `packages/shared/src/index.ts` exports nothing; `e2e/tests/fixtures.ts` provides an axe fixture (`expectNoAxeViolations`, WCAG 2.2 AA tags); `e2e/playwright.config.ts` has projects `mobile` (375 px) and `desktop` (1280 px), Chromium only. Installed: Angular 22.3 (Signal Forms public API in `@angular/forms/signals`), `@spartan-ng/brain` 1.10 (alert-dialog, field, label, input, button, checkbox), Zod 4, Strapi 5.63, Playwright 1.65, `@axe-core/playwright`.

### Layers of the solution

**Strapi (`apps/cms`)**: content model, public read permissions and seed (REQ-001, REQ-002, REQ-007).

| Piece | Path | Content |
| --- | --- | --- |
| `Country` collection | `apps/cms/src/api/country/{content-types/country/schema.json,controllers,routes,services}/` | `code` (string, required, unique, regex `^[a-z]{2}$`), `name`, `currency`, `locale`, `theme` (component `country.theme`), `copy` (component `country.wizard-copy`), `steps` (one-to-many `WizardStep`); draft and publish |
| `WizardStep` collection | `apps/cms/src/api/wizard-step/...` | `country` (many-to-one `Country`), `order` (integer), `title`, `slug` (string, regex `^[a-z0-9]+(-[a-z0-9]+)*$`), `type` (enumeration `form`, `plans`, `summary`), `fields` (one-to-many `FormField`); draft and publish |
| `FormField` collection | `apps/cms/src/api/form-field/...` | `step` (many-to-one `WizardStep`), `name` (key, regex), `label`, `type` (enumeration `text`, `number`, `select`, `date`, `checkbox`), `required` (boolean), `placeholder`, `helpText`, `errorMessage`, `order`, `options` (repeatable `form.option`), `validation` (component `form.validation`); draft and publish |
| Components | `apps/cms/src/components/country/theme.json`, `country/wizard-copy.json`, `form/option.json`, `form/validation.json` | theme: `primaryColor`, `accentColor`, `logo` (single image media). wizard copy: `continueLabel`, `backLabel`, `progressLabel` (template with `{current}` and `{total}`), `leaveTitle`, `leaveMessage`, `leaveStayLabel`, `leaveConfirmLabel`. option: `value`, `label`, `order`. validation: `minLength`, `maxLength`, `pattern`, `min`, `max`, `integer`, `minAge`, `yearsBefore`, `yearsAfter` (all optional) |
| Public permissions | `apps/cms/src/bootstrap/public-permissions.ts`, called from `apps/cms/src/index.ts` `bootstrap` | `find` and `findOne` on `api::country.country`, `api::wizard-step.wizard-step`, `api::form-field.form-field`; idempotent; nothing else (P4) |
| Seed | `apps/cms/src/seed/index.ts`, `apps/cms/src/seed/countries.ts` | Runs from `bootstrap` only when no `Country` exists; creates published Colombia and Chile exactly as AC-031 and AC-032 (steps, fields, options, validations, copy, SURA theme without logo), fictitious examples only |
| Generated types | `apps/cms/types/generated/{contentTypes,components}.d.ts` | Regenerated with `npm run types:generate -w apps/cms` and committed |

**Shared (`packages/shared`)**: Zod schemas and inferred types for every boundary (P3). Blocked by open question Q1 (not a profile input).

| File | Content |
| --- | --- |
| `packages/shared/src/content/strapi-envelope.ts` | Collection response envelope `{ data: T[], meta }` |
| `packages/shared/src/content/country.ts` | Country summary (root list), country detail with `wizardCopySchema` (every label required and non-empty, so missing dialog copy is invalid content, AC-034, AC-017) and a separate `themeSchema` (`#RRGGBB` colors; logo with `url` and `alternativeText`) |
| `packages/shared/src/content/form-field.ts` | Field, option and validation schemas: known type, label and error message required, select needs at least one option, `min <= max`, `minLength <= maxLength`, `yearsBefore`/`yearsAfter` non-negative integers, `pattern` compiles as a `RegExp` |
| `packages/shared/src/content/wizard-step.ts` | Step schema with its fields |
| `packages/shared/src/content/wizard-content.ts` | Whole-wizard refinement: ADR-001 sequence (at least one form step, then exactly one `plans`, then exactly one `summary` last), unique step slugs per country, unique field names per step |
| `packages/shared/src/wizard-data.ts` | Session storage schema `{ steps: Record<slug, { values: Record<name, string or boolean>, complete: boolean }> }` |
| `packages/shared/src/index.ts` | Public exports and `z.infer` types |
| `packages/shared/src/**/*.spec.ts` | Valid and invalid fixtures for Colombia and Chile |

**Web (`apps/web/src`)**: country resolution, content client, wizard shell, form step, wizard state, leave confirmation (REQ-001 to REQ-006). Structure as in the architecture reference; file names without type suffixes.

| Path | Role |
| --- | --- |
| `app/app.routes.ts` | `''` → country selection (route `title` = fallback title); `':country'` → wizard shell with an optional `:step` child and a catch-all below it; `canDeactivate: [leaveWizardGuard]` on `':country'` |
| `app/app.config.ts` | `provideRouter(routes, withComponentInputBinding(), withRouterConfig({ canceledNavigationResolution: 'computed' }))`; runtime config initializer; `CONTENT_READER` and `CLOCK` providers |
| `app/core/config/app-config.ts` | Loads and validates `public/config.json` (`cmsUrl`) at startup (open question Q5) |
| `app/core/content/content-reader.ts` | `ContentReader` interface and `CONTENT_READER` `InjectionToken` (dependency inversion) |
| `app/core/content/strapi-content-reader.ts` | HTTP implementation. Requests, always filtered by the route's country code: `GET /api/countries?fields=code,name&sort=name:asc` (root); `GET /api/countries?filters[code][$eq]={code}&populate[theme][populate][logo]=…&populate[copy]=true`; `GET /api/wizard-steps?filters[country][code][$eq]={code}&sort=order:asc&populate[fields][sort][0]=order:asc&populate[fields][sort][1]=createdAt:asc&populate[fields][populate]=*`. Responses typed `unknown` |
| `app/core/content/wizard-content.ts` | Pure `toWizardContent(code, countryJson, stepsJson)` → `{ kind: 'ready', content } \| { kind: 'not-found' } \| { kind: 'invalid' }`: exact code match (AC-002), Zod validation (AC-017), stable sort by `order` then `createdAt` (AC-004) |
| `app/core/content/fallback-copy.ts` | The only front-end copy (Spanish): root heading, page title, loading label, unknown country, unavailable plus retry, not available, back-to-root link, logo text placeholder |
| `app/core/country/theme.ts` | Pure `resolveTheme(unknown)` → country tokens or default; `ThemeService` sets `--primary` and `--accent` on the document root and exposes the logo or placeholder (AC-003) |
| `app/core/clock.ts` | `CLOCK` `InjectionToken` returning the device's current local date, replaceable in tests (AC-013, AC-014) |
| `app/core/wizard-state/wizard-state.ts` | Signals store per country mirrored to `sessionStorage` key `wizard:{code}`; validates stored JSON with the shared schema; the only code touching `sessionStorage` (engineering) |
| `app/core/wizard-state/wizard-data.ts` | Pure `reconcile(stored, content, today)` (AC-025), `isStepComplete`, `firstIncompleteStep` (AC-024) |
| `app/core/wizard-state/unconfirmed-values.ts` | Pure `hasUnconfirmedValues(fields, current, stored)` per N1: trimmed text comparison, checkbox as boolean, missing stored value equals empty (AC-033, AC-034) |
| `app/shared/utils/field-validation/` | Pure rules: `is-empty.ts`, `text-rules.ts`, `number-rules.ts`, `age.ts` (whole years, 29 February reaches the age on 1 March in non-leap years), `year-range.ts`, `validate-field.ts` (all rules, inclusive limits; optional and empty is valid) (AC-012 to AC-014) |
| `app/shared/ui/` | Presentational: `loader.ts` (visible spinner, static under reduced motion, `role="status"` label), `status-message.ts` (announced message with icon and optional action), Spartan helm wrappers for button, label, input, checkbox and alert dialog |
| `app/features/country-selection/country-selection.ts` | Container: countries resource, loading, error and invalid states, list of country links (AC-001) |
| `app/features/country-selection/components/country-list.ts` | Presentational list of links to `/{code}` |
| `app/features/wizard/shell/wizard-shell.ts` | Container: content resource keyed by country code, states (AC-015 to AC-017, AC-002), theme, page title `{step title} – {country name}`, step resolution and `replaceUrl` redirects (AC-024, open question Q3), progress, back link, step body by type, leave confirmation |
| `app/features/wizard/shell/step-registry.ts` | `STEP_COMPONENTS` token: map from step type to component; this change registers only `form` |
| `app/features/wizard/shell/leave-guard.ts` | Functional `CanDeactivateFn<WizardShell>`: asks only when the target URL is outside this country's wizard and the current step has unconfirmed values (AC-034, AC-035) |
| `app/features/wizard/shell/leave-confirmation.ts` | Service scoped to the shell: holds the active step's unconfirmed state and opens the dialog, resolving `true` (leave) or `false` (stay) |
| `app/features/wizard/shell/components/progress-indicator.ts` | `nav` labeled with the progress template, `ol` of step titles, `aria-current="step"` (AC-019) |
| `app/features/wizard/shell/components/leave-dialog.ts` | Spartan alert dialog: copy from Strapi, initial focus on stay, Escape = stay, focus restore, focus contained (AC-034, N3) |
| `app/features/wizard/steps/form-step/form-step.ts` | Container: Signal Forms model `Record<name, string \| boolean>` from stored values, error visibility (touched or submit attempted), `aria-disabled` continue that stays focusable, first-invalid focus, single advance, store confirmation, `(window:beforeunload)` handler (AC-009 to AC-011, AC-019, AC-021, AC-033) |
| `app/features/wizard/steps/form-step/services/field-form.ts` | Builds the Signal Forms schema from the field configuration using the pure rules, one configured message per field |
| `app/features/wizard/steps/form-step/components/dynamic-field.ts` | Presentational field by type: label above, `*` marker hidden from assistive technologies plus `aria-required`, help text and error below, `aria-invalid`, `aria-describedby` (AC-005, AC-006, AC-009, AC-027) |
| `app/features/wizard/steps/form-step/models/field-view.ts` | View model of a rendered field |
| `src/styles.css` | Map `--muted-foreground` to the foreground token (owner decision); reduced-motion rule with no animation or transition (AC-030) |
| `src/index.html` | Page title equal to the fallback title |
| `public/config.json` | Runtime configuration (`cmsUrl`, default `http://localhost:1337`); no secrets (P4) |

**End to end (`e2e`)**: Playwright with axe against the Compose stack and its seed.

| Path | Content |
| --- | --- |
| `e2e/playwright.config.ts` | Keep `mobile` and `desktop`; add a `content-changes` project for AC-007 that depends on both and runs serially |
| `e2e/tests/support/wizard.ts` | Page helpers by accessible role and label, never by country-specific code paths |
| `e2e/tests/support/dates.ts` | Boundary dates and years computed in the browser's local date |
| `e2e/tests/support/strapi-admin.ts` | Test-only Strapi client for AC-007 (open question Q4); credentials from the environment, never sent to the web app |
| `e2e/tests/*.spec.ts` | Specs listed in the verification table; titles include AC IDs |

## Decisions and alternatives

Cited ADR: **ADR-001** (accepted). It fixes option A (Country collection with related content), option a (country code as the first route segment), steps as content with the fixed sequence form+, plans, summary, and Intl formatting. Every decision below is local to CHG-001 and stays inside ADR-001. Decisions that may meet the ADR criterion (affect later changes, costly to reverse or real alternatives with material consequences) are not decided here; they are open questions Q4 to Q7.

| # | Decision | Chosen | Alternatives | Why |
| --- | --- | --- | --- | --- |
| D1 | Step address | Step `slug` from Strapi under the prefix (`/cl/tu-vehiculo`) | Position index (`/cl/2`); step document id | Approved prototype; stable when order changes; readable. Slugs are unique per country (Zod), not globally, so `slug` is a plain string, not a Strapi `uid` (`elige-tu-plan` exists in both countries) |
| D2 | Requests per wizard | Two: country (theme, copy) and steps with populated fields, as in ADR-001's illustrative request | One request from country populating everything; three requests | Matches ADR-001; fields keep their own draft and publish (AC-007) |
| D3 | Field ordering ties | Sort by `order`, then `createdAt`, server side and again client side with a stable sort | Server sort only | AC-004 stable order regardless of the Strapi version's tie behavior |
| D4 | Theme validity | Theme parsed with its own schema; a missing or malformed theme falls back to the default and is never invalid content | Theme inside the country schema | AC-003 requires the wizard to keep working with a bad theme; owner answer Q7 |
| D5 | Logo text placeholder | Part of the default theme in `fallback-copy.ts` | Copy from Strapi | It replaces a missing or invalid theme, so it cannot depend on content |
| D6 | Relative validations in Strapi | Stored as configuration (`minAge`, `yearsBefore`, `yearsAfter`) in `form.validation`, evaluated in the browser at validation time with the device date (owner answer Q9) | Absolute min and max years in Strapi (need yearly edits); custom Strapi field | Strapi schemas cannot express a limit relative to today |
| D7 | Cross-field content rules | Enforced by Zod at load time (AC-017); Strapi only enforces per-attribute rules | Strapi lifecycle hooks rejecting saves | P3 already requires runtime validation; hooks add code without changing behavior. Can be added later |
| D8 | Number control | Text input with `inputmode="numeric"`, value parsed by the rules | `type="number"` | Prototype; avoids wheel changes and locale decimal issues; AC-012 whole-number rule stays testable |
| D9 | Select and date controls | Native `select` with a disabled empty first option; native `input type="date"` | Spartan listbox select; date picker | Prototype; native keyboard and mobile support; no option preselected (AC-006) |
| D10 | Leave dialog component | Spartan alert dialog (brain primitive with CDK focus trap) styled as the prototype | Native `dialog` as in the prototype | Engineering and design require Spartan UI first; prototype layout, copy order and N3 behaviors kept |
| D11 | Leaving the wizard | `canDeactivate` on the `:country` route comparing the target URL's first segment, with `canceledNavigationResolution: 'computed'` so a cancelled back or forward restores history | Manual `popstate` listener | Router-native; covers back from the first step to the root and history moves to the other country (N4) |
| D12 | Unconfirmed values (N1) | Pure comparison of current and stored values, trimmed text, checkbox boolean, absent stored equals empty | Signal Forms `dirty()` | `dirty` stays true after edit-and-restore; N1 says restoring the stored value does not ask |
| D13 | Error visibility (AC-010) | Error shown when the field is touched (blur) or after an advance attempt (`submit` marks all touched) and invalid; hidden as soon as valid | Validate on every keystroke | AC-010 |
| D14 | Date source | `CLOCK` token returning the device's local date | `new Date()` inline | Deterministic unit tests at fixed dates |
| D15 | Non-form step bodies | Shell renders progress, heading and back for every step and the body from `STEP_COMPONENTS`; only `form` is registered in this change | Placeholder components for plans and summary | Owner answer Q3; adds no behavior outside the proposal; US-02 and US-03 register their components without editing the shell (open/closed) |
| D16 | Muted text | `--muted-foreground` mapped to the foreground token in `styles.css`; no component uses `muted` for text | Keep `muted` | Owner decision (AA contrast) |
| D17 | Seed | TypeScript seed module run in `bootstrap` when no `Country` exists, through the Document Service with `status: 'published'` | Strapi data transfer import file | Architecture reference; idempotent; reviewable |

## Contract ownership and compatibility

- CAP-001 is new for `app`; no integrated contract exists, so there is no compatibility constraint with earlier behavior.
- The Strapi content model and the shared schemas introduced here become the contract that US-02 and US-03 extend (plans and terms are not modeled in this change). Plan and terms types are added by those changes; `WizardStep.type` already includes `plans` and `summary` because ADR-001 requires the full sequence.
- Public API surface: read-only `find` and `findOne` on three content types. No custom endpoints in this change.

## Dependencies, migration and recovery

- No dependency on other changes or components.
- No new npm dependency is planned; everything needed is installed. If one becomes necessary, the root `package-lock.json` changes, and it is not a profile input (open question Q1).
- Database: Strapi creates the tables from the committed `schema.json` files on start; no migration files. The seed runs only on an empty database, so an existing `cms-data` volume from the scaffold keeps no content: run `docker compose down -v` once before the end-to-end tests.
- Rollback: revert the commits; drop the volume to remove seeded content. Wizard data lives only in the tab's `sessionStorage`.
- Order: shared schemas → Strapi model and generated types → permissions and seed → web pure logic and store → web content client and shell → form step → leave confirmation → end-to-end tests → verification run and manual observations. Details in `tasks.md`.

## Applicable AC verification

Profile checks: `web-unit` (`npm run test:ci` in `apps/web`: unit and component tests with the 80 % line minimum on `core/` and `shared/utils/`), `web-build`, `cms-build`. The profile has no check for `packages/shared` tests, `apps/cms` tests, lint and format, or the end-to-end suite (open question Q2); the column "Profile check today" shows what Roclec actually executes now. Test titles start with the AC ID.

| AC | Unit or component test (path) | End-to-end test (path) | Manual observation | Profile check today |
| --- | --- | --- | --- | --- |
| AC-001 | `features/country-selection/country-selection.spec.ts` (fallback heading and title, names from content) | `e2e/tests/country-selection.spec.ts` (both offered; each opens its first step; heading and title) | — | web-unit |
| AC-002 | `core/content/wizard-content.spec.ts` (upper-case code, country absent from published response); `wizard-shell.spec.ts` (message, link, no wizard) | `country-selection.spec.ts` (`/xx`, `/xx/a`) | — | web-unit |
| AC-003 | `core/country/theme.spec.ts` (valid, missing, malformed; both countries) | — | Seeded themes of Colombia and Chile at 375 and 1280 px | web-unit |
| AC-004 | `core/content/wizard-content.spec.ts` (order, equal order values; both countries) | `form-step-content.spec.ts` (labels in order for `/co` and `/cl`) | — | web-unit |
| AC-005 | `form-step/components/dynamic-field.spec.ts` (five types, required and optional, with and without help) | — | — | web-unit |
| AC-006 | `dynamic-field.spec.ts` (options in order, none chosen) | `form-step-content.spec.ts` (Colombian document type; makes of both countries) | — | web-unit |
| AC-007 | — (behavior needs real Strapi) | `content-changes.spec.ts` (add, reorder, unpublish; draft never shown) | — | none (Q2, Q4) |
| AC-008 | `wizard-shell.spec.ts`, `form-step.spec.ts`, `leave-dialog.spec.ts` with fixtures of different copy per country | — | — | web-unit |
| AC-009 | `dynamic-field.spec.ts`, `form-step.spec.ts` (message below, icon, `aria-invalid`, `aria-describedby`) | `form-step-validation.spec.ts` (both countries) | — | web-unit |
| AC-010 | `form-step.spec.ts` (untouched, blur, advance attempt, becomes valid) | — | — | web-unit |
| AC-011 | `form-step.spec.ts` (`aria-disabled`, focusable, stays, all errors, focus first invalid) | `form-step-validation.spec.ts` (both countries) | — | web-unit |
| AC-012 | `shared/utils/field-validation/*.spec.ts` (each rule at, below and above limits; empty optional) | — | — | web-unit |
| AC-013 | `year-range.spec.ts`, `validate-field.spec.ts` with fixed clock (Y−21, Y−20, Y+1, Y+2, decimal) | `form-step-validation.spec.ts` (one accepted and one rejected boundary per country) | — | web-unit |
| AC-014 | `age.spec.ts` with fixed clock (birthday, day before, future, 29 February) | `form-step-validation.spec.ts` (per country) | — | web-unit |
| AC-015 | `shared/ui/loader.spec.ts`, `wizard-shell.spec.ts`, `country-selection.spec.ts` (visible loader, status label, no form, reduced-motion class) | — | — | web-unit |
| AC-016 | `wizard-shell.spec.ts`, `country-selection.spec.ts` (HTTP error, retry, stored data kept) | `content-states.spec.ts` (Strapi requests aborted, then retry) | — | web-unit |
| AC-017 | `packages/shared/src/content/*.spec.ts` (valid and invalid fixtures, both countries); `wizard-shell.spec.ts` (message) | — | — | web-unit (component part only; schema tests need Q2) |
| AC-018 | `form-step.spec.ts` or `wizard-shell.spec.ts` (form step without fields: message, cannot advance) | — | — | web-unit |
| AC-019 | `wizard-shell.spec.ts` (next step URL, heading focus, progress); `progress-indicator.spec.ts` | `wizard-navigation.spec.ts` (Chile "Tus datos" → "Tu vehículo"; Colombia leaves its form step) | — | web-unit |
| AC-020 | `core/wizard-state/wizard-state.spec.ts` (both countries) | `wizard-navigation.spec.ts` (Chile, back action and browser back) | — | web-unit |
| AC-021 | `form-step.spec.ts` (double activation advances once) | — | — | web-unit |
| AC-022 | — | `wizard-navigation.spec.ts` (reload keeps step and completed values; confirmation accepted drops unconfirmed) | — | none (Q2) |
| AC-023 | `wizard-state.spec.ts` (keys per country) | `wizard-navigation.spec.ts` (co then cl in one tab; new tab empty) | — | web-unit (partial) |
| AC-024 | `core/wizard-state/wizard-data.spec.ts` (`firstIncompleteStep`); `wizard-shell.spec.ts` (redirect with `replaceUrl`) | `wizard-navigation.spec.ts` (direct later step; unknown step) | — | web-unit |
| AC-025 | `wizard-data.spec.ts` (`reconcile`, both countries) | — | — | web-unit |
| AC-026 | — | `privacy.spec.ts` (address, request URLs and bodies, console; both countries) | — | none (Q2) |
| AC-027 | `dynamic-field.spec.ts` (label, description, required) | `accessibility.spec.ts` (axe: both countries, with and without errors, dialog open) | — | web-unit (partial) |
| AC-028 | — | — | Keyboard-only completion, Colombia and Chile, including the dialog | none (manual observation) |
| AC-029 | — | `accessibility.spec.ts` (no horizontal overflow at 320 and 375 px; targets ≥ 24 px) | 375 and 1280 px | none (Q2) plus manual |
| AC-030 | `loader.spec.ts` (reduced-motion variant) | — | Reduced motion: step change, errors, loader, dialog | none (manual observation) |
| AC-031 | Seed shape check against shared schemas: `apps/cms/src/seed/seed.test.ts` | `form-step-content.spec.ts` (Colombia steps, fields, options, formats in either case) | — | none (Q2) |
| AC-032 | `apps/cms/src/seed/seed.test.ts` | `form-step-content.spec.ts` (Chile, including `K` in either case) | — | none (Q2) |
| AC-033 | `unconfirmed-values.spec.ts`; `form-step.spec.ts` (`beforeunload` default prevented only with unconfirmed values) | `leave-confirmation.spec.ts` (reload and close, with and without values, stay and leave; both countries; Chromium) | — | web-unit |
| AC-034 | `leave-dialog.spec.ts` (copy, initial focus, Escape, focus restore, containment); `leave-guard.spec.ts` | `leave-confirmation.spec.ts` (back to root from the first step; history to the other country; stay, Escape, leave; no dialog without values) | — | web-unit |
| AC-035 | `leave-guard.spec.ts` (same-country target never asks) | `wizard-navigation.spec.ts` (Chile "Tu vehículo", both back mechanisms) | — | web-unit |

No AC lacks a planned meaningful verification. ACs whose only automated verification is end to end (AC-007, AC-022, AC-026, AC-029 partially, AC-031, AC-032) and the schema half of AC-017 are not executed by any current profile check (Q2). AC-028 and AC-030 are declared manual checks, recorded as observations with their AC IDs; AC-003 and AC-029 also have a manual part. A check pass does not establish semantic sufficiency: the reviewer still judges whether each test exercises its AC.

## Risks

| ID | Risk | Mitigation |
| --- | --- | --- |
| R1 | Playwright and the native `beforeunload` dialog: Chromium shows it only after real user activation; `page.reload()` waits on the dialog and may time out when the person stays; closing needs `page.close({ runBeforeUnload: true })`; no WebKit project (N5) | Type with real clicks and key presses; handle `page.once('dialog')` before acting, assert `dialog.type() === 'beforeunload'`; trigger reload without awaiting navigation when staying; run in Chromium only, as N5 accepts |
| R2 | `canDeactivate` with browser back and forward: a cancelled `popstate` navigation can desynchronize history | `canceledNavigationResolution: 'computed'`; end-to-end test of stay then repeated back; guard compares target country only |
| R3 | Strapi 5 cannot express relative-year or minimum-age rules, nor cross-field rules (`min <= max`) | D6 and D7: configuration values plus Zod at load; invalid content shows AC-017's message |
| R4 | Strapi 5 populate and status: a draft-only field must not appear through the populated relation; `createdAt` tie order after republishing | Verify with `strapi-docs-mcp` during implementation; AC-007 end-to-end test covers drafts; D3 client-side stable sort |
| R5 | Populating the theme logo (media) for the public role may need an upload-plugin permission the architecture reference does not list | Seed has no logo; confirm with `strapi-docs-mcp`; if a permission is needed, it requires updating the architecture reference first (open question Q8) |
| R6 | Signal Forms over a `Record<string, …>` model with keys known only at runtime (index-signature paths under `noPropertyAccessFromIndexSignature` and `noUncheckedIndexedAccess`) | Prototype the schema builder first in T011; fallback: one `form()` per field inside the form step |
| R7 | Spartan CLI writes `components.json` at `apps/web/`, outside the profile inputs | Write the helm wrappers by hand under `shared/ui/` or delete the generated config file |
| R8 | AC-007 mutates seeded content shared by parallel tests | Separate serial `content-changes` project that depends on `mobile` and `desktop`; mutate an added optional field; restore in `afterAll` |
| R9 | Profile inputs and checks do not match the planned paths and the verification reference | Open questions Q1 and Q2 before implementation |
| R10 | Date-dependent tests around midnight or across time zones | `CLOCK` token in unit tests; end-to-end boundaries computed inside the browser |
| R11 | Stale `cms-data` volume means no seed | `docker compose down -v` before end-to-end runs; documented in tasks |
| R12 | Development-mode logs could print entered values (AC-026) | No logging of form values; end-to-end console observation against the production build served by Compose |

## Owner answers (2026-11-23)

The owner accepted the proposed answer of every question below (Q1 to Q9). Q1 and Q2 are applied in `.roclec/project.toml`: `packages/shared` sources and configuration and the root `package-lock.json` are `app` inputs (`packages/shared/dist/**` is generated), and the profile adds the checks `format`, `lint`, `shared-unit`, `cms-unit` and `e2e`, with `acceptance_ids` for `shared-unit`, `web-unit`, `cms-unit` and `e2e` taken from the table above. Q4, Q5 and Q6 stay local decisions of this change; no ADR is raised. Q9 is a follow-up for the design reference at foundation.

## Open material decisions (answered)

Returned to the coordinator; none is decided in this plan. Each has a proposed answer.

- **Q1. `packages/shared` and the root lockfile are not profile inputs.** `app` inputs omit `packages/shared/**` and `package-lock.json`, while the architecture, engineering, stack and `country-content` skill (step 3) require the Zod schemas there, and the implement stage lists `packages/shared` as a deliverable. Impact: T001 and every AC relying on content validation (AC-002, AC-004, AC-017, AC-023, AC-025, AC-031, AC-032); candidate digests would not cover the schemas. Proposed: the owner adds `packages/shared/**` (excluding `dist`) and the root `package-lock.json` to `app` inputs in `.roclec/project.toml` before implementation.
- **Q2. Profile checks are a subset of the verification reference.** The reference requires lint and format, unit tests of every package with the coverage minimum, both builds, and end-to-end and accessibility tests; the profile runs only `web-unit`, `web-build`, `cms-build`, with no `acceptance_ids`. Impact: AC-007, AC-022, AC-026, AC-029, AC-031, AC-032 and the schema half of AC-017 are not executed by Roclec. Proposed: add checks `shared-unit` (`npm run test:ci`, cwd `packages/shared`), `cms-unit` (`npm run test:ci`, cwd `apps/cms`), `lint` and `format` (root), and `e2e` (a command that runs `docker compose down -v`, `docker compose up -d --build --wait` and `npm run test:e2e`), each with the `acceptance_ids` of the table above. Alternative: import the Playwright results as `automated-import` evidence per run.
- **Q3. Opening `/{code}` with stored data.** AC-001 says choosing a country "opens the first step … at `/{code}`" and AC-023 says "returning to `/co` shows the Colombian values again"; the prototype instead redirects `/{code}` to the first step that is not complete. Impact: AC-001, AC-023, AC-024. Proposed: follow the approved ACs: `/{code}` without a step opens the first step (URL replaced by its slug) with stored values; AC-024's redirect applies only to a later or unknown step address. If the owner prefers the prototype, the proposal must be revised.
- **Q4. Test-only Strapi credential for AC-007 (may meet the ADR criterion: security, P4, reused by later end-to-end tests).** Strapi generates API token keys randomly, so none can be preset; unpublishing needs the admin content-manager API. Proposed: the end-to-end setup reads fictitious admin credentials from environment variables, registers the first admin on a fresh stack (or logs in), and uses the admin API only from Node; no CMS code, nothing reaches the browser. Alternative: a bootstrap that provisions a custom API token only when an environment variable is set.
- **Q5. How the browser learns Strapi's URL (may meet the ADR criterion: deployment of every change).** Proposed: runtime `apps/web/public/config.json` (`cmsUrl`, default `http://localhost:1337`) loaded and validated at startup, keeping one build. Alternatives: build-time constant; same-origin proxy in `apps/web/nginx.conf` (not a profile input).
- **Q6. Content model shape reused by US-02 and US-03 (may meet the ADR criterion).** ADR-001 leaves exact types and fields to the architecture reference and the specs; this plan adds the step `slug`, wizard copy and theme as components on `Country`, and validations as a component on `FormField`. Proposed: no new ADR; the shape is recorded here, and the architecture reference may later list it.
- **Q7. Generated Strapi types versus Zod-inferred types.** The stack reference says the front end uses the generated types instead of hand-written copies; the generated `.d.ts` files depend on Strapi's type packages. Proposed: the front end uses `z.infer` types from `packages/shared`; the generated types are committed in `apps/cms/types/generated/`, and a type-level test in `apps/cms` asserts the shared schema keys match the generated attributes.
- **Q8. Logo media permission.** If populating `theme.logo` requires an upload-plugin permission for the public role, the architecture reference must list it first (engineering). Proposed: keep `logo` as Strapi media; confirm during T002 with `strapi-docs-mcp`; if a permission is required, raise the reference update before adding it.
- **Q9. Design reference and the `muted` token.** `docs/design.md` still assigns `muted` to secondary text; the owner decided `foreground` for help text, placeholders and inactive progress. Proposed: no blocker; record a follow-up to update the design reference through `foundation agree`.
- **Note.** `inspect --change CHG-001` shows the design stage as `n/a` with no prototype pinned in the change; the prototype checkpoint is not bound to this change's implement gate.
