# CHG-001: Policyholder and vehicle data form (US-01)

## Intent

Deliver step 1 of the quoting wizard: the person opens the application in the context of Colombia or Chile and fills in their own data and their vehicle's data in form steps whose fields, types, validations, copy and order come from Strapi per country. The form validates every field with its configured rules and messages, enforces the vehicle year and legal age rules, does not let the person advance while a field is invalid, keeps the data of completed steps when the person goes back or reloads, and asks before values not yet confirmed are lost. The change creates capability CAP-001, "Quoting wizard: country context and data capture", for component `app`.

## Revision

This revision answers the owner's rejection `3a7a0af250436b204f9705e775ac1c3875a945bea6f5ec78d96bc5f3e55ec9da` of proposal digest `7745cf87b531ab42d66d0d830e6c1c18c6e9dc6bfb5463478e33614517d5f90b`. `semantic.addresses` records the response to each correction.

| Correction | Response | Where |
| --- | --- | --- |
| R-1 Ask before unconfirmed values are lost | Addressed | AC-022 (points to the confirmation), new AC-033, AC-034, AC-035; REQ-005; AC-008, AC-027, AC-028, AC-030 extended to the dialog. Details the owner did not state: open questions N1 to N5. |
| R-2 Fallback copy before country content; visible loader | Addressed | AC-001 (root heading and page title), AC-015 (visible loader, announced fallback label, reduced motion), AC-008 and REQ-004 |
| R-3 Record the other answers | Addressed | "Owner answers" below |

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

Derived acceptance criteria (each addresses a gap of the story; reasons are in `semantic.coverage.derived`): AC-001, AC-002, AC-003, AC-008, AC-010, AC-015, AC-016, AC-017, AC-018, AC-021, AC-022, AC-023, AC-024, AC-025, AC-026, AC-027, AC-028, AC-029, AC-030, AC-033, AC-034, AC-035.

## Gap checklist (story-spec)

| Topic | Gap in the story | Resolution |
| --- | --- | --- |
| Country | How the country context is chosen | ADR-001 (URL prefix, root selection): AC-001 |
| Country | Unknown, upper-case or unpublished country code (ADR-001 leaves it to the specs) | AC-002; owner answer Q5 |
| Country | Fields, identifiers and steps per country (cédula/placa vs RUT/patente; one vs two form steps) | AC-004 for both countries; seed AC-031, AC-032; owner answers Q1, Q8 |
| Country | Country theme required by the design reference | AC-003; owner answer Q7 |
| Country | Currency and locale | Only seeded on the country entry here (AC-031, AC-032); no price or amount is shown in this step |
| States | Loading, Strapi unavailable, invalid content, form step without fields, unpublished content | AC-015 (owner answer Q6, R-2), AC-016, AC-017, AC-018; drafts never shown in AC-007 |
| Limits | Vehicle year bounds and inclusiveness, relative to which date | AC-013; owner answer Q9 |
| Limits | Legal age value, inclusiveness, 29 February, future dates | AC-014; owner answer Q9 |
| Limits | Which validations exist and whether limits are inclusive | AC-012 |
| Validation | Where rules and messages come from | Strapi, one configured message per field: AC-009, AC-012 |
| Validation | When errors appear; disabled continue action vs focus on the first invalid field | AC-010, AC-011; owner answer Q2 |
| Navigation | Direct entry, reload, browser back, double activation | AC-020, AC-021, AC-022, AC-024 |
| Navigation | Values not yet confirmed when reloading, closing or leaving | AC-033, AC-034, AC-035; owner answer Q4 (R-1); open questions N1 to N5 |
| Data | Data per country, tab lifetime, configuration changed after storing, data leaving the browser | AC-023, AC-025, AC-026 |
| Data | What follows the last form step (plan list, US-02) | Out of scope; owner answer Q3 |
| Copy | Navigation, progress and dialog copy; copy before any country content exists | AC-008, AC-001, AC-015; owner answer Q6 (R-2) |
| Accessibility | Labels, associations, focus, announcements, keyboard, contrast, targets, reduced motion, dialog | AC-027 to AC-030, AC-034; focus and announcements in AC-011, AC-015 to AC-019 |
| Responsive | Widths 320, 375 and 1280 px | AC-029 |

## Approved scope and exclusions

In scope, for component `app`:

