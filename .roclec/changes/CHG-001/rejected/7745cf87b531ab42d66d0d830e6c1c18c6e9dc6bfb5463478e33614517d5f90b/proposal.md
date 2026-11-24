# CHG-001: Policyholder and vehicle data form (US-01)

## Intent

Deliver step 1 of the quoting wizard: the person opens the application in the context of Colombia or Chile and fills in their own data and their vehicle's data in form steps whose fields, types, validations, copy and order come from Strapi per country. The form validates every field with its configured rules and messages, enforces the vehicle year and legal age rules, does not let the person advance while a field is invalid, and keeps the entered data when the person goes back or reloads. The change creates capability CAP-001, "Quoting wizard: country context and data capture", for component `app`.

## Origin and coverage

The origin is user story US-01 (kind `story`), captured verbatim in [sources/US-01.md](sources/US-01.md) with the stable criterion IDs BR-01 to BR-04 (business rules) and SC-01 to SC-04 (scenarios). `semantic.origins` and `semantic.coverage` in `change.json` are the authoritative records; this table summarizes them.

| Criterion | Status | Acceptance criteria |
| --- | --- | --- |
| BR-01 Field configuration attributes | covered | AC-004, AC-005, AC-009, AC-012 |
| BR-02 Select options from Strapi | covered | AC-006 |
| BR-03 Vehicle year limits | covered | AC-013 |
| BR-04 Legal age | covered | AC-014 |
| SC-01 Form configured by country | covered | AC-004, AC-031, AC-032 |
| SC-02 Field validation | covered | AC-009, AC-011 |
| SC-03 Configuration change without deployment | covered | AC-007 |
| SC-04 Keep data when going back | covered | AC-019, AC-020 |

No origin criterion is excluded or deferred.

Derived acceptance criteria (each addresses a gap of the story; reasons are in `semantic.coverage.derived`): AC-001, AC-002, AC-003, AC-008, AC-010, AC-015, AC-016, AC-017, AC-018, AC-021, AC-022, AC-023, AC-024, AC-025, AC-026, AC-027, AC-028, AC-029, AC-030.

## Gap checklist (story-spec)

| Topic | Gap in the story | Resolution |
| --- | --- | --- |
| Country | How the country context is chosen | ADR-001 (URL prefix, root selection): AC-001 |
| Country | Unknown, upper-case or unpublished country code (ADR-001 leaves it to the specs) | Derived AC-002; owner question Q5 |
| Country | Fields, identifiers and steps per country (cédula/placa vs RUT/patente; one vs two form steps) | AC-004 stated for both countries; seed AC-031, AC-032; owner question Q8 |
| Country | Country theme required by the design reference | Derived AC-003; owner question Q7 |
| Country | Currency and locale | Only seeded on the country entry here (AC-031, AC-032); no price or amount is shown in this step |
| States | Loading, Strapi unavailable, invalid content, form step without fields, unpublished content | Derived AC-015, AC-016, AC-017, AC-018; drafts never shown in AC-007 |
| Limits | Vehicle year bounds and inclusiveness, relative to which date | AC-013: Y−20 to Y+1 inclusive, current year of the device; owner question Q9 |
| Limits | Legal age value, inclusiveness, 29 February, future dates | AC-014: 18 configured per country, inclusive on the birthday; owner question Q9 |
| Limits | Which validations exist and whether limits are inclusive | AC-012 |
| Validation | Where rules and messages come from | Strapi, one configured message per field: AC-009, AC-012 |
| Validation | When errors appear, and how a disabled continue action relates to moving focus to the first invalid field | Derived AC-010, AC-011; owner question Q2 |
| Navigation | Direct entry to a later step, reload, browser back, double activation | Derived AC-021, AC-022, AC-024; AC-020 includes browser back; owner question Q4 |
| Data | Data per country, tab lifetime, configuration changed after data was stored, data leaving the browser | Derived AC-023, AC-025, AC-026 |
| Data | What follows the last form step (plan list, US-02) | Out of scope here; owner question Q3 |
| Copy | Copy of navigation and progress; copy shown before any country content exists | Derived AC-008; owner question Q6 |
| Accessibility | Labels, associations, focus, announcements, keyboard, contrast, targets, reduced motion | Derived AC-027, AC-028, AC-029, AC-030; focus and announcements in AC-011, AC-015 to AC-019 |
| Responsive | Widths 320, 375 and 1280 px | Derived AC-029 |

