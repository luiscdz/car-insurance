# Implementation plan for CHG-002

Supporting work artifact for the plan stage. It owns no contract, release membership or status: the approved proposal and the CAP-002 snapshot are the authority, and a behavior change goes back to the proposal and a new approval.

## Approved intent, bases and references

| Item | Value |
| --- | --- |
| Change | CHG-002, kind `evolution`, origin US-02 |
| Approved proposal digest | `3347fc8a824dd931d7db10694df0cc0296b913ec4e44e51fa40f681287dd9222` |
| Capability | CAP-002 (new), proposed snapshot `c8a973e708d69f46246a2ca995ddbfd53b1843b7b0c7925b1d2cfae054b35a36` |
| Component | `app` (user-facing) |
| Base | CAP-002 / `app`: none (expected absence) |
| Dependency | CAP-001 / `app` at `d9a109a9933d4153ee9a5295d15a679e3561ced3e0104bcbf99c35f5fe2120fb`, integrated (CHG-001); `current.json` holds that revision |
| Scope | REQ-008 to REQ-013, AC-036 to AC-066; owner answers Q1 to Q13 of the proposal |
| Architecture decisions | ADR-001 (accepted, pin current) |
| Agreed references | architecture, context, design, engineering, stack, verification, principles, flow |
| Knowledge skill | `country-content` (plan, implement, review), pinned in the approval (`6076186f…`) |
| Design reference | prototype `docs/prototypes/us-02/index.html`, sha256 `98b01e080e241306797deaa64386ff09f3167e1ec974ffdc983ba8572f0a548a` (owner-approved design checkpoint). Interaction and visual reference only; not production code. Where it differs from an AC, the AC wins (owner answer Q1: no intro paragraph). |
| Release | CHG-002 joins planning release `v0.1.0` of `app` together with CHG-001 (owner answer Q13). Release assignment is done by the coordinator on `main`; this plan does not run `release plan`. |

Excluded by the proposal and not planned here: everything the summary and payment step shows (US-03), terms, the simulated payment endpoint, final prices of every plan before a choice, comparison or filtering of plans, formatting of coverage values, a rule configured per country, request timeouts beyond the browser's own.

## Real repositories and component responsibilities

One repository (`.`), component `app`. Observed state at `500de64` (CHG-001 integrated):

- `packages/shared/src`: Zod schemas `country.ts` (`countryDetailSchema` with `copy: wizardCopySchema`, theme kept raw), `form-field.ts` (`formFieldSchema` with `FIELD_TYPES`), `wizard-step.ts` (`STEP_TYPES` already includes `plans` and `summary`), `wizard-content.ts` (`wizardContentSchema = { country, steps }` with the ADR-001 sequence refinement), `wizard-data.ts` (`{ steps: Record<slug, { values, complete }> }`), `order.ts` (`sortByOrder`, ties by `createdAt`), `strapi-envelope.ts`, `runtime-config.ts`, `test-fixtures.ts`.
- `apps/cms/src`: collections `country`, `wizard-step`, `form-field` (core routers restricted to `find`, `findOne`), components `country.theme`, `country.wizard-copy`, `form.option`, `form.validation`; `bootstrap/public-permissions.ts` (`PUBLIC_READ_CONTENT_TYPES`, `restrictPublicRole` keeps exactly `PUBLIC_ACTIONS`, `disableSelfRegistration`); `seed/countries.ts` (`COLOMBIA`, `CHILE`, shared `birthDate()` and `vehicleYear()` field helpers, `planSteps()`), `seed/index.ts` (`seedWhenEmpty` only when no `Country` exists); conformance tests `content-model.test.ts`, `content-model.test-d.ts`; `vitest.config.ts` coverage minimum already targets `src/api/quote/services/**`. No `plan` or `quote` API yet. `config/middlewares.ts` already allows `POST` in CORS; `strapi::logger` logs method, path and status only.
- `apps/web/src/app`: `core/content` (`ContentReader`/`CONTENT_READER`, `StrapiContentReader.readWizard` = two parallel requests, `toWizardContent(code, country, steps)`), `core/wizard-state` (`WizardStateStore` per country mirrored to `sessionStorage` key `wizard:{code}`, pure `reconcile`, `isStepComplete` (form only), `firstIncompleteIndex`, `resolveStep`), `core/clock.ts`, `features/wizard/shell` (`WizardShell` loads content with `resource`, renders the component of `STEP_COMPONENTS[step.type]`, today only `form`; steps without a component show heading, progress and back), `step-context.ts` (`StepContext`: `copy`, `previousStepLink`, `storedStep`, `confirm`, `trackUnconfirmed`), `leave-confirmation.ts` and `leave-guard.ts`, `features/wizard/steps/form-step`, `shared/ui` (`button`, `loader` with reduced-motion spinner, `status-message` with `role="alert"`), `shared/utils/field-validation/age.ts` (`parseIsoDate`, `ageInYears` with the 29 February rule), `testing/content-fixtures.ts`.
- `e2e`: projects `mobile` (375 px), `desktop` (1280 px) and the serial `content-changes` project (AC-007) that depends on both; `tests/support/strapi-admin.ts` (test-only admin client, Node only, credentials from the environment or a random first admin on a fresh stack), `support/wizard.ts`, `support/dates.ts`, `fixtures.ts` (axe, WCAG 2.2 AA).

