# Work items for CHG-003

Owner of every work item: component `app`. Proposal digest `7accb35a366cb95f381d78714ee8a0db6096052ee5bd44abeb19c19348b66615`. Design and decisions are in [plan.md](plan.md). AC IDs refer to the CAP-003 snapshot `f5362186c534c567b96ed8755910b794ad6d13bc76a738ce6ce9acecd79f80b3` and, for AC-097, to the CAP-002 snapshot `f29abb81f63df4683cf63f9bdb62da57d2b93b092b57e0fa2ccada61e64aeb42`; their text is not copied here. Every code path is inside the `app` inputs of `.roclec/project.toml`.

## Prerequisites and dependency order

- [x] P1. CHG-001 and CHG-002 are integrated for `app` (CAP-001 `d9a109a9…` and CAP-002 `c8a973e7…` in `current.json`).
- [x] P2. The coordinator assigned CHG-003 to planning release `v0.1.0` of `app` on `main` (owner answer Q16; plan Q3).
- [ ] P3. The coordinator obtains the `pre-implement` checkpoint (CR-011) for this plan and these tasks.
- [x] P4. The owner answered plan open question Q1: an unchecked optional checkbox is listed as yes or no (T011).
- [x] P5. The owner decided the implementer applies the profile mapping in T015 (plan Q2).
- [ ] P6. R1 confirmed with `angular-developer` before T010, and R2 confirmed with `strapi-docs-mcp` before T002 and T003.
- [ ] P7. The local stack is recreated before the first end-to-end run with `docker compose down -v` (plan D20).

Order: a task starts when the tasks it depends on are done.

```
T001 ─┬─ T002 ─┬─ T003 ─┐
      │        ├─ T004 ◄┘
      │        └─ T005
      ├─ T006 ─┐
      ├─ T008  │
      └─ T009 ─┴─ T010
T007
T007, T008, T010 ─── T011
T003, T004, T005, T011 ─── T012 ─┬─ T013
                                 └─ T014
T015 (any time after P5)
T001 to T015 ─── T016
```

## Implementation by component

All items: component `app`.

