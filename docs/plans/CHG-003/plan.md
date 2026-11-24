# Implementation plan for CHG-003

Supporting work artifact for the plan stage. It owns no contract, release membership or status. The approved proposal and the CAP-003 and CAP-002 snapshots are the authority. A behavior change goes back to the proposal and a new approval.

## Approved intent, bases and references

| Item | Value |
| --- | --- |
| Change | CHG-003, kind `evolution`, origin US-03 |
| Approved proposal digest | `7accb35a366cb95f381d78714ee8a0db6096052ee5bd44abeb19c19348b66615` (approval current) |
| Capabilities | CAP-003 (new), proposed snapshot `f5362186c534c567b96ed8755910b794ad6d13bc76a738ce6ce9acecd79f80b3`; CAP-002 (revised REQ-009), proposed snapshot `f29abb81f63df4683cf63f9bdb62da57d2b93b092b57e0fa2ccada61e64aeb42` |
| Component | `app` (user-facing) |
| Bases | CAP-002 / `app` at `c8a973e708d69f46246a2ca995ddbfd53b1843b7b0c7925b1d2cfae054b35a36` (integrated by CHG-002); CAP-003 / `app`: none (expected absence) |
| Dependencies | CAP-001 / `app` at `d9a109a9…` (CHG-001) and CAP-002 / `app` at `c8a973e7…` (CHG-002), both integrated |
| Scope | CAP-003 REQ-014 to REQ-020, AC-067 to AC-096; CAP-002 REQ-009 revised: AC-066 retired, AC-097 added; owner answers Q1 to Q16 and N1 to N3 of the proposal |
| Architecture decisions | ADR-001 (accepted, pin current) |
| Agreed references | architecture, context, design, engineering, stack, verification, principles, flow |
| Knowledge skill | `country-content` (plan, implement, review), pinned in the approval (`6076186f…`) |
| Design reference | Prototype `docs/prototypes/us-03/index.html`, sha256 `ff47822df072927f65657ad80e48e0b50037ec53161c924498bdbb15a85c730e` (owner-approved in `f51a3c0`). It is an interaction and visual reference only, not production code. Where it differs from an AC, the AC wins. Known differences: the plan list intro text (`intro`) is not built (CHG-002 plan Q1). The prototype's payment request key `planId` becomes `plan`, matching the price-quote request. The progress indicator on the confirmation keeps `aria-current` (D17). |
| Release | Owner answer Q16: "US-01 to US-03 are released together". CHG-003 is therefore expected to join planning release `v0.1.0` of `app`, which today holds CHG-001 and CHG-002 (`inspect --release v0.1.0 --component app`: status `planning`). The coordinator and owner still have to assign it on `main`. This plan does not run `release plan`. |

The proposal excludes the following, and this plan does not cover them: real payments, gateways and card data; storing quotes, payments, quote numbers or acceptances outside the tab's session storage; email or receipts; guaranteed quote number uniqueness; RUT check character verification; masking outside the summary step and the confirmation; any masking setting in Strapi; terms versioning, rich text or links; acceptance timestamps; coverages, benefits or base price on the summary; a shortcut from an edited form step back to the summary; a native leave confirmation in browsers without one (Safari on iOS); request timeouts beyond the browser's own.

## Real repositories and component responsibilities

There is one repository (`.`) with one component, `app`. Observed state at `108432b` (CHG-001 and CHG-002 integrated):

- `packages/shared/src`:
  - `content/country.ts`: `countryDetailSchema` with `copy` (`wizardCopySchema`) and `planCopy` (`planCopySchema`, twelve texts).
  - `content/form-field.ts`: `FIELD_TYPES`, `PRICING_INPUTS` and `PRICING_INPUT_FIELD_TYPES`. The `formFieldSchema` type rule rejects a mark on the wrong field type, and its transform sets `pricingInput: null` when absent.
  - `content/wizard-content.ts`: `wizardContentSchema = { country, steps, plans }` with the sequence rule `form+, plans, summary`, plus the currency and "at most one field per mark" refinements.
  - `content/plan.ts`, `content/primitives.ts` (`nonBlankTextSchema`, `currencyCodeSchema`) and `content/order.ts`.
  - `quote.ts`: strict `priceQuoteRequestSchema`, `finalPriceSchema` and `priceQuoteResponseSchema`.
  - `wizard-data.ts`: `{ steps, plan? }`, with `storedPlanSchema = { id, finalPrice | null }`.
  - `index.ts` and `test-fixtures.ts`.
- `apps/cms/src`:
  - Collections `country`, `wizard-step`, `form-field` (with `pricingInput` enum) and `plan`.
  - Components `country.{theme,wizard-copy,plan-copy}`, `form.{option,validation}` and `plan.{coverage,benefit}`.
  - `api/quote`: `routes/quote.ts` (`POST /quote/price`, `api::quote.quote.price`); a thin `controllers/quote.ts` with generic 400/404 bodies; `services/quote.ts`, which reads the published, active plan of the country with `strapi.documents('api::plan.plan').findFirst`, writes nothing and does not log; and `services/price-rule.ts`. Each file has tests that use a fake Strapi with a spy logger.
  - `bootstrap/public-permissions.ts`: `PUBLIC_READ_CONTENT_TYPES` (four types), `PUBLIC_ENDPOINT_ACTIONS = ['api::quote.quote.price']`, an idempotent `restrictPublicRole` and `disableSelfRegistration`.
  - `seed/countries.ts`: `COLOMBIA` and `CHILE`, with `numero-documento` and `rut` as `text` fields and no field kind yet. The `summary` step `resumen-y-pago` is seeded in both. `seed/index.ts` holds `seedWhenEmpty`, which creates published countries, steps, fields and plans.
  - Conformance tests in `content-model.test.ts` and `content-model.test-d.ts`. The `vitest.config.ts` coverage minimum applies to `src/api/quote/services/**`.
