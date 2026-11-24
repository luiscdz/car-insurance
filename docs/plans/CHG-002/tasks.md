# Work items for CHG-002

Owner of every work item: component `app`. Proposal digest `3347fc8a824dd931d7db10694df0cc0296b913ec4e44e51fa40f681287dd9222`; design and decisions in [plan.md](plan.md). AC IDs refer to the CAP-002 snapshot `c8a973e708d69f46246a2ca995ddbfd53b1843b7b0c7925b1d2cfae054b35a36`; their text is not copied here. Every path is inside the `app` inputs of `.roclec/project.toml`.

## Prerequisites and dependency order

- [x] P1. CHG-001 integrated for `app` (CAP-001 `d9a109a9…` in `current.json`).
- [ ] P2. Coordinator assigns CHG-002 to planning release `v0.1.0` of `app` on `main` (owner answer Q13).
- [ ] P3. Coordinator obtains the `pre-implement` checkpoint (CR-011) for this plan and tasks.
- [x] P4. Answer to plan open question Q1 (prototype intro copy): owner answered to build without the intro, following AC-040; the proposal is not revised.
- [ ] P5. Local stack recreated before the first end-to-end run: `docker compose down -v` (plan D13).

Order (a task starts when the tasks it depends on are done):

```
T001 ─┬─ T002 ─┬─ T003
      │        ├─ T004
      │        └─ T005
      ├─ T006
      ├─ T007
      └─ T008
T006, T008 ─── T009 ─── T010
T003, T004, T005, T010 ─── T011 ─┬─ T012
                                 └─ T013
T001 to T013 ─── T014
```

## Implementation by component

All items: component `app`.