### Layers of the solution

**Shared (`packages/shared`)**: the contract of every new boundary (P3).

| File | Content | REQ / AC |
| --- | --- | --- |
| `src/content/plan.ts` (new) | `planCoverageSchema` (`name` non-blank, `highlight` optional, non-blank when present), `planSchema` (`documentId` non-blank, `name` and `description` non-blank, `basePrice` whole number > 0, `currency` `^[A-Z]{3}$`, `order` integer, `recommended` boolean or absent → `false`, `coverages` at least one, `benefits` zero or more `{ text }` non-blank, `createdAt`), `plansSchema` (array sorted with `sortByOrder`) and inferred types | REQ-008; AC-036, AC-037, AC-041 |
| `src/content/country.ts` | `planCopySchema` with the twelve required, non-blank texts of AC-040 (`chooseLabel`, `chosenLabel`, `recommendedLabel`, `basePriceLabel`, `finalPriceLabel`, `quotingLabel`, `coveragesHeading`, `benefitsHeading`, `noPlansMessage`, `choosePlanMessage`, `priceErrorMessage`, `retryLabel`); `countryDetailSchema` gains `planCopy` | AC-040 |
| `src/content/form-field.ts` | `PRICING_INPUTS = ['birthDate', 'vehicleYear']`, `PRICING_INPUT_FIELD_TYPES = { birthDate: 'date', vehicleYear: 'number' }` (a mapping between content values, no country); `formFieldSchema` gains optional `pricingInput` and rejects a mark on a field of another type | AC-044 |
| `src/content/wizard-content.ts` | `wizardContentSchema = { country, steps, plans }`; refinements: every plan's currency equals the country's; at most one field per mark across all form steps of the country | AC-041, AC-044 |
| `src/quote.ts` (new) | `priceQuoteRequestSchema` (strict object: `country` code, `plan` non-blank, `policyholderAge` and `vehicleAge` optional whole numbers; unknown keys rejected) and `priceQuoteResponseSchema` (`{ data: { finalPrice } }`, whole number > 0) | AC-045, AC-046, AC-047 |
| `src/wizard-data.ts` | `storedPlanSchema = { id, finalPrice: whole number > 0 or null }`; `wizardDataSchema` gains optional `plan`, so data stored by CHG-001 still parses | AC-048, AC-053, AC-054 |
| `src/index.ts`, `src/test-fixtures.ts` | Exports; fixtures for both countries: plans (different names, prices and copy; equal order values; a plan without benefits; a coverage without highlight), plan copy, marks (Colombia both in one step, Chile in two steps) | — |
| `src/**/*.spec.ts` | `plan.spec.ts`, `quote.spec.ts`, extended `country.spec.ts`, `form-field.spec.ts`, `wizard-content.spec.ts`, `wizard-data.spec.ts` | AC-036, AC-040, AC-041, AC-044, AC-046, AC-053 |

**Strapi (`apps/cms`)**: content model, price-quote endpoint, permissions and seed (REQ-008, REQ-009, REQ-013).