- Country context from the address, country selection at the root and the unknown-country message (REQ-001).
- Form steps built from Strapi content, with the five field types, options, copy and published changes on reload (REQ-002).
- Field validation from Strapi, including vehicle year and legal age (REQ-003).
- Loading, unavailable, invalid and empty content states (REQ-004).
- Navigation between the country's steps, progress indicator, wizard data per country kept in the tab, and confirmation before unconfirmed values are lost (REQ-005).
- Accessibility and responsive behavior of the form steps and the leave dialog (REQ-006).
- Seed content for Colombia and Chile (REQ-007).

Excluded from this change:

- Rendering and behavior of the plan list step (US-02) and of the summary and payment step (US-03), price quote, simulated payment and terms. This change seeds those steps only as entries of each country's step sequence.
- Verification of the RUT check character against its number (owner answer Q1).
- Any maximum age for the policyholder; no source states one.
- Request timeouts beyond the browser's own; a request that never fails stays in the loading state of AC-015.
- A leave confirmation in browsers that do not support the native one (AC-033).

## Exact bases by component/capability

| Capability | Component | Base revision |
| --- | --- | --- |
| CAP-001 | app | none (new capability; no integrated contract exists) |

## Requirements and acceptance

The authoritative texts are the files of the proposed CAP-001 snapshot: requirements REQ-001 to REQ-007 and acceptance criteria AC-001 to AC-035, each acceptance file stating its verification method. Short form:

| AC | REQ | Behavior | Verification |
| --- | --- | --- | --- |
| AC-001 | REQ-001 | Country selection at the root; heading and page title are fallback copy | End-to-end and unit test |
| AC-002 | REQ-001 | Unknown or unpublished country code shows a fallback message with a link to the root | End-to-end and unit test |
| AC-003 | REQ-001 | Country theme with fallback to the default theme | Unit test and declared manual check |
| AC-004 | REQ-002 | Only the country's published fields, in configured order | End-to-end test (both countries) and unit test |
| AC-005 | REQ-002 | Field presentation by configured type | Unit test (component) |
| AC-006 | REQ-002 | Select options from Strapi, none preselected | Unit and end-to-end test |
| AC-007 | REQ-002 | Published configuration change visible on reload; drafts never shown | End-to-end test |
| AC-008 | REQ-002 | Wizard copy, including the leave dialog, comes from Strapi; fallback copy and the native confirmation excepted | Unit test (component) |
| AC-009 | REQ-003 | Configured error message next to the field | Unit and end-to-end test (both countries) |
| AC-010 | REQ-003 | Errors shown after leaving the field or trying to advance | Unit test (component) |
| AC-011 | REQ-003 | Step cannot advance while invalid; focus to first invalid field | End-to-end (both countries) and unit test |
| AC-012 | REQ-003 | Supported validations, inclusive limits | Unit test |
| AC-013 | REQ-003 | Vehicle year Y−20..Y+1 inclusive | Unit test (fixed date) and end-to-end test (both countries) |
| AC-014 | REQ-003 | Legal age 18, inclusive on the birthday | Unit test (fixed date) and end-to-end test (both countries) |
| AC-015 | REQ-004 | Visible loader with an announced fallback label; still under reduced motion | Unit test (component) |
| AC-016 | REQ-004 | Strapi unavailable, with retry | Unit and end-to-end test |
| AC-017 | REQ-004 | Invalid content | Unit test |
| AC-018 | REQ-004 | Form step without fields | Unit test (component) |
| AC-019 | REQ-005 | Advance to the next step; focus and progress | End-to-end and unit test |
| AC-020 | REQ-005 | Data kept when going back (wizard and browser back) | End-to-end test (Chile) and unit test |
| AC-021 | REQ-005 | Single advance on repeated activation | Unit test (component) |
| AC-022 | REQ-005 | Reload keeps the step and completed data; unconfirmed values are not kept, after asking | End-to-end test |
| AC-023 | REQ-005 | Data per country and per tab | End-to-end test |
| AC-024 | REQ-005 | Direct entry to a later step | End-to-end and unit test |
| AC-025 | REQ-005 | Stored data reconciled with the current configuration | Unit test |
| AC-026 | REQ-005 | Entered data stays in the browser | End-to-end test |
| AC-027 | REQ-006 | Programmatic labels and automated accessibility scan, including the open leave dialog | End-to-end test (both countries) |
| AC-028 | REQ-006 | Keyboard-only completion, including the leave dialog | Declared manual check |
| AC-029 | REQ-006 | Responsive layout and target size | End-to-end test and declared manual check |
| AC-030 | REQ-006 | Reduced motion, including loader and leave dialog | Declared manual check |
| AC-031 | REQ-007 | Seed content for Colombia | End-to-end test |
| AC-032 | REQ-007 | Seed content for Chile | End-to-end test |
| AC-033 | REQ-005 | Browser's native leave confirmation on reload or tab close when there are unconfirmed values | End-to-end test (both countries) and unit test |
| AC-034 | REQ-005 | Application dialog when leaving the wizard to the root or another country with unconfirmed values | End-to-end test (both countries) and unit test (component) |
| AC-035 | REQ-005 | Going back to another step of the same wizard does not ask; unconfirmed values discarded | End-to-end test (Chile) and unit test |