| ID | Work item | Paths | ACs | Depends on |
| --- | --- | --- | --- | --- |
| T001 | Shared contract: `plan.ts` (coverage, plan, sorted plans), `planCopySchema` and `countryDetailSchema.planCopy`, `PRICING_INPUTS` and `formFieldSchema.pricingInput` with the field-type rule, `wizardContentSchema` with `plans` and the currency and unique-mark refinements, `quote.ts` (strict request, response), `storedPlanSchema` and optional `wizardDataSchema.plan`; exports; fixtures for both countries; valid and invalid tests (each AC-041 rule broken once) | `packages/shared/src/content/{plan,country,form-field,wizard-content}.ts`, `packages/shared/src/{quote,wizard-data,index,test-fixtures}.ts`, `packages/shared/src/**/*.spec.ts` | AC-036, AC-040, AC-041, AC-044, AC-046, AC-053 | P3 |
| T002 | Strapi content model: `plan` collection (draft and publish, `active` default `true`, `recommended` default `false`) with core router `find`/`findOne`, controller and service; components `plan.coverage`, `plan.benefit`, `country.plan-copy`; `Country.planCopy` and `Country.plans`; `FormField.pricingInput`; regenerate and commit types; extend conformance tests (`plans` excluded like `steps`; plan, components, plan copy, `PRICING_INPUTS` enum) | `apps/cms/src/api/plan/**`, `apps/cms/src/components/plan/{coverage,benefit}.json`, `apps/cms/src/components/country/plan-copy.json`, `apps/cms/src/api/country/content-types/country/schema.json`, `apps/cms/src/api/form-field/content-types/form-field/schema.json`, `apps/cms/types/generated/*.d.ts`, `apps/cms/src/content-model.test.ts`, `apps/cms/src/content-model.test-d.ts` | AC-036, AC-037, AC-039, AC-040, AC-041, AC-044 | T001; R2 confirmed with `strapi-docs-mcp` |
| T003 | Price-quote API without content type: route `POST /api/quote/price` (`quote.price`), thin controller with `priceQuoteRequestSchema` and generic 400/404 bodies, service reading the published, active plan of the country by `documentId`, pure `finalPrice` rule with named brackets and integer arithmetic (D2); no writes, no logging of inputs; tests with a fake Strapi (document reads only, spy logger) | `apps/cms/src/api/quote/routes/quote.ts`, `apps/cms/src/api/quote/controllers/quote.ts`, `apps/cms/src/api/quote/services/{quote,price-rule}.ts`, `apps/cms/src/api/quote/**/*.test.ts` | AC-043, AC-045, AC-046 | T002 |
| T004 | Public role: add `api::plan.plan` to `PUBLIC_READ_CONTENT_TYPES` and `api::quote.quote.price` as the only endpoint action; update the exact-list and idempotence tests | `apps/cms/src/bootstrap/public-permissions.ts`, `apps/cms/src/bootstrap/public-permissions.test.ts` | AC-066 | T002, T003 |
| T005 | Seed: plan copy and three plans per country exactly as AC-064 and AC-065 (COP and CLP, order, recommended, first plan without benefits, ≥ 2 coverages with ≥ 1 highlight, fictitious Spanish texts, annual-price copy); `pricingInput` on the shared `birthDate()` and `vehicleYear()` helpers; `createField` passes the mark; `createCountry` creates published plans; seed tests against the shared schemas | `apps/cms/src/seed/countries.ts`, `apps/cms/src/seed/index.ts`, `apps/cms/src/seed/seed.test.ts` | AC-064, AC-065, AC-036, AC-038 | T002 |
| T006 | Content reading: `RawWizardContent.plans`; `populate[planCopy]`; third parallel request to `/api/plans` filtered by country code and `active`, sorted by `order` then `createdAt`, page size 100, coverages and benefits populated, no cache, no token; `toWizardContent(code, country, steps, plans)`; fixtures and `FakeContentReader` with plans | `apps/web/src/app/core/content/{content-reader,strapi-content-reader,wizard-content}.ts` and specs, `apps/web/src/testing/content-fixtures.ts` | AC-036, AC-039, AC-041, AC-059 | T001 |
| T007 | Prices: pure `formatPrice` (`Intl`, no decimals); `PriceQuote` interface and `PRICE_QUOTE` token; `StrapiPriceQuote` (POST body from the request schema only, response validated, abort support) provided in `app.config.ts`; pure `pricingInputs` from the marks with `parseIsoDate` and `ageInYears`; `FakePriceQuote` for tests | `apps/web/src/app/shared/utils/format-price.ts` and spec, `apps/web/src/app/core/quote/{price-quote,strapi-price-quote,pricing-inputs}.ts` and specs, `apps/web/src/app/app.config.ts`, `apps/web/src/testing/content-fixtures.ts` | AC-042, AC-044, AC-045, AC-046, AC-047, AC-066 | T001 |
| T008 | Wizard state: `reconcile(stored, content, today)` keeps `plan` only when offered and drops its final price when form values changed (D8); `isStepComplete` for `plans`; `resolveStep` unchanged in shape; store `load(code, content, today)`, `choosePlan`, `discardFinalPrice`, `storeFinalPrice` (only for the chosen id), `confirmStep` drops the price on changed values; update CHG-001 specs whose expectations change | `apps/web/src/app/core/wizard-state/{wizard-data,wizard-state}.ts` and specs | AC-048, AC-049, AC-053, AC-054, AC-055, AC-056 | T001 |
| T009 | Shell contract: `StepContext.content` and `advance(slug)`; `STEP_HEADING_ID` on the step `h1`; `load` passes plans and content; `confirm` stores then advances; update `wizard-shell.spec.ts` (plans in loading, unavailable, invalid; summary address redirect to the plan step; progress marks the plan step complete) | `apps/web/src/app/features/wizard/shell/{step-context,wizard-shell}.ts`, `wizard-shell.html`, `wizard-shell.spec.ts` | AC-050, AC-056, AC-059 | T006, T008 |
| T010 | Plan list step: container `PlanList` (chosen plan, quote `resource` keyed by plan and attempt, request on every display and choice, waiting, final price, error and retry, `aria-disabled` continue with message and focus rules, single advance, no-plans state, back link, no unconfirmed values, no `beforeunload`), presentational `PlanCard`, `plan-view.ts` view models (single distinguished recommended plan, formatted prices); register `plans: PlanList`; responsive grid, ≥ 24 px targets, `motion-safe` spinner, no transitions under reduced motion; component tests with fixtures of both countries | `apps/web/src/app/features/wizard/steps/plan-list/{plan-list.ts,components/plan-card.ts,models/plan-view.ts}` and specs, `apps/web/src/app/features/wizard/shell/step-registry.ts` | AC-037, AC-038, AC-040, AC-045, AC-047, AC-048, AC-049, AC-050, AC-051, AC-052, AC-053, AC-057, AC-058, AC-060, AC-061, AC-062, AC-063 | T007, T009 |
| T011 | End-to-end support: `globalSetup` sharing one test-only admin credential through `process.env` (D14); `StrapiAdmin` generalized by model with plan methods; `plan-changes` serial project depending on `content-changes`, ignored by `mobile` and `desktop`; seeded plan and copy constants, `reachPlans`, plan locators; `birthDateForAge`; layout helpers moved to `support/layout.ts` | `e2e/playwright.config.ts`, `e2e/tests/support/{global-setup,strapi-admin,wizard,dates,layout}.ts`, `e2e/tests/accessibility.spec.ts` (imports only) | — (supports T012, T013) | T003, T004, T005, T010 |
| T012 | End-to-end specs that do not change content, titles starting with AC IDs: `plan-list-content.spec.ts` (AC-036 seed part, AC-037, AC-038, AC-042, AC-064, AC-065), `plan-selection.spec.ts` (AC-045, AC-047, AC-048, AC-050, AC-051; marks of AC-064 and AC-065), `plan-navigation.spec.ts` (AC-053, AC-054, AC-056, AC-057), `plan-accessibility.spec.ts` (AC-060, AC-062), `content-states.spec.ts` (+ AC-059), `privacy.spec.ts` (+ AC-046 and the no-token part of AC-066), `public-access.spec.ts` (+ AC-066); re-run the CHG-001 specs | `e2e/tests/{plan-list-content,plan-selection,plan-navigation,plan-accessibility,content-states,privacy,public-access}.spec.ts` | AC-036, AC-037, AC-038, AC-042, AC-045, AC-046, AC-047, AC-048, AC-050, AC-051, AC-053, AC-054, AC-056, AC-057, AC-059, AC-060, AC-062, AC-064, AC-065, AC-066 | T011 |
| T013 | End-to-end spec that changes content through the test-only credential, serial, seed restored in `afterAll`: inactive and draft plan per country never shown (AC-036); add, reorder, deactivate, change base price and recommended, reload (AC-039); all Chile plans deactivated → no-plans message, back only, summary unreachable, axe scan (AC-058, AC-060) | `e2e/tests/plan-changes.spec.ts` | AC-036, AC-039, AC-058, AC-060 | T011 |
| T014 | Verification: `npm run format:check` and `npm run lint` clean; `run verify` with the profile checks on the candidate (the `e2e` check recreates the stack); hand over the declared manual checks (AC-061, AC-062, AC-063) | — (records under `.roclec/` are created by Roclec commands only) | all (AC-036 to AC-066) | T001 to T013 |

