# Work items for CHG-001

Owner of every work item: component `app`. Proposal digest `3c6df305a8fa0075571146e6906deca182c864031e8eb64e24605b7bd6064192`; design and decisions in [plan.md](plan.md). AC IDs refer to the CAP-001 snapshot `d9a109a9933d4153ee9a5295d15a679e3561ced3e0104bcbf99c35f5fe2120fb`; their text is not copied here.

## Prerequisites and dependency order

- [x] P1. Coordinator resolves open questions Q1 and Q2 of the plan (profile inputs for `packages/shared` and the root lockfile; profile checks). Q1 blocks T001.
- [ ] P2. Coordinator obtains the `pre-implement` checkpoint (CR-011) for this plan and tasks.
- [ ] P3. Answers to Q3 (T010), Q4 (T016), Q5 (T005), Q6 and Q7 (T001, T002) and Q8 (T002).

Order (a task starts when the tasks it depends on are done):

```
T001 ─┬─ T002 ─┬─ T003
      │        └─ T004
      ├─ T006 ─── T007
      └─ T005
T008
T005, T007, T008 ─── T009, T010 ─── T011 ─── T012
T003, T004, T009 to T012 ─── T014 ─── T015, T016 ─── T017
```

## Implementation by component

All items: component `app`.

| ID | Work item | Paths | ACs | Depends on |
| --- | --- | --- | --- | --- |
| T001 | Shared Zod schemas and inferred types: Strapi envelope, country summary and detail, wizard copy (all labels required), theme (separate), form field with option and validation, wizard step, wizard content refinement (ADR-001 sequence, unique slugs per country, unique field names per step, `min <= max`, compilable pattern, select with options), session storage wizard data. Fixtures for Colombia and Chile; valid and invalid tests | `packages/shared/src/index.ts`, `packages/shared/src/content/*.ts`, `packages/shared/src/wizard-data.ts`, `packages/shared/src/**/*.spec.ts` | AC-017, AC-034 (copy required), AC-003 (theme), AC-004, AC-012 (validation shape) | P1 (Q1), Q6, Q7 |
| T002 | Strapi content model: `Country`, `WizardStep`, `FormField` collections with draft and publish and the relations of plan.md; components `country.theme`, `country.wizard-copy`, `form.option`, `form.validation`; core routes, controllers and services; regenerate and commit types; type-level conformance test (Q7) | `apps/cms/src/api/{country,wizard-step,form-field}/**`, `apps/cms/src/components/{country,form}/*.json`, `apps/cms/types/generated/*.d.ts` | AC-004, AC-006, AC-007, AC-031, AC-032 | T001, Q6, Q8 |
| T003 | Public role permissions applied idempotently in `bootstrap`: `find` and `findOne` on the three content types only | `apps/cms/src/bootstrap/public-permissions.ts`, `apps/cms/src/index.ts` | AC-001, AC-004 (read access); P4 | T002 |
| T004 | Seed module for Colombia and Chile run only when no `Country` exists, published, fictitious; seed data test against the shared schemas | `apps/cms/src/seed/index.ts`, `apps/cms/src/seed/countries.ts`, `apps/cms/src/seed/seed.test.ts`, `apps/cms/src/index.ts` | AC-031, AC-032, AC-013 and AC-014 (seeded rules), AC-003 (seeded theme) | T002 |
| T005 | Runtime config (`config.json`, loader, validation); `ContentReader` interface, `CONTENT_READER` token and Strapi HTTP implementation with country-filtered requests; pure `toWizardContent` (exact code match, Zod validation, stable order); fallback copy module; `CLOCK` token; router config `canceledNavigationResolution: 'computed'` | `apps/web/public/config.json`, `apps/web/src/app/core/config/app-config.ts`, `apps/web/src/app/core/content/{content-reader,strapi-content-reader,wizard-content,fallback-copy}.ts` and specs, `apps/web/src/app/core/clock.ts`, `apps/web/src/app/app.config.ts` | AC-002, AC-004, AC-007 (no cache), AC-017, AC-026 (requests carry only the country code) | T001, Q5 |
| T006 | Pure field validation rules: empty, text (trimmed length and full-match pattern), number (numeric, whole, min, max), age with 29 February rule, relative year range, combined validator with inclusive limits | `apps/web/src/app/shared/utils/field-validation/*.ts` and `*.spec.ts` | AC-012, AC-013, AC-014 | T001 |
| T007 | Wizard state store per country mirrored to `sessionStorage` (`wizard:{code}`), validated on read; pure `reconcile`, `isStepComplete`, `firstIncompleteStep`, `hasUnconfirmedValues` | `apps/web/src/app/core/wizard-state/{wizard-state,wizard-data,unconfirmed-values}.ts` and specs | AC-019, AC-020, AC-022, AC-023, AC-024, AC-025, AC-026, AC-033 (detection) | T001, T006 |
| T008 | Theme resolution and application (`--primary`, `--accent`, logo or placeholder); presentational UI: loader with status label and reduced-motion variant, announced status message with optional action, Spartan helm wrappers (button, label, input, checkbox, alert dialog) written under `shared/ui/` without leaving `components.json` (R7); `styles.css` muted mapping and reduced motion; `index.html` fallback title | `apps/web/src/app/core/country/theme.ts` and spec, `apps/web/src/app/shared/ui/**`, `apps/web/src/styles.css`, `apps/web/src/index.html`, `apps/web/tsconfig.json` (helm path alias, if any) | AC-003, AC-015, AC-016, AC-017 (message), AC-029 (target sizes), AC-030 | — |
| T009 | Country selection: route `''` with fallback title, container with countries resource and states, presentational country list | `apps/web/src/app/app.routes.ts`, `apps/web/src/app/features/country-selection/**` | AC-001, AC-015, AC-016, AC-017 | T005, T008 |
| T010 | Wizard shell: route `':country'` with optional `:step` and catch-all; content resource keyed by code; loading, unavailable with retry, invalid, unknown country states; theme and page title; step resolution (`/{code}` per Q3, later or unknown step → first incomplete with `replaceUrl`); progress indicator; back link (none on the first step); step registry with `form` only; heading focus after a step change | `apps/web/src/app/app.routes.ts`, `apps/web/src/app/features/wizard/shell/{wizard-shell,step-registry}.ts`, `.../shell/components/progress-indicator.ts`, specs | AC-002, AC-003, AC-004, AC-008, AC-015, AC-016, AC-017, AC-019, AC-020, AC-024 | T005, T007, T008, Q3 |
| T011 | Form step: Signal Forms schema builder from field configuration (R6), dynamic field by type with label, required marker, help, error with icon and associations; error visibility rules; `aria-disabled` continue kept focusable, focus to first invalid field; single advance; confirm values into the store and navigate; empty-step message; fixtures for both countries | `apps/web/src/app/features/wizard/steps/form-step/{form-step.ts,services/field-form.ts,components/dynamic-field.ts,models/field-view.ts}` and specs | AC-004, AC-005, AC-006, AC-008, AC-009, AC-010, AC-011, AC-012, AC-013, AC-014, AC-018, AC-019, AC-021, AC-027 | T006, T007, T010 |
| T012 | Leave confirmation: `beforeunload` handler in the form step (only with unconfirmed values); scoped `LeaveConfirmation` service; `leaveWizardGuard` on `:country` (asks only when leaving to the root or another country); leave dialog with Strapi copy, focus on stay, Escape = stay, focus restore and containment; discard unconfirmed values on leave and on same-country moves | `apps/web/src/app/features/wizard/shell/{leave-guard,leave-confirmation}.ts`, `.../shell/components/leave-dialog.ts`, `.../steps/form-step/form-step.ts`, `apps/web/src/app/app.routes.ts`, specs | AC-008, AC-022, AC-033, AC-034, AC-035, AC-027, AC-028, AC-030 | T010, T011 |
| T013 | Remove or update the scaffold `app.spec.ts` if the root template changes; keep `npm run lint` and `npm run format:check` clean for the touched packages | `apps/web/src/app/app.ts`, `apps/web/src/app/app.html`, `apps/web/src/app/app.spec.ts` | — | T009 to T012 |
| T014 | End-to-end support: page helpers by role and label, date boundary helpers computed in the browser, `content-changes` project (serial, depends on `mobile` and `desktop`) | `e2e/tests/support/{wizard,dates}.ts`, `e2e/playwright.config.ts` | — | T003, T004, T009 to T012 |
| T015 | End-to-end specs, titles starting with AC IDs, both countries where the AC says so: `country-selection.spec.ts` (AC-001, AC-002), `form-step-content.spec.ts` (AC-004, AC-006, AC-031, AC-032), `form-step-validation.spec.ts` (AC-009, AC-011, AC-013, AC-014), `wizard-navigation.spec.ts` (AC-019, AC-020, AC-022, AC-023, AC-024, AC-035), `leave-confirmation.spec.ts` (AC-033, AC-034; R1), `content-states.spec.ts` (AC-016), `privacy.spec.ts` (AC-026), `accessibility.spec.ts` (AC-027, AC-029) | `e2e/tests/*.spec.ts` | AC-001, AC-002, AC-004, AC-006, AC-009, AC-011, AC-013, AC-014, AC-016, AC-019, AC-020, AC-022, AC-023, AC-024, AC-026, AC-027, AC-029, AC-031, AC-032, AC-033, AC-034, AC-035 | T014 |
| T016 | AC-007 end-to-end: add an optional field, reorder, unpublish, keep a draft-only field; assert after reload; restore in `afterAll`; test-only Strapi client in Node | `e2e/tests/content-changes.spec.ts`, `e2e/tests/support/strapi-admin.ts` | AC-007 | T014, Q4 |
| T017 | Verification: `run verify` with the profile checks on the candidate; run the end-to-end suite against a fresh stack (`docker compose down -v`, `docker compose up --build`); hand over the declared manual checks | — (records under `.roclec/` are created by Roclec commands only) | all | T001 to T016 |