## Approved scope and exclusions

In scope, for component `app`:

- Country context from the address, country selection at the root and the unknown-country message (REQ-001).
- Form steps built from Strapi content, with the five field types, options, copy and published changes on reload (REQ-002).
- Field validation from Strapi, including vehicle year and legal age (REQ-003).
- Loading, unavailable, invalid and empty content states (REQ-004).
- Navigation between the country's steps, progress indicator, wizard data per country kept in the tab (REQ-005).
- Accessibility and responsive behavior of the form steps (REQ-006).
- Seed content for Colombia and Chile (REQ-007).

Excluded from this change:

- Rendering and behavior of the plan list step (US-02) and of the summary and payment step (US-03), price quote, simulated payment and terms. This change seeds those steps only as entries of each country's step sequence.
- Verification of the RUT check character against its number (pending owner question Q1).
- Any maximum age for the policyholder; no source states one.
- Request timeouts beyond the browser's own; a request that never fails stays in the loading state of AC-015.

## Exact bases by component/capability

| Capability | Component | Base revision |
| --- | --- | --- |
| CAP-001 | app | none (new capability; no integrated contract exists) |

## Requirements and acceptance

The authoritative texts are the files of the proposed CAP-001 snapshot: requirements REQ-001 to REQ-007 and acceptance criteria AC-001 to AC-032, each acceptance file stating its verification method. Short form:

| AC | REQ | Behavior | Verification |
| --- | --- | --- | --- |
| AC-001 | REQ-001 | Country selection at the root address | End-to-end test |
| AC-002 | REQ-001 | Unknown or unpublished country code shows a fallback message with a link to the root | End-to-end and unit test |
| AC-003 | REQ-001 | Country theme with fallback to the default theme | Unit test and declared manual check |
| AC-004 | REQ-002 | Only the country's published fields, in configured order | End-to-end test (both countries) and unit test |
| AC-005 | REQ-002 | Field presentation by configured type | Unit test (component) |
| AC-006 | REQ-002 | Select options from Strapi, none preselected | Unit and end-to-end test |
| AC-007 | REQ-002 | Published configuration change visible on reload; drafts never shown | End-to-end test |
| AC-008 | REQ-002 | Wizard copy comes from Strapi | Unit test (component) |
| AC-009 | REQ-003 | Configured error message next to the field | Unit and end-to-end test (both countries) |
| AC-010 | REQ-003 | Errors shown after leaving the field or trying to advance | Unit test (component) |
| AC-011 | REQ-003 | Step cannot advance while invalid; focus to first invalid field | End-to-end (both countries) and unit test |
| AC-012 | REQ-003 | Supported validations, inclusive limits | Unit test |
| AC-013 | REQ-003 | Vehicle year Y−20..Y+1 inclusive | Unit test (fixed date) and end-to-end test (both countries) |
| AC-014 | REQ-003 | Legal age 18, inclusive on the birthday | Unit test (fixed date) and end-to-end test (both countries) |
| AC-015 | REQ-004 | Loading state | Unit test (component) |
| AC-016 | REQ-004 | Strapi unavailable, with retry | Unit and end-to-end test |
| AC-017 | REQ-004 | Invalid content | Unit test |
| AC-018 | REQ-004 | Form step without fields | Unit test (component) |
| AC-019 | REQ-005 | Advance to the next step; focus and progress | End-to-end and unit test |
| AC-020 | REQ-005 | Data kept when going back (wizard and browser back) | End-to-end test (Chile) and unit test |
| AC-021 | REQ-005 | Single advance on repeated activation | Unit test (component) |
| AC-022 | REQ-005 | Reload keeps the step and completed data | End-to-end test |
| AC-023 | REQ-005 | Data per country and per tab | End-to-end test |
| AC-024 | REQ-005 | Direct entry to a later step | End-to-end and unit test |
| AC-025 | REQ-005 | Stored data reconciled with the current configuration | Unit test |
| AC-026 | REQ-005 | Entered data stays in the browser | End-to-end test |
| AC-027 | REQ-006 | Programmatic labels and automated accessibility scan | End-to-end test (both countries) |
| AC-028 | REQ-006 | Keyboard-only completion | Declared manual check |
| AC-029 | REQ-006 | Responsive layout and target size | End-to-end test and declared manual check |
| AC-030 | REQ-006 | Reduced motion | Declared manual check |
| AC-031 | REQ-007 | Seed content for Colombia | End-to-end test |
| AC-032 | REQ-007 | Seed content for Chile | End-to-end test |