| ID | Work item | Paths | ACs | Depends on |
| --- | --- | --- | --- | --- |
| T001 | **Shared contract:** `summaryCopySchema` (24 texts) and `countryDetailSchema.summaryCopy`; `FIELD_KINDS`, `FIELD_KIND_FIELD_TYPES` and `formFieldSchema.kind` with the text-only rule; `content/terms.ts` (exactly one non-blank entry); `wizardContentSchema.terms` and the exactly-one `identityDocumentNumber` refinement; `payment.ts` (strict request, `QUOTE_NUMBER_PATTERN`, discriminated response); `storedConfirmationSchema` and optional `wizardDataSchema.confirmation`. Also exports, fixtures for both countries, and valid and invalid tests (each rule broken once) | `packages/shared/src/content/{country,form-field,terms,wizard-content}.ts`, `packages/shared/src/{payment,wizard-data,index,test-fixtures}.ts`, `packages/shared/src/**/*.spec.ts` | AC-069, AC-073, AC-077, AC-079, AC-081, AC-084, AC-085 | P3 |
| T002 | **Strapi content model:** `terms` API (content type `term`, draft and publish, `country` many-to-one, `text` required) with core router `find`/`findOne`, controller and service; component `country.summary-copy`; `Country.summaryCopy` and `Country.terms`; `FormField.kind` enumeration. Regenerate and commit types. Extend the conformance tests (`terms` excluded like `steps` and `plans`; terms, summary copy and `FIELD_KINDS` enum) | `apps/cms/src/api/terms/**`, `apps/cms/src/components/country/summary-copy.json`, `apps/cms/src/api/country/content-types/country/schema.json`, `apps/cms/src/api/form-field/content-types/form-field/schema.json`, `apps/cms/types/generated/*.d.ts`, `apps/cms/src/content-model.test.ts`, `apps/cms/src/content-model.test-d.ts` | AC-069, AC-073, AC-074, AC-077 | T001; P6 (R2) |
| T003 | **Payment endpoint:** route `POST /api/quote/pay` (`quote.pay`); controller `pay` with `paymentRequestSchema`, a generic 400, and 200 `approved` or `rejected`; private `findOfferedPlan` shared by `price` and `pay`; pure `quote-number.ts` with injected clock and pick. No writes and no logging of inputs. Tests with the fake Strapi (document reads only, spy logger), fixed clock and pick | `apps/cms/src/api/quote/routes/quote.ts`, `apps/cms/src/api/quote/controllers/quote.ts`, `apps/cms/src/api/quote/services/{quote,quote-number}.ts`, `apps/cms/src/api/quote/**/*.test.ts` | AC-079, AC-080, AC-084 | T002; P6 (R2) |
| T004 | **Public role:** add `api::terms.term` to `PUBLIC_READ_CONTENT_TYPES` and `api::quote.quote.pay` to `PUBLIC_ENDPOINT_ACTIONS`. Update the exact-list and idempotence tests and retitle them from AC-066 to AC-082. Update the comments in `routes/quote.ts` and `public-permissions.ts` | `apps/cms/src/bootstrap/public-permissions.ts`, `apps/cms/src/bootstrap/public-permissions.test.ts`, `apps/cms/src/api/quote/routes/quote.ts` | AC-082 | T002, T003 |
| T005 | **Seed:** summary copy per country (texts of AC-094, different where the prototype differs); one published, fictitious terms entry per country (≥ 2 paragraphs, different); `kind: 'identityDocumentNumber'` on `numero-documento` and `rut` only; `createField` passes `kind`; `createCountry` creates the published terms. Seed tests against the shared schemas | `apps/cms/src/seed/countries.ts`, `apps/cms/src/seed/index.ts`, `apps/cms/src/seed/seed.test.ts` | AC-094, AC-095 | T002 |
| T006 | **Content reading:** `RawWizardContent.terms`; `populate[summaryCopy]`; fourth parallel request to `/api/terms` filtered by country code, `fields[0]=text`, page size 100, no cache, no token; `toWizardContent(code, country, steps, plans, terms)`. Fixtures and `FakeContentReader` with terms, summary copy and kinds | `apps/web/src/app/core/content/{content-reader,strapi-content-reader,wizard-content}.ts` and specs, `apps/web/src/testing/content-fixtures.ts` | AC-073, AC-077 | T001 |
| T007 | **Pure utilities:** `maskIdentityDocument` and `formatCalendarDate`, with specs (AC examples; locales es-CO and es-CL compared with `Intl`; `TZ` west and east of UTC, R4) | `apps/web/src/app/shared/utils/{mask-identity-document,format-calendar-date}.ts` and specs | AC-068, AC-069 | — |
| T008 | **Payment client:** `Payment` interface and `PAYMENT` token; `StrapiPayment` (body only from `paymentRequestSchema`, no authorization, `no-store`, abort, answer validated, 400 or invalid rejects) provided in `app.config.ts`; `FakePayment` for tests. Retitle `strapi-price-quote.spec.ts` from AC-066 to AC-097 and update the comment in `strapi-price-quote.ts` | `apps/web/src/app/core/payment/{payment,strapi-payment}.ts` and spec, `apps/web/src/app/app.config.ts`, `apps/web/src/testing/content-fixtures.ts`, `apps/web/src/app/core/quote/strapi-price-quote{,.spec}.ts` | AC-078, AC-079, AC-081, AC-097 | T001 |
| T009 | **Wizard state:** `withPlan` preserves other keys; `withConfirmation` and `withoutConfirmation`; drop rules in `withChosenPlan` (different plan), `reconcile` (plan dropped, values changed, `planId` mismatch); `isStepComplete` with a confirmation (D9). Store: `confirmStep` drops the confirmation on changed values, `choosePlan` on a different plan; `storeConfirmation` (only for the chosen plan) and `startNewQuote`. Update the CHG-001 and CHG-002 specs whose expectations change | `apps/web/src/app/core/wizard-state/{wizard-data,wizard-state}.ts` and specs | AC-083, AC-085, AC-086, AC-087, AC-088 | T001 |
| T010 | **Shell contract and leave:** `StepContext.setHeading` and `trackProcessing`; `LeaveDialogCopy`; `LeaveConfirmation.ask(copy: LeaveDialogCopy)` and `LeaveDialog` context; `WizardShell` (terms in `load`, heading and title override, `canLeave` with the processing rule, copy mapping); `runGuardsAndResolvers: 'always'` on `:country`; progress indicator with every step complete (D17); `FakeStepContext`. Specs: shell (terms states, processing asks for in-wizard, root and other-country targets, no ask otherwise, one dialog per navigation), leave confirmation, progress indicator | `apps/web/src/app/features/wizard/shell/{step-context,wizard-shell,leave-confirmation}.ts`, `wizard-shell.html`, `components/{leave-dialog,progress-indicator}.ts` and specs, `apps/web/src/app/app.routes.ts`, `apps/web/src/testing/fake-step-context.ts` | AC-077, AC-083, AC-089, AC-096 | T006, T009; P6 (R1) |
| T011 | **Summary step:** container `Summary` (sections, plan section, edit, change plan and back links, terms checkbox, pay with single-flight and lock, accept message, payment error, processing status, `trackProcessing`, `beforeunload` only while processing, abort on destroy, confirmation view with `setHeading` and focus rules (N3), new quote). Presentational `SummarySection`, `TermsDialog` and `ConfirmationPanel`. Models `summary-view.ts` (checkbox rule per P4) and `terms-paragraphs.ts`. Register `summary: Summary`. Responsive single column, ≥ 24 px targets, `motion-safe` spinner, no dialog motion under reduced motion. Component tests with fixtures of both countries | `apps/web/src/app/features/wizard/steps/summary/{summary.ts,components/{summary-section,terms-dialog,confirmation-panel}.ts,models/{summary-view,terms-paragraphs}.ts}` and specs, `apps/web/src/app/features/wizard/shell/step-registry.ts` | AC-067, AC-068, AC-069, AC-070, AC-071, AC-072, AC-073, AC-074, AC-075, AC-076, AC-078, AC-081, AC-083, AC-085, AC-087, AC-089, AC-090, AC-092, AC-093, AC-096 | T007, T008, T010; P4 |
| T012 | **End-to-end support:** `terms-changes` serial project depending on `plan-changes`, ignored by `mobile` and `desktop`; terms methods in `StrapiAdmin`; `SEEDED_SUMMARY_COPY`, `SEEDED_TERMS`, `reachSummary`, summary locators and `holdPayment` (delay, release, reject, abort, count); 320 px overflow helper | `e2e/playwright.config.ts`, `e2e/tests/support/{strapi-admin,wizard,layout}.ts` | — (supports T013, T014) | T003, T004, T005, T011 |
| T013 | **End-to-end specs that do not change content** (titles start with AC IDs): `summary-content.spec.ts` (AC-067, AC-069, AC-070, AC-074 seeded part, AC-094, AC-095); `summary-navigation.spec.ts` (AC-071, AC-072, AC-085, AC-086, AC-087, AC-088, AC-089); `summary-payment.spec.ts` (AC-076, AC-078, AC-081, AC-083, AC-084); `summary-leave.spec.ts` (AC-096, R3); `summary-accessibility.spec.ts` (AC-075, AC-090, AC-092); `content-states.spec.ts` (+ AC-077); `privacy.spec.ts` (+ AC-079, AC-082 no-auth part; AC-066 → AC-097); `public-access.spec.ts` (AC-066 → AC-082; terms readable, payment without a token, terms writes refused). Re-run the CHG-001 and CHG-002 specs | `e2e/tests/{summary-content,summary-navigation,summary-payment,summary-leave,summary-accessibility,content-states,privacy,public-access}.spec.ts` | AC-067, AC-069, AC-070, AC-071, AC-072, AC-074, AC-075, AC-076, AC-077, AC-078, AC-079, AC-081, AC-082, AC-083, AC-084, AC-085, AC-086, AC-087, AC-088, AC-089, AC-090, AC-092, AC-094, AC-095, AC-096, AC-097 | T012 |
| T014 | **End-to-end spec that changes content** through the test-only credential, serial, with the seed restored in `afterAll`: one country's terms changed and published, then shown after reload; a draft terms entry never shown | `e2e/tests/terms-changes.spec.ts` | AC-074 | T012 |
| T015 | **Profile mapping:** `acceptance_ids` of `shared-unit`, `web-unit`, `cms-unit` and `e2e` as in plan.md, "Applicable AC verification" (add AC-067 to AC-097 as listed and remove AC-066). No command changes | `.roclec/project.toml` (outside this plan stage's write paths; only with the authorization of P5) | all (mapping only) | P5 |
| T016 | **Verification:** `npm run format:check` and `npm run lint` clean, then `run verify` with the profile checks on the candidate (`npm run check` scope plus the `e2e` check, which recreates the stack). Hand over the declared manual checks (AC-091, AC-092, AC-093) | — (records under `.roclec/` are created by Roclec commands only) | all (AC-067 to AC-097) | T001 to T015 |

## Meaningful verification and observations

- **Coverage:** every AC from AC-067 to AC-097 appears in at least one work item and in the verification table of plan.md. Cross-check by AC:
  - REQ-014: AC-067 to AC-073 (T001, T006, T007, T011, T013).
  - REQ-015: AC-074 to AC-077 (T001, T002, T006, T010, T011, T013, T014).
  - REQ-016: AC-078 to AC-082 (T001, T003, T004, T008, T011, T013).
  - REQ-017: AC-083 to AC-087 (T001, T003, T009, T010, T011, T013).
  - REQ-018: AC-088, AC-089, AC-096 (T009, T010, T011, T013).
  - REQ-019: AC-090 to AC-093 (T011, T013, manual).
  - REQ-020: AC-094, AC-095 (T005, T013).
  - REQ-009 (CAP-002): AC-097 (T008, T013).
- **Unit-only and end-to-end-only ACs:** AC-073 and AC-080 are verified only by unit tests. AC-068 has a unit test only (its values are also visible in `summary-content.spec.ts`). No AC is verified only end to end.
- **Retired:** AC-066 is no longer claimed by any test title or profile check after T004, T008, T013 and T015.
- **Declared manual observations,** recorded in Roclec with the AC ID by a person:
  - AC-091: keyboard-only use of the summary, the terms dialog, the leave dialog, payment error and retry, and the new quote, for Colombia and Chile.
  - AC-092: the summary, the dialogs, the payment error and the confirmation at 375 and 1280 px for both countries (also automated at 320 and 375 px).
  - AC-093: reduced motion for both dialogs, the processing indicator and the confirmation appearing.
- Every automated test title starts with its AC IDs (verification reference).

## Rollout and operational follow-up

- Before the first end-to-end run: `docker compose down -v`, then `docker compose up --build` (plan D20). A database seeded by CHG-002 has no summary copy, terms or identity document kind, and shows the "not available" state.
- No secrets or environment variables are added. The end-to-end admin credential variables already exist in `.env.example`.
- Release: CHG-003 is expected to join `v0.1.0` of `app` with CHG-001 and CHG-002 (owner answer Q16). The coordinator assigns it on `main` (P2).
- Follow-up outside this change: if the owner wants it, the architecture reference may list the `Terms` attributes, `country.summary-copy` and `FormField.kind`, through `foundation agree` (as CHG-002 noted for its model).

Checkboxes are notes; runs/evidence, native gates and integration/publication records own lifecycle progress.