| Piece | Path | Content |
| --- | --- | --- |
| `Plan` collection | `src/api/plan/{content-types/plan/schema.json,controllers/plan.ts,routes/plan.ts,services/plan.ts}` | `country` (many-to-one `Country`, `inversedBy: plans`), `name` (string, required), `description` (text, required), `basePrice` (integer, required, `min: 1`), `currency` (string, required, regex `^[A-Z]{3}$`), `order` (integer, required), `recommended` (boolean, default `false`), `active` (boolean, default `true`, see D5), `coverages` (repeatable `plan.coverage`, required, `min: 1`), `benefits` (repeatable `plan.benefit`); draft and publish. Core router `only: ['find', 'findOne']` as `country` |
| Components | `src/components/plan/coverage.json`, `src/components/plan/benefit.json`, `src/components/country/plan-copy.json` | coverage: `name` (required), `highlight` (optional). benefit: `text` (required). plan copy: the twelve texts of `planCopySchema`, all required |
| `Country` changes | `src/api/country/content-types/country/schema.json` | `planCopy` (component `country.plan-copy`, required); `plans` (one-to-many `Plan`, `mappedBy: country`) |
| `FormField` change | `src/api/form-field/content-types/form-field/schema.json` | `pricingInput` (enumeration `birthDate`, `vehicleYear`, optional) |
| Price-quote API (no content type) | `src/api/quote/routes/quote.ts`, `controllers/quote.ts`, `services/quote.ts`, `services/price-rule.ts` | Route `POST /api/quote/price`, handler `quote.price` (action `api::quote.quote.price`). Thin controller: parses `ctx.request.body` with `priceQuoteRequestSchema`; malformed → 400 with a generic message (no echo of inputs); asks the service; no plan → 404; answers `{ data: { finalPrice } }`. Service: reads the plan with the Document Service (`api::plan.plan`, `status: 'published'`, filters `documentId`, `active: true`, `country.code`, field `basePrice`), applies `finalPrice`; it writes nothing and calls no logger. `price-rule.ts`: pure `finalPrice(basePrice, policyholderAge?, vehicleAge?)` with named bracket constants (D2) |
| Public permissions | `src/bootstrap/public-permissions.ts` | `PUBLIC_READ_CONTENT_TYPES` adds `api::plan.plan`; new `PUBLIC_ENDPOINT_ACTIONS = ['api::quote.quote.price']`; `PUBLIC_ACTIONS` is their union; still idempotent and removes anything else |
| Seed | `src/seed/countries.ts`, `src/seed/index.ts` | `CountrySeed` gains `plans` and `country.planCopy`; `birthDate()` gets `pricingInput: 'birthDate'`, `vehicleYear()` gets `pricingInput: 'vehicleYear'` (one helper for both countries, so each country has one mark of each, per AC-064 and AC-065); plans of AC-064 and AC-065, published, active, fictitious; `createField` passes `pricingInput`; `createCountry` creates plans with `status: 'published'`. Still only when no `Country` exists |
| Generated types | `types/generated/{contentTypes,components}.d.ts` | Regenerated with `npm run types:generate -w apps/cms` and committed |
| Tests | `src/api/quote/services/price-rule.test.ts`, `src/api/quote/services/quote.test.ts`, `src/api/quote/controllers/quote.test.ts`, `src/bootstrap/public-permissions.test.ts`, `src/seed/seed.test.ts`, `src/content-model.test.ts`, `src/content-model.test-d.ts` | AC-043, AC-045, AC-046, AC-066, AC-064, AC-065, conformance |

**Web (`apps/web/src`)**: content reading, prices, wizard state, shell contract and the plan list step (REQ-008 to REQ-012).

| Path | Role |
| --- | --- |
| `app/core/content/content-reader.ts` | `RawWizardContent` gains `plans: unknown` |
| `app/core/content/strapi-content-reader.ts` | `COUNTRY_PARAMS` adds `populate[planCopy]=true`; `readWizard` adds a third parallel request `GET /api/plans?filters[country][code][$eq]={code}&filters[active][$eq]=true&sort[0]=order:asc&sort[1]=createdAt:asc&pagination[pageSize]=100&populate[coverages]=true&populate[benefits]=true`, `cache: 'no-store'`, no token. Any failure rejects the whole load (AC-059) |
| `app/core/content/wizard-content.ts` | `toWizardContent(code, country, steps, plans)` validates the three responses together with `wizardContentSchema` (AC-017 via AC-040, AC-041, AC-044) |
| `app/core/quote/price-quote.ts` (new) | `PriceQuote` interface (`finalPrice(request, abortSignal): Promise<number>`) and `PRICE_QUOTE` `InjectionToken` (interface segregation, dependency inversion) |
| `app/core/quote/strapi-price-quote.ts` (new) | `POST {cmsUrl}/api/quote/price` with a JSON body built only from `priceQuoteRequestSchema`; no authorization header; `cache: 'no-store'`; answer validated with `priceQuoteResponseSchema`; invalid answer or HTTP error rejects (AC-047); aborts when the signal fires |
| `app/core/quote/pricing-inputs.ts` (new) | Pure `pricingInputs(steps, data, today)`: finds the fields carrying each mark in the content (no field, step or country name in code), reads their stored values, derives `policyholderAge` with `parseIsoDate` and `ageInYears` (AC-014 rule) and `vehicleAge = currentYear − year`; missing mark or value → input absent (AC-044) |
| `app/shared/utils/format-price.ts` (new) | Pure `formatPrice(amount, currency, locale)` with `Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })` (AC-042) |
| `app/core/wizard-state/wizard-data.ts` | `reconcile(stored, content, today)` also keeps `plan` only when its id is among the received plans (AC-055) and drops its final price when reconciliation changed stored form values (D8); `isStepComplete`: `plans` complete only with a chosen plan and a stored final price (AC-056); `summary` never complete here; pure helpers `sameValues`, `withChosenPlan`, `withFinalPrice`, `withoutFinalPrice` |
| `app/core/wizard-state/wizard-state.ts` | `load(code, content, today)`; `choosePlan(code, id)` (no-op for the same id; stores `{ id, finalPrice: null }` at once, AC-048); `discardFinalPrice(code)`; `storeFinalPrice(code, id, price)` (ignored unless `id` is still chosen, AC-049); `confirmStep` drops the stored final price when the values differ from the stored ones (AC-054) |
| `app/features/wizard/shell/step-context.ts` | `StepContext` gains `content: Signal<WizardContent \| null>` and `advance(slug)` (moves to the next step without storing form values); exported `STEP_HEADING_ID` |
| `app/features/wizard/shell/wizard-shell.ts`, `wizard-shell.html` | `load` passes plans to `toWizardContent` and content to `store.load`; `confirm` = store then `advance`; `h1` gets `id = STEP_HEADING_ID`; nothing else changes (states, redirects with `replaceUrl`, heading focus, progress) |
| `app/features/wizard/shell/step-registry.ts` | Registers `plans: PlanList` (open/closed; the shell is not edited for the new type) |
| `app/features/wizard/steps/plan-list/plan-list.ts` (new container) | Injects `STEP_CONTEXT`, `WizardStateStore`, `PRICE_QUOTE`, `CLOCK`. Builds plan views; chosen plan from the store; final price through a `resource` keyed by `{ planId, attempt }` (stale answers cancelled and ignored, AC-049), started on every display with a chosen plan (AC-053) and on each choice; on start discards the stored final price, on success stores it, on failure shows the error with retry (AC-045, AC-047); continue with `aria-disabled` kept focusable, message and focus rules of AC-051, single advance flag (AC-052), `advance` to the next step (AC-050); no-plans state with back only (AC-058); registers `trackUnconfirmed(() => false)` and has no `beforeunload` handler (AC-057) |
| `app/features/wizard/steps/plan-list/components/plan-card.ts` (new, presentational) | Article labelled by the plan name; recommended badge text plus `primary` border and `surface-info` background (AC-038); description; base price with label; final price slot (`tabindex="-1"`, waiting text with `role="status"`, final price announced, error with retry); choose button with `aria-pressed`, visible chosen text and check icon, accessible name including the plan name, described by badge and prices (AC-048, AC-060); coverages with optional emphasized highlight and benefits hidden when empty (AC-037). Inputs and outputs only |
| `app/features/wizard/steps/plan-list/models/plan-view.ts` (new) | View model and pure `toPlanViews(plans, country)`: formatted prices, the single distinguished recommended plan (first in display order, AC-038) |
| Layout | Tailwind grid `grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]` (cards side by side at 1280 px, one column at 375 px and 320 px, AC-062); targets ≥ 24 px; spinner `motion-safe:animate-spin` and no transitions under reduced motion (existing `styles.css` rule, AC-063) |
| `src/testing/content-fixtures.ts` | Raw plans, plan copy and marks for both countries; `FakeContentReader` returns plans; `FakePriceQuote` with controllable, out-of-order answers |