## Normative deltas

Add REQ-001 to REQ-007 to the new capability CAP-001. Nothing is revised, replaced or retired.

## Components, dependencies and references

- Component: `app` (user-facing).
- Dependencies: none.
- Pinned agreed references: architecture, context, design, engineering, flow, principles, stack, verification. The CAP-001 snapshot pins ADR-001, context, design and principles.
- Architecture decisions: ADR-001 (accepted). The country is resolved from the first segment of the address, content is modeled per country with wizard steps as content, and wizard data lives in a signals store mirrored to session storage (architecture reference). No new architecture decision is needed by this change.

## Decisions, alternatives and unresolved questions

The derived acceptance criteria state a proposed resolution for each gap. The owner confirms or corrects them at the approve checkpoint:

- **Q1. RUT check character.** Should the Chilean RUT check character be verified against its number? Proposed: no; this change validates the format only through a configured pattern (AC-032). Verifying it needs a new kind of configured validation (AC-012).
- **Q2. Disabled continue action and focus on the first invalid field.** The design reference asks both for a call to action disabled until the step is valid and for focus to move to the first invalid field when the step cannot advance. Proposed reconciliation: disabled style and disabled state for assistive technologies, but still focusable, so that activating it shows the errors and moves focus (AC-011).
- **Q3. What follows the last form step before US-02 and US-03 exist.** Colombia's step 2 and Chile's step 3 are plan lists, which this change does not render. Proposed: release US-01 together with US-02 and US-03; end-to-end tests of this change stop when the person leaves the last form step.
- **Q4. Unconfirmed values on reload.** Proposed, following the architecture's request flow (a step stores its valid data when it is completed): values typed in the current step and not confirmed with continue are lost on reload (AC-022). The alternative keeps them as a draft.
- **Q5. Unknown, upper-case or unpublished country code.** Proposed: exact match only; anything else shows the "country not available" fallback with a link to the root (AC-002). Alternative: redirect to the root without a message.
- **Q6. Copy that exists before any country content.** The engineering reference allows front-end copy only for the fallback when content cannot be loaded or is invalid. The root page heading and the loading label have no country to take copy from. Proposed: treat them as part of that front-end fallback copy, in Spanish; the root page otherwise shows only the country names from Strapi. A global, non-country content entry instead would depart from ADR-001's per-country model and would need a proposed ADR.
- **Q7. Country theme in this change.** Proposed: deliver the per-country theme here because this is the first screen built (AC-003). A theme counts as invalid only when missing or malformed; contrast of the seeded themes is checked manually, not at runtime.
- **Q8. Seed content.** Proposed: the fields of ADR-001's illustrative table, with the formats of AC-031 and AC-032 (document number 6 to 10 digits; placa `ABC123`; RUT with optional dots and check character 0–9 or K; patente `BBBB12` or `AB1234`), letters accepted in upper or lower case, and at least three makes per country. Fields with equal order values are shown by ascending creation order (AC-004).
- **Q9. Date reference.** Proposed: "today" and "current year" are those of the person's device at the moment of validation; a 29 February birth date reaches each age on 1 March in years that are not leap years (AC-013, AC-014).