- `apps/web/src/app`:
  - `core/content`: `StrapiContentReader.readWizard` sends three parallel requests (country with `copy` and `planCopy`, steps and plans), and `toWizardContent(code, country, steps, plans)` builds the result.
  - `core/quote`: `PRICE_QUOTE` / `StrapiPriceQuote` and `pricingInputs`.
  - `core/wizard-state`:
    - `wizard-data.ts`: `reconcile`, `isStepComplete` (`summary` is never complete), `resolveStep`, `withChosenPlan`, `withFinalPrice` and `withoutFinalPrice`. All of them go through `withPlan`, which today rebuilds `{ steps, plan }` and would drop any other key.
    - `wizard-state.ts`: `WizardStateStore`, mirrored to `sessionStorage` under `wizard:{code}`.
  - `core/clock.ts`.
  - `features/wizard/shell`:
    - `WizardShell`: loads with `resource`, redirects with `replaceUrl`, renders the `STEP_COMPONENTS[step.type]` component, and focuses the `h1` heading (`STEP_HEADING_ID`) when the step key changes. `canLeave(targetUrl)` asks only when the target is another country or the root, and only when there are unconfirmed values.
    - `step-context.ts`: `copy`, `content`, `previousStepLink`, `storedStep`, `confirm`, `advance` and `trackUnconfirmed`.
    - `step-registry.ts`: `form` and `plans`. `summary` has no component yet, so the shell shows the heading, the progress and the back link.
    - `leave-confirmation.ts`: `ask(copy: WizardCopy)` with a Spartan `BrnDialogService` dialog of role `alertdialog` and a deduplicated pending promise.
    - `components/leave-dialog.ts` (context `{ copy: WizardCopy }`) and `components/progress-indicator.ts`.
  - `app.routes.ts`: `:country` with `canDeactivate: [leaveWizardGuard]` and componentless children `''`, `:step` and `**`. `withRouterConfig({ canceledNavigationResolution: 'computed' })`.
  - Steps: `form-step` (`window:beforeunload` handler) and `plan-list` (container, `plan-card` and `plan-view`).
  - `shared/ui`: `button` (variants, `aria-disabled` style), `checkbox` (24 px native), `loader` and `status-message`.
  - `shared/utils`: `format-price.ts` and `field-validation/` (`age.ts` with `parseIsoDate`; `is-empty.ts`, where an unchecked checkbox counts as empty).
  - Testing: `testing/content-fixtures.ts` and `fake-step-context.ts`.
  - Unit coverage minimum of 80 % lines on `core/**` and `shared/utils/**` (`angular.json`).
- `e2e`:
  - Projects: `mobile` (375 px) and `desktop` (1280 px); `content-changes` (serial, AC-007), which depends on both; `plan-changes` (serial), which depends on `content-changes`.
  - `tests/support`: `global-setup.ts` (shared test-only admin), `strapi-admin.ts` (model-generic create, publish, unpublish and delete), `wizard.ts`, `dates.ts` and `layout.ts`.
  - `tests/fixtures.ts`: axe with WCAG 2.2 AA.
  - Specs per AC. `privacy.spec.ts`, `public-access.spec.ts`, `apps/cms/src/bootstrap/public-permissions.test.ts` and `apps/web/src/app/core/quote/strapi-price-quote.spec.ts` still carry AC-066 in titles and comments.

### Layers of the solution

**Shared (`packages/shared`)** holds the contract of every new boundary (P3).

| File | Content | REQ / AC |
| --- | --- | --- |
| `src/content/country.ts` | `summaryCopySchema` with the 24 required, non-blank texts of AC-073: `planHeading`, `finalPriceLabel`, `editLabel`, `changePlanLabel`, `yesLabel`, `noLabel`, `acceptTermsLabel`, `viewTermsLabel`, `termsTitle`, `termsCloseLabel`, `acceptTermsMessage`, `payLabel`, `processingLabel`, `processingLeaveTitle`, `processingLeaveMessage`, `processingLeaveStayLabel`, `processingLeaveConfirmLabel`, `paymentErrorMessage`, `confirmationTitle`, `confirmationMessage`, `quoteNumberLabel`, `planLabel`, `amountPaidLabel`, `newQuoteLabel`. `countryDetailSchema` gains `summaryCopy` | AC-073 |
| `src/content/form-field.ts` | `FIELD_KINDS = ['identityDocumentNumber']`, `fieldKindSchema` and `FIELD_KIND_FIELD_TYPES = { identityDocumentNumber: 'text' }`. These map content values to content values and name no country or field. `formFieldSchema` gains an optional `kind`, rejects a kind on a field of another type, and its transform sets `kind: null` when absent | AC-069 (D4) |
| `src/content/terms.ts` (new) | `termsEntrySchema = { text: nonBlankTextSchema }`. `termsSchema` is an array of exactly one entry, transformed to that entry. No entry, several entries or a blank text are invalid | REQ-015; AC-077 |
| `src/content/wizard-content.ts` | `wizardContentSchema = { country, steps, plans, terms }`. New refinement: exactly one field of kind `identityDocumentNumber` across the country's form steps (AC-069, N1). The existing refinements are unchanged | AC-069, AC-077 |
| `src/payment.ts` (new) | `paymentRequestSchema` is a strict object `{ country: countryCodeSchema, plan: nonBlankTextSchema }` that rejects unknown keys. `QUOTE_NUMBER_PATTERN = /^[A-Z]{2}-[0-9]{8}-[A-Z0-9]{6}$/` and `quoteNumberSchema`. `paymentResponseSchema = { data: discriminatedUnion('status', [{ status: 'approved', quoteNumber }, { status: 'rejected' }]) }` | AC-079, AC-080, AC-081, AC-084 |
| `src/wizard-data.ts` | `storedConfirmationSchema = { planId, planName (non-blank), amount (finalPriceSchema), quoteNumber (quoteNumberSchema) }`. `wizardDataSchema` gains an optional `confirmation`, so data stored by CHG-001 and CHG-002 still parses | AC-085 (D8) |
| `src/index.ts`, `src/test-fixtures.ts` | Exports. Fixtures for both countries: summary copy with different texts per country; one terms entry per country (blank-line paragraphs, an inner line break, markup-like text); the kind on Colombia's document number and on Chile's RUT (Colombia has one form step, Chile two) | — |
| `src/**/*.spec.ts` | `terms.spec.ts`, `payment.spec.ts`, and extended `country.spec.ts`, `form-field.spec.ts`, `wizard-content.spec.ts` and `wizard-data.spec.ts` | AC-069, AC-073, AC-077, AC-079, AC-081, AC-084, AC-085 |

**Strapi (`apps/cms`)** holds the content model, the payment endpoint, permissions and seed (REQ-015, REQ-016, REQ-020).