## Normative deltas

Add REQ-001 to REQ-007 to the new capability CAP-001. Nothing is revised, replaced or retired.

## Components, dependencies and references

- Component: `app` (user-facing).
- Dependencies: none.
- Pinned agreed references: architecture, context, design, engineering, flow, principles, stack, verification. The CAP-001 snapshot pins ADR-001, context, design and principles.
- Architecture decisions: ADR-001 (accepted). The country is resolved from the first segment of the address, content is modeled per country with wizard steps as content, and wizard data lives in a signals store mirrored to session storage (architecture reference). No new architecture decision is needed by this change.

## Owner answers

Answers recorded in the rejection of the previous revision:

- **Q1. RUT check character:** accepted as proposed. Format only, through a configured pattern; the check character is not verified (AC-032).
- **Q2. Disabled continue action and focus on the first invalid field:** accepted as proposed. Disabled style and disabled state for assistive technologies, still focusable; activating it shows the errors and moves focus (AC-011).
- **Q3. What follows the last form step before US-02 and US-03 exist:** accepted as proposed. US-01 is released together with US-02 and US-03; end-to-end tests of this change stop when the person leaves the last form step.
- **Q4. Unconfirmed values on reload:** changed by the owner (R-1). Values not confirmed with continue are still not stored, but the person is asked before they are lost: the browser's native confirmation on reload or tab close (AC-033), the application's own dialog when leaving to the root or another country (AC-034), and no question when going back to the previous step (AC-035).
- **Q5. Unknown, upper-case or unpublished country code:** accepted as proposed. Exact match only; otherwise the "country not available" fallback with a link to the root (AC-002).
- **Q6. Copy before any country content exists:** changed by the owner (R-2). The root heading and the loading label are front-end fallback copy in Spanish, and the loading state shows a visible loader in addition to the announced text (AC-001, AC-015).
- **Q7. Country theme:** accepted as proposed. Delivered in this change; a theme is invalid only when missing or malformed; contrast of the seeded themes is checked manually (AC-003).
- **Q8. Seed content:** accepted as proposed. The fields and formats of AC-031 and AC-032, letters in either case, at least three makes per country; equal order values shown by ascending creation order (AC-004).
- **Q9. Date reference:** accepted as proposed. "Today" and "current year" are those of the person's device at validation time; 29 February reaches each age on 1 March in years that are not leap years (AC-013, AC-014).

## Open questions

Details of R-1 that the owner did not state and no agreed reference settles. Each has a proposed resolution already written into the acceptance criteria, for the owner to confirm or correct:

- **N1. What counts as "values not yet confirmed".** Proposed: at least one field of the current step whose value differs from the value stored for that step, or from empty when the step was never completed. Revisiting a completed step without editing it, or editing and restoring the stored value, does not ask. Impact: AC-033, AC-034.
- **N2. Moving forward through the browser's history.** The owner said going back does not ask. Proposed: moving to any other step of the same country's wizard through the browser's history (for example forward, after going back and editing) also does not ask, and the unconfirmed values are discarded. Impact: AC-035.
- **N3. Dialog interaction.** The design reference requires keyboard operation, visible focus and no traps, but does not settle these details. Proposed: focus moves to the stay action when the dialog opens; Escape means stay; focus stays inside the dialog while it is open; after stay, focus returns to the element that had it. Impact: AC-034.
- **N4. How the person leaves the wizard.** No agreed reference defines a control to go to the root or switch country from inside the wizard. Proposed: no new control in this change. The dialog applies to navigation inside the application through the browser's history (back from the first step to the root, back or forward to another country's wizard) and to any such control added later. Typing another address reloads the page, so the native confirmation of AC-033 applies instead. Impact: AC-034, scope.
- **N5. Limits of the native confirmation.** The browser shows the same confirmation for every page unload (reload, closing, typing another address, going to another site) and its text cannot be customized. Some browsers, notably Safari on iOS, do not show it at all, and the values are then lost without asking. Proposed: accept this as a limitation, with end-to-end verification in a browser that supports the confirmation. Impact: AC-033 on mobile Safari.