## Meaningful verification and observations

- Configured checks today: `web-unit` (unit and component tests of `apps/web` with the 80 % line minimum on `core/` and `shared/utils/`), `web-build`, `cms-build`. The AC mapping per check is the table in plan.md, "Applicable AC verification".
- Not executed by any current profile check (plan Q2): `packages/shared` schema tests (AC-017 schema half), `apps/cms` seed and conformance tests (AC-031, AC-032), lint and format, and the whole end-to-end and accessibility suite (AC-001, AC-002, AC-004, AC-006, AC-007, AC-009, AC-011, AC-013, AC-014, AC-016, AC-019, AC-020, AC-022, AC-023, AC-024, AC-026, AC-027, AC-029, AC-031 to AC-035 end-to-end halves).
- Declared manual observations, recorded in Roclec with the AC ID by a person:
  - AC-003: seeded themes of Colombia and Chile at 375 and 1280 px.
  - AC-028: keyboard-only completion for Colombia and Chile, including the leave dialog.
  - AC-029: layout at 375 and 1280 px for both countries, with and without errors.
  - AC-030: reduced motion on step change, error display, loader and leave dialog.
- Every automated test title starts with its AC ID (verification reference).

## Rollout and operational follow-up

- Before the first end-to-end run, remove the scaffold volume: `docker compose down -v`, then `docker compose up --build`.
- No secrets are added; `apps/cms/.env.example` and `.env.example` change only if Q4 or Q5 introduce variables (names without values).
- Follow-ups outside this change: update `docs/design.md` for the `muted` token (plan Q9); US-02 and US-03 register their step components in `STEP_COMPONENTS` and add plan and terms types.

Checkboxes are notes; runs/evidence, native gates and integration/publication records own lifecycle progress.