| Piece | Path | Content |
| --- | --- | --- |
| `Terms` collection | `src/api/terms/{content-types/term/schema.json,controllers/term.ts,routes/term.ts,services/term.ts}` | `country` (many-to-one `Country`, `inversedBy: terms`) and `text` (type `text`, required), with draft and publish. `singularName: term`, `pluralName: terms` (REST `/api/terms`, as ADR-001's example request), uid `api::terms.term` (D5, R2). Core router `only: ['find', 'findOne']`, as for `plan` |
| Component | `src/components/country/summary-copy.json` | The 24 texts of `summaryCopySchema`, all required (`string`, `text` for the long messages) |
| `Country` changes | `src/api/country/content-types/country/schema.json` | `summaryCopy` (component `country.summary-copy`, required) and `terms` (one-to-many `api::terms.term`, `mappedBy: country`) |
| `FormField` change | `src/api/form-field/content-types/form-field/schema.json` | `kind` (enumeration `identityDocumentNumber`, optional) (D4) |
| Payment endpoint | `src/api/quote/routes/quote.ts`, `controllers/quote.ts`, `services/quote.ts`, `services/quote-number.ts` (new) | Route `POST /api/quote/pay`, handler `api::quote.quote.pay` (D1). The controller parses the body with `paymentRequestSchema`. A malformed body gets 400 with a generic body that echoes nothing. Otherwise the controller asks `service.pay(request)` and answers `200 { data: { status: 'approved', quoteNumber } }` or `200 { data: { status: 'rejected' } }` (D2). The service's `pay` reuses a private `findOfferedPlan(country, plan)`, the same Document Service query that `price` uses (published, `active: true`, `country.code`, `documentId`), so both endpoints have one eligibility rule. It writes nothing and calls no logger. `quote-number.ts` holds the pure `quoteNumber(code, now, pick)`: upper-case code, UTC `YYYYMMDD` from `now`, and six characters from `A–Z0–9` drawn with `pick(36)`. Defaults are `new Date()` and `crypto.randomInt` (D3) |
| Public permissions | `src/bootstrap/public-permissions.ts` | `PUBLIC_READ_CONTENT_TYPES` adds `api::terms.term`. `PUBLIC_ENDPOINT_ACTIONS = ['api::quote.quote.price', 'api::quote.quote.pay']`. `PUBLIC_ACTIONS` is still their union, idempotent, and removes anything else. Comments cite AC-082 instead of AC-066 |
| Seed | `src/seed/countries.ts`, `src/seed/index.ts` | `CountrySeed` gains `country.summaryCopy` and `terms: { text }`. Colombia's `numero-documento` and Chile's `rut` get `kind: 'identityDocumentNumber'`, and no other field gets it. Summary copy is shared where the texts coincide, as `PLAN_COPY` does, and differs where the prototype differs, for example `amountPaidLabel`. It includes the texts named in AC-094 ("Pagar", "Procesando tu pago…", "Acepto los términos y condiciones", "Ver términos y condiciones", "Editar", "Cambiar plan", "Número de cotización", "Nueva cotización", "¿Quieres salir mientras procesamos tu pago?"). The fictitious terms texts come from the approved prototype: at least two paragraphs each, different per country. `createField` passes `kind`. `createCountry` creates one published `api::terms.term` per country. The seed still runs only on an empty database |
| Generated types | `types/generated/{contentTypes,components}.d.ts` | Regenerated with `npm run types:generate -w apps/cms` and committed |
| Tests | `src/api/quote/services/quote-number.test.ts`, `services/quote.test.ts`, `controllers/quote.test.ts`, `src/bootstrap/public-permissions.test.ts`, `src/seed/seed.test.ts`, `src/content-model.test.ts`, `src/content-model.test-d.ts` | AC-079, AC-080, AC-082, AC-084, AC-094, AC-095, plus conformance: `terms` is excluded from the country keys like `steps` and `plans`, the terms type matches `termsEntrySchema`, the summary copy matches `summaryCopySchema`, and the `kind` enum equals `FIELD_KINDS` |

**Web (`apps/web/src`)** covers content reading, the payment client, pure formatting, wizard state, the shell contract and the summary step (REQ-014 to REQ-019).

| Path | Role |
| --- | --- |
| `app/core/content/content-reader.ts` | `RawWizardContent` gains `terms: unknown` |
| `app/core/content/strapi-content-reader.ts` | `COUNTRY_PARAMS` adds `populate[summaryCopy]=true`. `readWizard` adds a fourth parallel request: `GET /api/terms?filters[country][code][$eq]={code}&fields[0]=text&pagination[pageSize]=100`, with `cache: 'no-store'` and no token. Any failure rejects the whole load, so the unavailable state and retry of AC-016 apply (AC-077, D6) |
| `app/core/content/wizard-content.ts` | `toWizardContent(code, country, steps, plans, terms)` validates the four responses together with `wizardContentSchema` (AC-017 via AC-069, AC-073 and AC-077) |
| `app/core/payment/payment.ts` (new) | `Payment` interface (`pay(request, signal?): Promise<PaymentOutcome>`), where `PaymentOutcome = { kind: 'approved', quoteNumber } \| { kind: 'rejected' }`, and the `PAYMENT` `InjectionToken` |
| `app/core/payment/strapi-payment.ts` (new) | `POST {cmsUrl}/api/quote/pay` with a body built only by `paymentRequestSchema`: no authorization header, `cache: 'no-store'`. Aborts when the signal fires. The answer is validated with `paymentResponseSchema`: `approved` with a well-formed quote number gives `approved`, and `rejected` gives `rejected`. An HTTP error (including the 400 for a malformed request), a network failure or an invalid answer rejects (AC-081). Provided in `app.config.ts` |
| `app/shared/utils/mask-identity-document.ts` (new) | Pure `maskIdentityDocument(value)`. Letters and digits (`/[\p{L}\p{N}]/u`) other than the last four become `•`. Every other character stays in place. Four or fewer letters and digits are all masked (AC-069, D16) |
| `app/shared/utils/format-calendar-date.ts` (new) | Pure `formatCalendarDate(iso, locale)`. It parses with `parseIsoDate`, then formats `Date.UTC(y, m − 1, d)` with `Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })`, so the device time zone never shifts the date (AC-068, D15) |
| `app/core/wizard-state/wizard-data.ts` | `withPlan` keeps every other key (the confirmation included). New pure `withConfirmation` and `withoutConfirmation`. `withChosenPlan` with a different id drops the confirmation (AC-086). `reconcile` drops the confirmation when it drops the plan, changes stored values, or the confirmation's `planId` is not the chosen plan (AC-086). `isStepComplete`: while a confirmation is stored, every step is complete (D9). Otherwise the existing rules apply, and `summary` is complete only with a confirmation |
| `app/core/wizard-state/wizard-state.ts` | `confirmStep` with changed values also drops the confirmation. `choosePlan` with a different plan drops it, and the same plan is still a no-op. `discardFinalPrice` and `storeFinalPrice` keep it (AC-086). New `storeConfirmation(code, confirmation)` stores only while `confirmation.planId` is still the chosen plan (AC-085). New `startNewQuote(code)` stores `EMPTY_WIZARD_DATA` for that country only (AC-087) |
| `app/features/wizard/shell/step-context.ts` | `StepContext` gains `setHeading(text: string \| null)` (the heading and page title override for the confirmation, D12) and `trackProcessing(check: () => LeaveDialogCopy \| null, destroyRef)`. The check returns the dialog copy while a payment is processed and `null` otherwise (D10) |
| `app/features/wizard/shell/leave-confirmation.ts`, `components/leave-dialog.ts` | New neutral `LeaveDialogCopy = { title, message, stayLabel, leaveLabel }`. `ask(copy: LeaveDialogCopy)`. The dialog renders that copy, and its behavior is unchanged (AC-034: focus on stay, Escape stays, restore focus). `trackProcessing` registration lives next to `track` |
| `app/features/wizard/shell/wizard-shell.ts`, `wizard-shell.html` | `load` passes terms. The `h1` and the page title use the heading override when set. `canLeave(targetUrl)`: while the active step reports processing, any target other than the current address asks with the processing copy (AC-096). Otherwise the CHG-001 rule is unchanged (AC-034, AC-035). The shell maps `WizardCopy` to `LeaveDialogCopy` for the old case |
| `app/app.routes.ts` | `:country` gets `runGuardsAndResolvers: 'always'`, so the existing `leaveWizardGuard` also runs on moves between steps of the same wizard. The shell still answers `true` for them unless a payment is processed (D10, R1) |
| `app/features/wizard/shell/components/progress-indicator.ts` | When every step is complete, every item gets the complete style, and `aria-current="step"` stays on the current step (AC-083, AC-019, D17) |
| `app/features/wizard/shell/step-registry.ts` | Registers `summary: Summary` (open/closed: the shell is not edited for the type) |
| `app/features/wizard/steps/summary/summary.ts` (new container) | Injects `STEP_CONTEXT`, `WizardStateStore`, `PAYMENT`, `DOCUMENT`, `Router` and `Injector`. If a confirmation is stored, it shows the confirmation view. Otherwise it shows the summary view. **Summary view:** data sections from `toSummarySections` (AC-067 to AC-069); the plan section (name and stored final price, AC-070); edit links to `['/', code, slug]` and the change plan and back links to the plan step (AC-071, AC-072); the terms checkbox, unchecked on every display (`signal(false)`, never stored, AC-076, AC-089); the pay button with `aria-disabled` while unaccepted or processing, still focusable (AC-076); the accept message with `role="alert"`, associated through `aria-describedby` and `aria-invalid`, with focus moved to the checkbox (AC-076); the view terms button below pay, which opens the terms dialog (AC-074, AC-075). **Pay:** a synchronous single-flight flag set before the request (AC-078), then `payment.pay({ country, plan }, abortSignal)`. The signal aborts on destroy, so a late answer after leaving is ignored (AC-096). `approved` stores the confirmation (plan id and name, the summary's final price, the quote number). `rejected` or an error shows the payment error next to pay, announced, with focus kept and pay enabled again (AC-081). While processing, the edit, change plan and back links have no `routerLink`, carry `aria-disabled="true"` and get the disabled style; the checkbox is natively `disabled`; view terms is `aria-disabled` and does nothing; pay has `aria-busy="true"`; a polite `role="status"` region announces the processing text (AC-078, D13). It registers `trackProcessing` with the processing leave copy and a host `window:beforeunload` handler that calls `preventDefault()` only while processing (AC-096, AC-089). It registers `trackUnconfirmed(() => false)`. **Confirmation view:** calls `setHeading(confirmationTitle)` and shows the message, quote number, plan name and amount paid (`formatPrice`) as term and description pairs, and the new quote button (AC-083). It does not show pay, terms, edit, change plan or back. When the confirmation appears, focus moves to the heading unless a dialog is open (N3), and a status region announces it. **New quote:** `startNewQuote(code)`, then navigation to the first step (AC-087) |
| `app/features/wizard/steps/summary/components/summary-section.ts` (new, presentational) | A `section` labelled by its `h2`, holding a `dl` of `div > dt + dd` rows (AC-090), with an optional edit or change link slot. The edit link's accessible name includes the section title (`aria-label` built from the edit label and the title, or visible label plus `aria-describedby` with the title; see D13) (AC-071, AC-090) |
| `app/features/wizard/steps/summary/components/terms-dialog.ts` (new, presentational in a dialog) | Opened through `BrnDialogService` (as `LeaveDialog`) with role `dialog`. Its `h2` title has `tabindex="-1"` and is the `autoFocus` target, labelling the dialog. The body is `overflow-y-auto` with a bounded height, with the title and close action outside the scrolling area. Paragraphs come from `toParagraphs`, rendered with interpolation only and `whitespace-pre-line`. A close button. `restoreFocus` returns focus to the view terms action, and Escape closes (AC-074, AC-075, D14) |
| `app/features/wizard/steps/summary/components/confirmation-panel.ts` (new, presentational) | The confirmation message, the `dl` with quote number (`translate="no"`), plan and amount paid, and the new quote button; emits `newQuote` (AC-083, AC-087) |
| `app/features/wizard/steps/summary/models/summary-view.ts` (new) | Pure `toSummarySections(content, data, copy)`. It iterates the form steps in configured order and the fields in configured order (already sorted by the schemas). It omits fields with no stored value and fields not required whose value is empty (`isEmptyValue`; checkbox rule per Q1). Values are presented as follows: a select shows its option label; a date uses `formatCalendarDate` with `country.formatLocale`; number and text show the stored string; a checkbox shows the yes or no copy; the `identityDocumentNumber` kind uses `maskIdentityDocument` (AC-067 to AC-069). The function names no country, step or field |
| `app/features/wizard/steps/summary/models/terms-paragraphs.ts` (new) | Pure `toParagraphs(text)`: splits on blank lines (`/\n[ \t]*\n/`), trims block edges and drops empty blocks (AC-074) |
| Layout and motion | Single column with `min-w-0` and `break-words`/`[overflow-wrap:anywhere]` for long values, plan names and quote numbers. Pay is full width below 480 px. Targets are at least 24 px (AC-092). The processing spinner is `motion-safe:animate-spin`, a static indicator stays visible otherwise, and the dialogs have no movement transitions under reduced motion (the existing `styles.css` rule) (AC-093) |
| `src/testing/content-fixtures.ts`, `src/testing/fake-step-context.ts` | Raw terms, summary copy and kinds for both countries. `FakeContentReader` returns terms. `FakePayment` has controllable, delayable and rejectable answers and records its requests. `FakeStepContext` records `setHeading` and `trackProcessing` |

**End to end (`e2e`)** runs Playwright with axe against the Compose stack and its seed.

| Path | Content |
| --- | --- |
| `e2e/playwright.config.ts` | New serial project `terms-changes` that matches `terms-changes.spec.ts` and depends on `plan-changes`. `mobile` and `desktop` ignore it (D19) |
| `e2e/tests/support/strapi-admin.ts` | Terms methods on the generic model helpers: `StrapiAdmin.publishedTerms(code)` through the public API, `publishTerms(id, changes)`, and `createTerms(countryId, text, publish)` / `deleteTerms(id)` for the draft case |
| `e2e/tests/support/wizard.ts` | `SEEDED_SUMMARY_COPY`, `SEEDED_TERMS` (first and last paragraph per country), `reachSummary(page, code, ages)` (fills the form steps, chooses the recommended plan, waits for the price, continues), and locators `payButton`, `termsCheckbox`, `viewTermsButton`, `editLink(title)` and `changePlanLink`. `holdPayment(page)` intercepts `**/api/quote/pay` and returns controls to delay, release, reject (`{ data: { status: 'rejected' } }`) or abort, and counts requests |
| `e2e/tests/support/layout.ts` | Overflow check at 320 px added to the existing helpers |
| `e2e/tests/*.spec.ts` | Specs listed in the verification table. Titles start with the AC IDs. Titles and comments that cite AC-066 are retitled to AC-082 or AC-097 |

## Decisions and alternatives

The cited ADR is **ADR-001** (accepted, pin current). It fixes the following: terms are a collection related to `Country` (illustrative `GET /api/terms?filters[country][code][$eq]=cl`); the summary is the step type `summary`, last in the sequence; every content request filters by country; values are formatted with `Intl` from the country's locale and currency; no code names a country. The architecture reference already fixes these points: the simulated payment is a stateless custom endpoint in `src/api/quote/` that answers success or failure and, on success, a simulated quote number; the public role is the read actions plus the two custom endpoints; terms are read by the content client; the flow is "after the terms are accepted, the payment endpoint is called once and its result is shown"; the wizard data lives in the signals store mirrored to session storage; masking is a pure function in `shared/utils`. The owner answers Q1 to Q16 and N1 to N3 are applied as written.

Every decision below is local to CHG-003, stays inside ADR-001 and the architecture reference, and changes no approved behavior. Anything else is listed as an open question.

| # | Decision | Chosen | Alternatives | Why |
| --- | --- | --- | --- | --- |
| D1 | Payment route | `POST /api/quote/pay`, handler `quote.pay`, body `{ country, plan }` | A separate `payment` API; `GET` with query parameters | The architecture places both custom endpoints in `src/api/quote/`. The body keeps inputs out of the logged path (AC-079). The public permission is exactly `api::quote.quote.pay` (AC-082) |
| D2 | Rejection answer | Well-formed but ineligible: `200 { data: { status: 'rejected' } }`. Malformed: `400` with a generic body, no echo, no quote number. The browser treats both as a rejection | 402 or 404 for a rejection; 200 for a malformed body | A clear domain answer with no technical detail (AC-080). The malformed case reuses the price-quote convention. AC-081 shows one message for every non-approval |
| D3 | Quote number | Pure `quoteNumber(code, now, pick)` with injected clock and random pick; defaults `new Date()` and `crypto.randomInt(36)` | `Math.random`; a UUID | Deterministic unit tests with a fixed clock and random source, including UTC just before and after midnight (AC-084). `randomInt` is unbiased |
| D4 | Identity document number kind | Optional enumeration `kind` (`identityDocumentNumber`) on `FormField`. The type rule (text only) is enforced in `formFieldSchema` and the "exactly one per country" rule in `wizardContentSchema`, both at load (AC-017 path) | A boolean `identityDocument`; reusing `pricingInput`; a new field type | Owner answer Q1 (alternative D) and N1. It names what the field holds, like `pricingInput` (AC-044). An enumeration leaves room for other kinds without a schema change. The proposal rejected a new field type (it would change CAP-001's set) |
| D5 | Terms content type | Folder `src/api/terms/`, content type `term` (`singularName: term`, `pluralName: terms`), uid `api::terms.term`, REST `/api/terms` | Folder `api/term/` (uid `api::term.term`); terms as a component of `Country` | Matches the architecture tree (`terms/`) and ADR-001's request. A component was option B, which ADR-001 rejected. The uid is confirmed with `strapi-docs-mcp` before T002 (R2) |
| D6 | Terms loading | A fourth parallel request in `readWizard`, `fields[0]=text`, page size 100, validated with the other responses | Populate terms from the country request; load terms only on the summary | Owner answer Q5 and AC-077 ("together with the country, its steps and its plans"). The page size makes a duplicated entry visible, so it is rejected |
| D7 | Summary copy | New required component `country.summary-copy` on `Country` (`summaryCopy`) | Extend `country.wizard-copy` or `country.plan-copy`; copy on the summary wizard step | Same pattern as CHG-002 D4. It keeps earlier copy untouched and has its own conformance test |
| D8 | Confirmation storage | Optional `confirmation = { planId, planName, amount, quoteNumber }` in the country's wizard data. `withPlan` preserves other keys. Explicit drop rules in `withChosenPlan` (different plan), `confirmStep` (changed values) and `reconcile` | A separate session storage key | AC-085 keeps it "in the country's wizard data". The store stays the only code that touches storage (engineering). `planId` lets reconciliation verify that the confirmation still belongs to the chosen plan |
| D9 | Step completeness with a confirmation | While a confirmation is stored, every step counts as complete. The summary is complete only with a confirmation | Mark only the summary complete | AC-083 asks that every step be marked complete. AC-085 asks that the summary address show the confirmation "by any means", even while the plan step re-requests its price (its final price is briefly `null`, which by AC-056 alone would redirect to the plan step). Any change of the quote drops the confirmation first (AC-086), so this never hides an incomplete quote |
| D10 | Asking while a payment is processed | `runGuardsAndResolvers: 'always'` on `:country`, so the existing `leaveWizardGuard` (with the shell as component) also runs on step changes. `canLeave` asks with the processing copy while the step reports processing and otherwise keeps the CHG-001 rule. One guard means one dialog per navigation. `canceledNavigationResolution: 'computed'` restores history after stay. Native confirmation: the summary's `window:beforeunload` handler calls `preventDefault()` only while processing | `canDeactivate` on the componentless child routes plus a root registry (two guards may ask twice); listening to router events (cannot cancel) | Smallest change to the existing leave mechanism. AC-035 still holds because the shell answers `true` for in-wizard moves outside processing. Confirmed with the `angular-developer` skill before T010 (R1) |
| D11 | Late answers | The payment call takes an `AbortSignal` that aborts when the summary is destroyed. An aborted call writes nothing. An answer that arrives while the leave dialog is open is applied at once, and focus does not move while a dialog is open. Leave then proceeds through the already open dialog without a second ask | Keep the request alive and ignore it by sequence number | AC-096 and N3. Destroying the component is exactly "leaving the step". The endpoint is stateless, so aborting is harmless |
| D12 | Confirmation heading | `StepContext.setHeading(text)`: the shell's `h1` and page title show the confirmation title. The summary moves focus to the `h1` (`STEP_HEADING_ID`) | An `h2` confirmation title under the "Resumen y pago" `h1` | Approved prototype (the confirmation title is the page heading). One `h1` per page. Focus lands on the confirmation title as AC-083 requires |
| D13 | Locked actions | Navigation stays as links (`routerLink`) when idle. While processing, the links have `routerLink` `null`, `aria-disabled="true"` and the disabled style; the checkbox is native `disabled`; view terms is `aria-disabled` and does nothing; pay is `aria-disabled` and `aria-busy`. Edit link name: visible edit label, with the accessible name built as "{editLabel} {section title}" through `aria-label` | Buttons that call the router; native `disabled` on every control | Links keep navigation semantics. AC-078 asks for the disabled style and the disabled state. Pay must stay focusable (AC-076). AC-071 and AC-090 need the section title in the name |
| D14 | Terms dialog | Spartan `BrnDialogService`, role `dialog`, focus on the title, `restoreFocus`, Escape closes, scrolling body with the title and close action outside it, text through interpolation with `whitespace-pre-line` | A native `<dialog>`; `innerHTML` with converted paragraphs | Same dialog infrastructure as AC-034. Interpolation guarantees that no markup is interpreted (AC-074) |
| D15 | Date presentation | `Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })` on `Date.UTC(...)` of the stored calendar date | `new Date(iso)` in local time | Owner answer Q3 and AC-068 (`05/03/1990` with es-CO, `05-03-1990` with es-CL, as `Intl` produces them). Fixing the UTC time zone removes the device shift |
| D16 | Masking rule | One pure function in `shared/utils`: Unicode letters and digits count, the last four stay, separators stay, `•` is the mask character | A per-country rule; masking separators | Owner answer Q1 and the AC-069 examples. The architecture places masking in `shared/utils` |
| D17 | Progress on the confirmation | Every step gets the complete style, and `aria-current="step"` stays on the summary | Remove `aria-current` (prototype) | AC-019 (CAP-001) still requires marking the current step. AC-083 only requires every step to be complete |
| D18 | New quote | `startNewQuote(code)`, then `router.navigate(['/', code, firstStep.slug])`. No dialog, because nothing is processing and the form step has no unconfirmed values | Remove the session storage key | AC-087. The store API stays the only storage writer. Only this country's key changes |
| D19 | Mutating terms test | Separate serial project `terms-changes` after `plan-changes` | Add it to `content-changes.spec.ts` | Same pattern as CHG-002 D15: strict sequencing, and the seed is restored in `afterAll` |
| D20 | Existing local data | No data migration. Local stacks from CHG-002 are recreated with `docker compose down -v` | An incremental seed | Same as CHG-002 D13: `v0.1.0` is not published. Without the reset, a CHG-002 database lacks `summaryCopy`, terms and the kind, and correctly shows the invalid state (AC-017) |

## Contract ownership and compatibility

- **CAP-003 is new for `app`.** CAP-002 is revised only in REQ-009: AC-066 is retired and AC-097 added. Tests and comments that cite AC-066 are retitled as follows:
  - The exact public role list goes to AC-082 (`public-permissions.test.ts`, `public-access.spec.ts`).
  - The no-token price request goes to AC-097 (`strapi-price-quote.spec.ts`, `privacy.spec.ts`).
  - Other CAP-002 tests are unchanged.
- **CAP-001 is not modified.** Its behavior is extended where CAP-003 cites it:
  - The loading, unavailable and invalid states now also cover terms, summary copy and the kind (AC-077, AC-073, AC-069 through AC-015 to AC-017).
  - Step resolution (AC-024) knows when the summary is complete and treats a stored confirmation as completing every step (D9).
  - The leave confirmations (AC-033, AC-034) now also fire on the summary while a payment is processed (AC-096). AC-035 still holds outside processing.
- **Contract files owned by this change:**
  - `packages/shared`: `content/terms.ts` and `payment.ts`, plus the new parts of `country.ts`, `form-field.ts`, `wizard-content.ts` and `wizard-data.ts`.
  - Strapi: the `terms` content type, `country.summary-copy`, `Country.summaryCopy` and `Country.terms`, `FormField.kind`, and the `quote.pay` endpoint.
- **Public API surface added:** `find` and `findOne` on `api::terms.term`, and `POST /api/quote/pay`. Nothing else (AC-082, P4, architecture "Public role").
- **Session storage compatibility:** `confirmation` is optional, so CHG-001 and CHG-002 data in an open tab still parses.
- **Content compatibility:** `summaryCopy`, exactly one terms entry and exactly one `identityDocumentNumber` field are required. A database seeded by CHG-002 has none of them (D20).
- **Regression risk in earlier tests:**
  - `isStepComplete` ("summary never complete"), `withPlan` (now preserves keys), `toWizardContent` (new argument), `LeaveConfirmation.ask` and the leave dialog (copy type), and the shell spec (guards now run on step changes, step registry).
  - `content-model.test.ts`: country relations are now `steps`, `plans` and `terms`.
  - `public-permissions.test.ts`: the exact list.
  - CHG-001 and CHG-002 end-to-end specs that stop at "Resumen y pago" (AC-050, AC-056) keep passing because the heading is still the step title. They are re-run.

## Dependencies, migration and recovery

- **Dependencies:** CAP-001 `d9a109a9…` and CAP-002 `c8a973e7…` are integrated for `app`, so `DEPENDENCY_PENDING` is not expected.
- **No new npm dependency.** `crypto.randomInt` is from Node. The Spartan dialog is already used.
- **Database:** Strapi creates the `terms` table and the new columns from the committed `schema.json` files on start, with no migration files. Run `docker compose down -v` before the first end-to-end run (D20); the `e2e` profile check already does it.
- **Rollback:** revert the CHG-003 commits and drop the `cms-data` volume. Stored wizard data with a `confirmation` key is stripped by the CHG-002 schema (Zod object), so a rollback leaves no stuck tab state.
- **Order:**
  1. Shared schemas.
  2. Strapi model and generated types.
  3. Payment endpoint, permissions and seed.
  4. Web content reader, payment client, pure utilities and store.
  5. Shell contract and leave mechanism.
  6. Summary step.
  7. End-to-end support.
  8. End-to-end specs.
  9. Profile mapping, verification run and manual observations.

  Details are in `tasks.md`.

## Applicable AC verification

Profile checks that run these tests:

- `shared-unit` (`packages/shared`).
- `web-unit` (`apps/web`, 80 % lines on `core/` and `shared/utils/`).
- `cms-unit` (`apps/cms`, 80 % lines on `src/api/quote/services/`, with `--typecheck`).
- `e2e` (fresh Compose stack, `npm run test:e2e`).

`npm run check` runs format, lint, the unit tests and the builds. Test titles start with the AC IDs. Web test paths are relative to `apps/web/src/app/`, and e2e test paths to `e2e/tests/`.

| AC | Unit or component test (path) | End-to-end test (path) | Manual | Profile checks |
| --- | --- | --- | --- | --- |
| AC-067 | `features/wizard/steps/summary/models/summary-view.spec.ts` and `summary.spec.ts` (Colombia fixture: one section; Chile fixture: two sections; titles, labels, configured order; other country's data not shown) | `summary-content.spec.ts` (Colombia and Chile from the form steps to the summary: every section title, label and value) | — | web-unit, e2e |
| AC-068 | `summary-view.spec.ts` (select label, number `2020`, text case kept, checkbox yes/no, optional empty field omitted); `shared/utils/format-calendar-date.spec.ts` (es-CO and es-CL compared with `Intl` output, 5 March 1990; run with `TZ` west and east of UTC, R4) | (values checked as part of `summary-content.spec.ts`) | — | web-unit |
| AC-069 | `shared/utils/mask-identity-document.spec.ts` (every AC example, values of ≤ 4 letters and digits, separators at the start and end, lower and upper `k`); `packages/shared/src/content/form-field.spec.ts` (kind on a non-text field), `wizard-content.spec.ts` (none, two, fixtures of both countries); `summary.spec.ts` (complete value absent from the rendered DOM, including `aria-*` attributes; edit shows the full value is covered by AC-071) | `summary-content.spec.ts` (Colombia document number, Chile RUT: masked text shown, complete value absent from `page.content()`) | — | shared-unit, web-unit, e2e |
| AC-070 | `summary.spec.ts` (both countries: plan heading, name, stored final price formatted, no other plan, base price, coverage or benefit; no price request made) | `summary-content.spec.ts` (summary shows the name and final price the plan step showed; no `/api/quote/price` request while on the summary) | — | web-unit, e2e |
| AC-071 | `summary.spec.ts` and `components/summary-section.spec.ts` (edit links per section, targets, accessible names include the section title) | `summary-navigation.spec.ts` (Chile: edit "Tu vehículo", change year, continue through the plan step, new final price on the summary; Colombia: edit, continue unchanged, back to the summary; full value shown in the form) | — | web-unit, e2e |
| AC-072 | `summary.spec.ts` (change plan and back link targets) | `summary-navigation.spec.ts` (Colombia: change plan, choose another, continue; Chile: browser back from the summary; focus on the plan step heading) | — | web-unit, e2e |
| AC-073 | `packages/shared/src/content/country.spec.ts` (each summary copy text missing or blank); `summary.spec.ts` (different copy per country fixture appears) | — | — | shared-unit, web-unit |
| AC-074 | `models/terms-paragraphs.spec.ts`, `components/terms-dialog.spec.ts` (blank-line paragraphs, inner line breaks kept, `<b>` and `**` literal) | `summary-content.spec.ts` (Colombia and Chile dialog text equals the seeded terms, different per country); `terms-changes.spec.ts` (published change shown after reload, draft never shown, seed restored) | — | web-unit, e2e |
| AC-075 | `terms-dialog.spec.ts` and `summary.spec.ts` (focus on the title at open, Escape, close action, focus returns to view terms, acceptance unchanged) | `summary-accessibility.spec.ts` (one country: open, Escape, open, close; dialog role and name) | — | web-unit, e2e |
| AC-076 | `summary.spec.ts` (unchecked at start; pay `aria-disabled` and focusable; pay without acceptance sends nothing, shows the message associated and announced, focuses the checkbox; check enables, uncheck disables) | `summary-payment.spec.ts` (Colombia and Chile: pay without accepting sends no request and shows the message; accepting enables pay) | — | web-unit, e2e |
| AC-077 | `packages/shared/src/content/terms.spec.ts`, `wizard-content.spec.ts` (no terms, two entries, blank text); `core/content/strapi-content-reader.spec.ts` (terms request filtered by country, `no-store`, no token); `features/wizard/shell/wizard-shell.spec.ts` (loading, terms failure, invalid terms; retry keeps stored data) | `content-states.spec.ts` (terms request blocked for both countries, unavailable state, retry) | — | shared-unit, web-unit, e2e |
| AC-078 | `summary.spec.ts` (with a pending `FakePayment`: one request after double activation and repeated key presses; pay `aria-busy` and `aria-disabled` with the processing text; status announced; checkbox, view terms, edit, change plan and back locked) | `summary-payment.spec.ts` (Colombia and Chile: double click on pay with a delayed answer, exactly one `/api/quote/pay` request) | — | web-unit, e2e |
| AC-079 | `packages/shared/src/payment.spec.ts` (strict request rejects extra keys); `core/payment/strapi-payment.spec.ts` (body keys `country`, `plan` only, no authorization); `apps/cms/src/api/quote/services/quote.test.ts` (`pay` writes no document, calls no logger) and `controllers/quote.test.ts` (400 body echoes nothing) | `privacy.spec.ts` (Colombia and Chile on the summary and the confirmation: request bodies and URLs, address and console carry no entered value; payment body keys exactly `country`, `plan`) | — | shared-unit, web-unit, cms-unit, e2e |
| AC-080 | `apps/cms/src/api/quote/services/quote.test.ts` and `controllers/quote.test.ts` (published active plan of the country → approved with a quote number; unknown, unpublished, inactive and other-country plan → rejected; malformed → 400 without detail) | — | — | cms-unit |
| AC-081 | `summary.spec.ts` (HTTP error, network failure, `rejected`, approved without a valid quote number → same message next to pay, announced, focus kept, everything kept, pay enabled; pay again removes the message and sends one request); `strapi-payment.spec.ts` (invalid answer and 400 reject) | `summary-payment.spec.ts` (Colombia and Chile: request answered as rejected from the browser, then released; confirmation follows) | — | web-unit, e2e |
| AC-082 | `apps/cms/src/bootstrap/public-permissions.test.ts` (exact list including terms reads, `api::quote.quote.price` and `api::quote.quote.pay`; idempotent; retitled from AC-066) | `public-access.spec.ts` (terms readable, payment usable without a token, terms writes not usable; retitled from AC-066); `privacy.spec.ts` (terms and payment requests carry no authorization header) | — | cms-unit, e2e |
| AC-083 | `summary.spec.ts` and `components/confirmation-panel.spec.ts` (both countries: title via `setHeading`, message, quote number, plan, amount paid formatted, focus on the heading, announced, no pay, terms, edit, change plan or back, no entered value); `wizard-data.spec.ts` (every step complete with a confirmation); `progress-indicator.spec.ts` (all complete style) | `summary-payment.spec.ts` (Colombia and Chile: complete flow from country selection to the confirmation) | — | web-unit, e2e |
| AC-084 | `apps/cms/src/api/quote/services/quote-number.test.ts` (fixed clock and pick: format, upper-case prefix for `co` and `cl`, UTC 23:59:59 and 00:00:00); `packages/shared/src/payment.spec.ts` (pattern) | `summary-payment.spec.ts` (Colombia `CO-YYYYMMDD-XXXXXX`, Chile `CL-…`) | — | cms-unit, shared-unit, e2e |
| AC-085 | `core/wizard-state/wizard-state.spec.ts` (`storeConfirmation` only for the chosen plan; kept per country); `packages/shared/src/wizard-data.spec.ts` (confirmation optional, earlier data still valid); `summary.spec.ts` (stored confirmation → confirmation view, no pay) | `summary-navigation.spec.ts` (Colombia: reload on the confirmation; browser back to the plan step and forward; Chile's wizard shows no confirmation; new tab shows none) | — | shared-unit, web-unit, e2e |
| AC-086 | `wizard-state.spec.ts`, `wizard-data.spec.ts` (changed values, other plan, reconcile dropping the plan or changing values → discarded; unchanged values, same plan, final price obtained again → kept) | `summary-navigation.spec.ts` (Chile: after the confirmation, browser back to the plan step, choose another plan, continue: summary with pay and the terms unaccepted) | — | web-unit, e2e |
| AC-087 | `wizard-state.spec.ts` (`startNewQuote` clears only that country); `summary.spec.ts` (new quote navigates to the first step) | `summary-navigation.spec.ts` (Colombia: new quote → empty first step, heading focused, progress at step 1, no dialog; the summary address then leads to the first step) | — | web-unit, e2e |
| AC-088 | `wizard-data.spec.ts` (`resolveStep` for the summary with complete data, incomplete data, confirmation) | `summary-navigation.spec.ts` (one country: summary address in a tab with complete data shows the summary unaccepted; in a new tab leads to the first step) | — | web-unit, e2e |
| AC-089 | `summary.spec.ts` (`trackProcessing` reports `null` and no `beforeunload` prevention when not processing; `trackUnconfirmed` reports `false`); `wizard-shell.spec.ts` (no dialog on in-wizard moves outside processing) | `summary-navigation.spec.ts` (one country: reload with the terms accepted shows no native confirmation and the terms unaccepted; back and other country show no dialog) | — | web-unit, e2e |
| AC-090 | `summary.spec.ts`, `summary-section.spec.ts`, `terms-dialog.spec.ts`, `confirmation-panel.spec.ts` (headings, `dt`/`dd`, edit names, masked value exposed as shown, checkbox label and description, `aria-disabled`/`aria-busy`, live regions) | `summary-accessibility.spec.ts` (axe for Colombia and Chile: first shown, accept message, terms dialog open, processing, leave dialog open, payment error, confirmation) | — | web-unit, e2e |
| AC-091 | — | — | Keyboard-only use, Colombia and Chile: edit and change plan reachable, accept, open, scroll and close terms, pay, answer the leave dialog, pay again after an error, new quote; focus visible, no trap other than the open dialogs | none (observation) |
| AC-092 | — | `summary-accessibility.spec.ts` (both countries: no horizontal overflow at 320 and 375 px for summary, terms dialog, leave dialog, payment error and confirmation; terms scroll inside the dialog with title and close visible; targets ≥ 24 px) | 375 and 1280 px for both countries | e2e plus observation |
| AC-093 | — | — | Reduced motion: terms and leave dialogs opening and closing, processing indicator, confirmation appearing | none (observation) |
| AC-094 | `apps/cms/src/seed/seed.test.ts` (Colombia: summary copy, one terms entry of ≥ 2 paragraphs, kind only on "Número de documento", valid against the shared schemas) | `summary-content.spec.ts` (Colombia seeded copy texts, terms, masked "Número de documento") | — | cms-unit, e2e |
| AC-095 | `seed.test.ts` (Chile, terms different from Colombia's, kind only on "RUT") | `summary-content.spec.ts` (Chile) | — | cms-unit, e2e |
| AC-096 | `wizard-shell.spec.ts` (processing: in-wizard, root and other-country targets ask with the processing copy; stay cancels; leave proceeds; one dialog per navigation); `leave-confirmation.spec.ts` (neutral copy); `summary.spec.ts` (`beforeunload` prevented only while processing; answer after destroy ignored and nothing stored; answer while the dialog is open applied without moving focus) | `summary-leave.spec.ts` (Chromium, Colombia and Chile, delayed answer: reload with stay and with leave via the `beforeunload` dialog; browser back with stay → confirmation appears; browser back with leave → summary unpaid on return) | — | web-unit, e2e |
| AC-097 | `core/quote/strapi-price-quote.spec.ts` (no authorization header; retitled from AC-066) | `privacy.spec.ts` (one country: plan and price-quote requests carry no authorization header; retitled from AC-066) | — | web-unit, e2e |

Every AC from AC-067 to AC-097 has at least one planned meaningful verification:

- AC-073 is verified only by unit tests, as its own verification method states. AC-080 is also unit only.
- AC-091 and AC-093 are declared manual checks, recorded as observations with their AC IDs. AC-092 also has a manual part.
- AC-066 is retired and is no longer claimed by any check.

A check pass does not establish semantic sufficiency. The reviewer still judges whether each test exercises its AC.

Profile mapping to apply in `.roclec/project.toml` changes only the `acceptance_ids` of existing checks; no command changes. It is outside this stage's write paths; see T015 and open question Q2.

- `shared-unit`: + AC-069, AC-073, AC-077, AC-079, AC-084, AC-085.
- `web-unit`: + AC-067 to AC-079, AC-081, AC-083, AC-085 to AC-090, AC-096, AC-097.
- `cms-unit`: + AC-079, AC-080, AC-082, AC-084, AC-094, AC-095; − AC-066.
- `e2e`: + AC-067, AC-069 to AC-072, AC-074 to AC-079, AC-081 to AC-090, AC-092, AC-094 to AC-097; − AC-066.

## Risks

| ID | Risk | Mitigation |
| --- | --- | --- |
| R1 | Angular router: whether `runGuardsAndResolvers: 'always'` on the parent runs its `canDeactivate` with the shell instance on every child param change; interaction with the shell's own `replaceUrl` redirects; history restore after "stay" on browser back | Confirm with the `angular-developer` skill before T010. Shell unit tests with `RouterTestingHarness`. Fallback: `canDeactivate` on the componentless child routes, delegating to the shell through a root holder and asking once per navigation |
| R2 | Strapi 5 specifics to confirm with `strapi-docs-mcp`: uid and REST path for folder `terms` with content type `term`; custom route action uid `api::quote.quote.pay`; enumeration with one value (`kind`); relation `mappedBy` naming | Confirm before T002 and T003. Fallback for R2a: folder `term` (uid `api::term.term`, REST `/api/terms` unchanged) |
| R3 | Native `beforeunload` in Playwright: Chromium shows it only after a user activation, and `page.reload()` blocks until the dialog is answered | Pay is a real click (activation). Listen for `page.on('dialog')` of type `beforeunload` and do not await the reload before answering. Run in Chromium only (both projects already use Desktop Chrome) |
| R4 | Testing the date "with the device time zone west and east of UTC" inside the Angular unit runner | `formatCalendarDate` fixes `timeZone: 'UTC'`. The spec sets `process.env.TZ` (Node honours it at run time) around assertions, or runs in two Vitest projects with `TZ`. Verify during T007 that the runner honours it, and report if not |
| R5 | `withPlan` currently drops unknown keys, so a missed path would silently lose the confirmation | D8: `withPlan` preserves keys, and `wizard-data.spec.ts` covers every helper keeping or dropping the confirmation |
| R6 | Mutating specs (AC-007, plan changes, terms changes) interfere | `terms-changes` runs after `plan-changes`, after `content-changes`, after `mobile` and `desktop`. Changed terms are restored and created drafts are deleted in `afterAll` |
| R7 | The privacy check collides with the random `documentId` or the quote number | Assert the payment body by parsed keys. Check entered values (document number, RUT, plate, birth date, year) as full strings |
| R8 | A stale `cms-data` volume makes every country invalid | D20. `docker compose down -v` is part of the `e2e` check |
| R9 | `Intl` output varies by ICU (date separators, currency spacing) | Expectations are computed with `Intl` itself in unit and end-to-end tests (AC-068, AC-042), not hard-coded |

## Open material decisions

The owner answered these at the pre-implement checkpoint. None of them changes approved behavior.

- **Q1. An optional checkbox left unchecked (AC-068).** Owner answer: a checkbox with a stored value is always listed as yes or no; "left empty" applies to text, number, select and date fields. Option considered: omit an unchecked optional checkbox. It is a unit-test detail of `summary-view.ts` (T011).
- **Q2. Profile mapping in `.roclec/project.toml`.** Owner answer: the implementer applies the `acceptance_ids` changes listed above, including removing AC-066, as part of T015.
- **Q3. Release assignment.** Owner answer: CHG-003 joins planning release `v0.1.0` of `app` together with CHG-001 and CHG-002 (consistent with proposal answer Q16).