**End to end (`e2e`)**: Playwright with axe against the Compose stack and its seed.

| Path | Content |
| --- | --- |
| `e2e/playwright.config.ts` | `globalSetup`; new serial project `plan-changes` (matches `plan-changes.spec.ts`, depends on `content-changes`, so it never overlaps with AC-007 or the parallel projects); `mobile` and `desktop` ignore both mutating specs |
| `e2e/tests/support/global-setup.ts` (new) | When `E2E_STRAPI_ADMIN_EMAIL`/`PASSWORD` are not set and Strapi has no administrator, registers one fictitious administrator with random credentials and exports them through `process.env` to the workers, so both mutating specs share one test-only credential; Node only, never sent to the web app (P4) |
| `e2e/tests/support/strapi-admin.ts` | Generalized to a model (`api::form-field.form-field`, `api::plan.plan`); plan methods `createPlan(data, publish)`, `publishPlan(id, changes)`, `unpublishPlan`, `deletePlan`, `planIds(code)` read through the public API; `connect()` uses the exported credentials |
| `e2e/tests/support/wizard.ts`, `support/dates.ts`, `support/layout.ts` (new) | `SEEDED_PLANS`, `SEEDED_PLAN_COPY`, `reachPlans(page, code, ages)`, `planCard`, `chooseButton`; `birthDateForAge(page, age)` (1 January of Y − age); `expectNoHorizontalOverflow` and `expectTargetsOfAtLeast24px` moved from `accessibility.spec.ts` |
| `e2e/tests/*.spec.ts` | Specs listed in the verification table; titles start with the AC IDs |

## Decisions and alternatives

Cited ADR: **ADR-001** (accepted, pin current). It fixes the `Country` collection with related collections (plans are a collection related to `Country`), the country code as first address segment, the step type `plans` in the fixed sequence, country-filtered requests and `Intl` formatting from the country's currency and locale. The architecture reference already fixes the price quote as a stateless custom endpoint in the `quote` API, the rule as a pure function in its service, the public role (read actions plus the custom endpoints) and the request flow. The owner answers Q1 to Q13 are applied as written. Every decision below is local to CHG-002, stays inside ADR-001 and the architecture reference, and changes no approved behavior; anything else is an open question.