## Meaningful verification and observations

- Profile mapping: `acceptance_ids` of `shared-unit`, `web-unit`, `cms-unit` and `e2e` in `.roclec/project.toml` now include AC-036 to AC-066 as in plan.md, "Applicable AC verification". No command changed.
- Verified only end to end: AC-039. Verified only by unit tests: AC-043, AC-049, AC-052, AC-055.
- Declared manual observations, recorded in Roclec with the AC ID by a person:
  - AC-061: keyboard-only use of the plan step for Colombia and Chile (reach every plan, choose, change, retry after a price error, back, continue; focus visible; no trap).
  - AC-062: plan step at 375 and 1280 px for both countries (also automated).
  - AC-063: reduced motion while choosing, changing the choice, waiting for and receiving the final price, and when messages appear.
- Every automated test title starts with its AC ID (verification reference).

## Rollout and operational follow-up

- Before the first end-to-end run: `docker compose down -v`, then `docker compose up --build` (plan D13). A database seeded by CHG-001 has no plan copy and shows the "not available" state.
- No secrets or environment variables are added; the end-to-end credential variables already exist in `.env.example`.
- Release: CHG-002 joins `v0.1.0` of `app` with CHG-001; US-03 completes the summary step before that release is published (owner answer Q13).
- Follow-up outside this change: the architecture reference may list the `Plan` attributes, `country.plan-copy` and `pricingInput` (as CHG-001's model shape, plan Q6 of CHG-001), through `foundation agree` if the owner wants it.

Checkboxes are notes; runs/evidence, native gates and integration/publication records own lifecycle progress.