| # | Decision | Chosen | Alternatives | Why |
| --- | --- | --- | --- | --- |
| D1 | Price-quote route | `POST /api/quote/price`, handler `quote.price`, inputs in the JSON body | `GET` with query parameters; `POST /api/quote` | `strapi::logger` logs the request path, so inputs in the query would be logged (AC-046); the `price` action leaves room for the US-03 payment action in the same API; the public permission is exactly `api::quote.quote.price` |
| D2 | Rule arithmetic | Integer percentages: `round((B × (100 + v + a)) / 100)` computed as `floor((B × (100 + v + a) + 50) / 100)`; brackets as named constants | Floating-point `B × (1 + 0.10 + 0.15)` | "Computed exactly, halves up" (AC-043): `333333 × 110` and `12345 × 110` give `366666` and `13580` exactly; `B` is a Strapi integer, so products stay below `2^53` |
| D3 | Plan identifier | Strapi 5 `documentId` (stable across publish), sent as `plan` and stored as `plan.id` | Numeric `id` (changes between draft and published rows); plan name | Stable reference for reconciliation (AC-055) and the endpoint lookup (AC-045) |
| D4 | Plan list copy | New required component `country.plan-copy` on `Country` (`planCopy`) | Extend `country.wizard-copy`; copy on the `plans` wizard step | Keeps the CHG-001 wizard copy unchanged; country-level like the other copy (AC-040); separate responsibility and conformance test |
| D5 | `active` default | `true`; `recommended` default `false` | `active` default `false` | Publication stays the first gate (BR-02); `active` is the toggle to withdraw a plan without unpublishing; AC-036 and AC-039 behave the same either way |
| D6 | Pricing marks | Optional enumeration `pricingInput` (`birthDate`, `vehicleYear`) on `FormField`; type and uniqueness enforced by Zod at load (AC-017 path) | Two booleans; Strapi lifecycle hooks rejecting saves | One attribute expresses "at most one mark per field"; cross-entry rules are validated at load as CHG-001 D7 did |
| D7 | Where plans are loaded | Third parallel request in `readWizard`, validated together with country and steps | Populate plans from the country request | Owner answer Q9 and ADR-001's illustrative requests; plans keep their own draft and publish and the `active` filter |
| D8 | Final price lifecycle in storage | Stored final price is always the answer to the latest request for the chosen plan: cleared when a request starts (choice, display, retry), set on success, absent on failure; also cleared by `confirmStep` with changed values (AC-054) and by `reconcile` when it changed stored form values | Keep the old price while a new request waits | One rule makes "complete only while its final price for the current step 1 data is stored" (AC-056) hold in every path; the progress shows the plan step incomplete while a price is being obtained |
| D9 | Race handling | Angular `resource` keyed by `{ planId, attempt }`; `storeFinalPrice` ignores ids that are no longer chosen | Manual sequence numbers | `resource` aborts and ignores stale loaders (AC-049); the store guard covers late writes |
| D10 | Step contract | `StepContext` gains `content` and `advance`; the plan step injects `WizardStateStore` and `PRICE_QUOTE` itself (containers inject state and services) | A separate plan-step context token; plan operations on the shell | Smallest change to the shared contract; every step still receives only `step` (Liskov); the shell stays closed to the new type |
| D11 | Choice control | Button with `aria-pressed`, visible chosen text and check icon, accessible name with the plan name (approved prototype) | Radio group | Approved prototype; Tab reaches every plan in visual order (AC-061); not color alone (AC-048) |
| D12 | Plan group name | `role="group"` with `aria-labelledby` the shell heading (`STEP_HEADING_ID`) | `aria-label` copied from the step title | Name is the step heading itself (AC-060) |
| D13 | Existing local data | No data migration: the seed still runs only on an empty database; local stacks from CHG-001 are recreated with `docker compose down -v` | Incremental seed for countries without `planCopy` or plans | Nothing is published yet (`v0.1.0` is a planning release); an incremental seed could overwrite business edits, which the architecture forbids. Without the reset, a CHG-001 database lacks `planCopy` and the wizard correctly shows the invalid state (AC-017) |
| D14 | Shared admin credential for mutating specs | Playwright `globalSetup` registers or reuses one test-only administrator and passes it to workers via `process.env` | Put plan tests in `content-changes.spec.ts`; fixed credentials in the repository | Two specs need the admin API; a second `register-admin` fails once an admin exists; credentials stay random, in Node only (P4) |
| D15 | Mutating plan tests | Separate serial project `plan-changes` depending on `content-changes` | Same project as AC-007 | Strict sequencing without relying on per-project worker limits; both restore the seed |

## Contract ownership and compatibility

- CAP-002 is new for `app`; no integrated CAP-002 contract exists. CAP-001 is not modified: no CAP-001 AC is revised. Its behavior is extended where CAP-002 cites it: the loading, unavailable and invalid states now also cover plans (AC-059 through AC-015 to AC-017), the step resolution of AC-024 now knows when the plan step is complete (AC-056), and the leave confirmation of AC-033 and AC-034 never fires on the plan step (AC-057).
- Contract files owned by this change: `packages/shared/src/content/plan.ts`, `src/quote.ts`, the new fields of `country.ts`, `form-field.ts`, `wizard-content.ts`, `wizard-data.ts`; the Strapi `plan` content type, its components, `country.plan-copy`, `FormField.pricingInput`, and the `quote` API.
- Public API surface added: `find` and `findOne` on `api::plan.plan`, and `POST /api/quote/price`. Nothing else (AC-066, P4, architecture "Public role").
- Session storage compatibility: `plan` is optional, so data stored by CHG-001 in an open tab still parses; malformed data is discarded as before.
- Content compatibility: `planCopy` is required; a database seeded by CHG-001 has none (D13).
- Regression risk in CHG-001 tests: the plan step now renders a body. CHG-001 unit tests of `isStepComplete` ("other step types never are") and `reconcile` signatures, the shell spec (step registry, `load`), `content-model.test.ts` (country relations now `steps` and `plans`) and `public-permissions.test.ts` (exact list) are updated in the tasks that change those units. CHG-001 end-to-end tests that stop at "Elige tu plan" (AC-019, AC-026) keep passing; they are re-run.

## Dependencies, migration and recovery

- Dependency: CAP-001 revision `d9a109a9…` is integrated for `app`, so `DEPENDENCY_PENDING` is not expected.
- No new npm dependency. Zod is already a dependency of `packages/shared`; `apps/cms` imports runtime schemas from `@car-insurance/shared` for the first time (until now types only) (R1).
- Database: Strapi creates the new tables and columns from the committed `schema.json` files on start; no migration files. Run `docker compose down -v` before the first end-to-end run (D13). The `e2e` profile check already does it.
- Rollback: revert the CHG-002 commits and drop the `cms-data` volume. Stored wizard data with a `plan` key is ignored by CHG-001's schema (Zod object strips unknown keys), so a rollback leaves no stuck tab state.
- Order: shared schemas → Strapi model and generated types → quote API, permissions, seed → web content reader, pure functions and store → shell contract → plan list step → end-to-end support → end-to-end specs → verification run and manual observations. Details in `tasks.md`.

## Applicable AC verification

Profile checks that run these tests: `shared-unit` (`packages/shared`), `web-unit` (`apps/web`, 80 % lines on `core/` and `shared/utils/`), `cms-unit` (`apps/cms`, 80 % lines on `src/api/quote/services/`, with `--typecheck`), `e2e` (fresh Compose stack). Test titles start with the AC IDs. Paths of web tests are relative to `apps/web/src/app/`; of e2e tests to `e2e/tests/`.

| AC | Unit or component test (path) | End-to-end test (path) | Manual | Profile checks |
| --- | --- | --- | --- | --- |
| AC-036 | `packages/shared/src/content/plan.spec.ts` (order, equal order by creation); `core/content/wizard-content.spec.ts` (both countries) | `plan-list-content.spec.ts` (seeded plans of `/co` and `/cl` only, in order); `plan-changes.spec.ts` (inactive and draft plan created per country by the setup never shown) | — | shared-unit, web-unit, e2e |
| AC-037 | `steps/plan-list/components/plan-card.spec.ts` (fixtures of both countries, plan without benefits, coverage without highlight) | `plan-list-content.spec.ts` (one seeded plan per country) | — | web-unit, e2e |
| AC-038 | `plan-card.spec.ts`, `steps/plan-list/models/plan-view.spec.ts` (zero, one, two recommended; no plan chosen in advance) | `plan-list-content.spec.ts` (only "Plan Clásico" and "Plan Full" show "Recomendado") | — | web-unit, e2e |
| AC-039 | — (needs real Strapi) | `plan-changes.spec.ts` (add, reorder, deactivate, change base price and recommended; reload; draft and inactive never shown; seed restored in `afterAll`) | — | e2e |
| AC-040 | `packages/shared/src/content/country.spec.ts` (each copy text missing or blank); `steps/plan-list/plan-list.spec.ts` (different copy per country fixture) | — | — | shared-unit, web-unit |
| AC-041 | `packages/shared/src/content/plan.spec.ts`, `wizard-content.spec.ts` (each rule broken once: blank name and description, base price 0, negative, decimal, currency mismatch, no coverage, blank coverage name or highlight, blank benefit, non-boolean recommended); `core/content/wizard-content.spec.ts` (invalid result) | — | — | shared-unit, web-unit |
| AC-042 | `shared/utils/format-price.spec.ts` (compared with `Intl` output for `es-CO`/`COP` and `es-CL`/`CLP`; no decimals) | `plan-list-content.spec.ts` (seeded base price per country equals the browser's `Intl` output) | — | web-unit, e2e |
| AC-043 | `apps/cms/src/api/quote/services/price-rule.test.ts` (table examples; V = −1, 5, 6, 10, 11; A = 25, 26, 64, 65; unavailable inputs) | — | — | cms-unit |
| AC-044 | `core/quote/pricing-inputs.spec.ts` (fixed date; Colombia marks in one step, Chile in two, no marks, missing value, 29 February); `packages/shared/src/content/form-field.spec.ts`, `wizard-content.spec.ts` (mark on wrong type, duplicated mark) | — | — | shared-unit, web-unit |
| AC-045 | `plan-list.spec.ts` (waiting text as status, final price with label, announced, no other plan shows a final price); `apps/cms/src/api/quote/services/quote.test.ts` and `controllers/quote.test.ts` (published active plan; unpublished, inactive, other-country plan; malformed inputs) | `plan-selection.spec.ts` (Colombia age 22 and vehicle Y−8: "Plan Básico" 1 500 000; Chile age 70 and vehicle Y−15: "Plan Esencial" 455 000) | — | web-unit, cms-unit, e2e |
| AC-046 | `packages/shared/src/quote.spec.ts` (strict request rejects extra keys); `core/quote/strapi-price-quote.spec.ts` (body keys only, no authorization); `apps/cms/src/api/quote/services/quote.test.ts` (no document write, no log call with inputs) | `privacy.spec.ts` (plan step for both countries: request bodies and URLs, address and console carry no entered value; quote body keys exactly `country`, `plan`, ages) | — | shared-unit, web-unit, cms-unit, e2e |
| AC-047 | `plan-list.spec.ts` (HTTP error, network failure, invalid answer, retry, choice kept, no advance); `strapi-price-quote.spec.ts` (invalid answer rejects) | `plan-selection.spec.ts` (Colombia: quote request aborted, error and retry, then allowed) | — | web-unit, e2e |
| AC-048 | `plan-list.spec.ts` (both countries: one chosen, `aria-pressed`, chosen text, stored at once, previous loses mark and price); `core/wizard-state/wizard-state.spec.ts` (`choosePlan`) | `plan-selection.spec.ts` (both countries, choose one then another) | — | web-unit, e2e |
| AC-049 | `plan-list.spec.ts` (delayed answers out of order; same plan again sends nothing) | — | — | web-unit |
| AC-050 | `plan-list.spec.ts` (advance to next step); `features/wizard/shell/wizard-shell.spec.ts` (summary address, heading focus, progress) | `plan-selection.spec.ts` (both countries to `/co/resumen-y-pago` and `/cl/resumen-y-pago`, heading focused, progress) | — | web-unit, e2e |
| AC-051 | `plan-list.spec.ts` (no choice: message associated and announced, focus first plan, message disappears; waiting and error: focus price status or retry) | `plan-selection.spec.ts` (Chile, continue with no plan) | — | web-unit, e2e |
| AC-052 | `plan-list.spec.ts` (double activation advances once) | — | — | web-unit |
| AC-053 | `wizard-state.spec.ts` (plan kept per country); `packages/shared/src/wizard-data.spec.ts` (stored plan, CHG-001 data still valid); `plan-list.spec.ts` (price requested on every display) | `plan-navigation.spec.ts` (Chile: back action and browser back, continue and browser forward, reload on plan and on summary step; quote requested on every display; per-country separation) | — | shared-unit, web-unit, e2e |
| AC-054 | `wizard-state.spec.ts`, `core/wizard-state/wizard-data.spec.ts` (changed values drop the price, unchanged keep it) | `plan-navigation.spec.ts` (Colombia: birth date from age 30 to 22; summary address leads to the plan step; new final price) | — | web-unit, e2e |
| AC-055 | `wizard-data.spec.ts` (`reconcile` with fixtures of both countries: plan missing, no error) | — | — | web-unit |
| AC-056 | `wizard-data.spec.ts` (`isStepComplete`, `resolveStep`); `wizard-shell.spec.ts` (redirect with `replaceUrl`) | `plan-navigation.spec.ts` (Colombia: plan address with empty tab; summary address with complete form step and no plan) | — | web-unit, e2e |
| AC-057 | `plan-list.spec.ts` (reports no unconfirmed values, no `beforeunload` prevention); `leave-confirmation.spec.ts` unchanged | `plan-navigation.spec.ts` (Colombia: reload on plan step with a chosen plan, back, root and other country: no dialog) | — | web-unit, e2e |
| AC-058 | `plan-list.spec.ts` (no plans: message announced, back only, no continue) | `plan-changes.spec.ts` (Chile plans deactivated by setup, then restored) | — | web-unit, e2e |
| AC-059 | `core/content/strapi-content-reader.spec.ts` (three filtered requests, no cache); `wizard-shell.spec.ts` (loading, plans failure, invalid plans; retry keeps stored data) | `content-states.spec.ts` (plans request blocked for both countries, retry) | — | web-unit, e2e |
| AC-060 | `plan-card.spec.ts`, `plan-list.spec.ts` (group name, accessible names, `aria-pressed`, descriptions, live regions) | `plan-accessibility.spec.ts` (axe for both countries: no choice, chosen with price, choose message, price error); `plan-changes.spec.ts` (axe on the no-plans message) | — | web-unit, e2e |
| AC-061 | — | — | Keyboard-only use, Colombia and Chile: reach, choose, change, retry, back, continue; focus visible, no trap | none (observation) |
| AC-062 | — | `plan-accessibility.spec.ts` (both countries: one row at 1280 px, one column at 375 px, no horizontal overflow at 320 and 375 px with and without choice and messages, targets ≥ 24 px) | 375 and 1280 px for both countries | e2e plus observation |
| AC-063 | — | — | Reduced motion: choice, choice change, waiting and arriving price, messages | none (observation) |
| AC-064 | `apps/cms/src/seed/seed.test.ts` (Colombia plans, copy, marks against the shared schemas) | `plan-list-content.spec.ts` (Colombia names, prices, order, recommended, benefits, copy); `plan-selection.spec.ts` (marks proven by the AC-045 adjustment) | — | cms-unit, e2e |
| AC-065 | `seed.test.ts` (Chile) | `plan-list-content.spec.ts` (Chile); `plan-selection.spec.ts` (marks in two steps) | — | cms-unit, e2e |
| AC-066 | `apps/cms/src/bootstrap/public-permissions.test.ts` (exact list including plan reads and `api::quote.quote.price`; idempotent) | `public-access.spec.ts` (plans readable, quote usable without token, plan writes not usable); `privacy.spec.ts` (no authorization header on plan and quote requests) | — | cms-unit, e2e |

Every AC has at least one planned meaningful verification. AC-039 is verified only end to end. AC-061 and AC-063 are declared manual checks recorded as observations with their AC IDs; AC-062 also has a manual part. A check pass does not establish semantic sufficiency: the reviewer still judges whether each test exercises its AC.

Profile mapping applied in `.roclec/project.toml` (only `acceptance_ids` of existing checks; no command changed):

- `shared-unit`: + AC-036, AC-040, AC-041, AC-044, AC-046, AC-053.
- `web-unit`: + AC-036 to AC-038, AC-040 to AC-042, AC-044 to AC-060.
- `cms-unit`: + AC-043, AC-045, AC-046, AC-064 to AC-066.
- `e2e`: + AC-036 to AC-039, AC-042, AC-045 to AC-048, AC-050, AC-051, AC-053, AC-054, AC-056 to AC-060, AC-062, AC-064 to AC-066.

## Risks

| ID | Risk | Mitigation |
| --- | --- | --- |
| R1 | `apps/cms` is compiled to CommonJS and now imports runtime Zod schemas from the ESM package `@car-insurance/shared` | Node 26 loads ES modules with `require`; the Dockerfile already builds `packages/shared` first; covered by `cms-build`, `cms-unit` and the `e2e` stack. Fallback: dynamic `import()` in the controller |
| R2 | Strapi 5 specifics to confirm with `strapi-docs-mcp`: custom route permission uid (`api::quote.quote.price`) for an API without a content type; Document Service `findFirst` with `documentId`, relation and `status: 'published'` filters; enumeration values `birthDate`/`vehicleYear`; repeatable component `min`; how the admin stores a cleared optional `highlight` (`null` versus `""`) | Confirm before T002 and T003; a `""` highlight would be invalid per AC-041, so the seed and test setup never send it |
| R3 | Error middleware or default logging echoes request bodies | Controller returns generic 400/404 bodies; unit test asserts no logger call receives inputs; end-to-end console observation (AC-046) |
| R4 | Mutating specs (AC-007 and plan changes) interfere with parallel tests or each other | `plan-changes` project after `content-changes` after `mobile`/`desktop`; every created plan deleted and every changed plan restored in `afterAll` |
| R5 | A second admin registration fails | D14 global setup; clear message when an admin exists and no credentials are set |
| R6 | Date-dependent end-to-end prices around 1 January or midnight | Birth dates on 1 January of Y − age computed in the browser; vehicle years from the browser's year; unit tests use `TODAY` |
| R7 | Substring checks in `privacy.spec.ts` collide with random `documentId`s or ages | Assert the quote body by parsed keys; check entered values (document number, RUT, plate, birth date, year) as full strings |
| R8 | `Intl` symbol and spacing vary by browser ICU | Unit and end-to-end expectations computed with `Intl` itself (AC-042), not hard-coded |
| R9 | A stale `cms-data` volume from CHG-001 makes every country invalid (no `planCopy`) | D13; `docker compose down -v` is part of the `e2e` check and documented in tasks |

## Owner answers to planning questions

Answered by the owner on 2026-11-23; no material decision remains open.

- **Q1. Prototype intro paragraph not in the approved ACs.** The approved prototype shows an intro text under the heading ("Precios anuales en pesos colombianos…") from Strapi copy key `intro`; AC-040 lists the plan list copy exhaustively and has no intro. Owner answer: implement without the intro, following AC-040. The intro in the prototype is a known deviation of the prototype, not a requirement; the proposal is not revised.
- **D13 confirmation.** Owner answer: no environment outside local development holds CHG-001 content (`v0.1.0` is not published), so no data migration is needed; local stacks are reset with `docker compose down -v`.
