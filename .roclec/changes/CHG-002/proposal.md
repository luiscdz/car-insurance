# CHG-002: Plan list (US-02)

## Intent

Deliver the plan list step of the quoting wizard: after completing the form steps of US-01, the person sees the plans that the business team configured in Strapi for their country and that are published and active, in configured order, with name, short description, base price, coverages and benefits, and with the recommended plan distinguished. Prices are shown in the country's currency and format. The person chooses exactly one plan; the application then obtains its final price from the stateless price-quote endpoint, which applies a documented, simulated rule based on the policyholder's and the vehicle's ages derived from the step 1 data. With a chosen plan and its final price, the person moves on to the summary step. When the country has no plans, a message says so. The change creates capability CAP-002, "Quoting wizard: plan selection", for component `app`.

## Origin and coverage

The origin is user story US-02 (kind `story`), captured verbatim in [sources/US-02.md](sources/US-02.md) with the stable criterion IDs BR-01 to BR-05 (business rules) and SC-01 to SC-04 (scenarios). `semantic.origins` and `semantic.coverage` in `change.json` are the authoritative records; this table summarizes them.

| Criterion | Status | Acceptance criteria |
| --- | --- | --- |
| BR-01 Plan configuration attributes | covered | AC-036, AC-037, AC-038, AC-041, AC-042 |
| BR-02 Only published and active plans of the country | covered | AC-036, AC-039 |
| BR-03 Price in the country's currency and format | covered | AC-042 |
| BR-04 Simulated, documented price rule based on step 1 data | covered | AC-043, AC-044, AC-045 |
| BR-05 Only one plan can be selected | covered | AC-048 |
| SC-01 Plans for the country | covered | AC-036, AC-064, AC-065 |
| SC-02 Recommended plan | covered | AC-038 |
| SC-03 Plan selection | covered | AC-048, AC-050 |
| SC-04 No plans available | covered | AC-058 |

No origin criterion is excluded or deferred.

Derived acceptance criteria (each addresses a gap of the story; reasons are in `semantic.coverage.derived`): AC-040, AC-046, AC-047, AC-049, AC-051, AC-052, AC-053, AC-054, AC-055, AC-056, AC-057, AC-059, AC-060, AC-061, AC-062, AC-063, AC-066.

## Gap checklist (story-spec)

| Topic | Gap in the story | Resolution |
| --- | --- | --- |
| Country | Plans, prices, coverages and copy per country | AC-036, AC-037, AC-040 with fixtures for both countries; seed AC-064, AC-065 |
| Country | Currency, its format and where they come from (COP vs CLP) | Country entry (currency code, locale) and `Intl`, no decimals: AC-042; owner answer Q4 |
| Country | Plan currency (BR-01) vs the country's currency (ADR-001) | Must be equal, otherwise invalid content: AC-041; Q6 |
| Country | How the price rule finds its inputs when each country has different fields and steps | Fields marked in Strapi as pricing inputs: AC-044; Q2 |
| Price rule | The rule itself (BR-04 says only "documented") | Candidate rule documented in AC-043, same for every country; Q1 |
| Price rule | When the final price is obtained and what each card shows | Base price on every card, final price of the chosen plan on choice, as in the architecture's request flow: AC-045; Q3 |
| States | Loading, Strapi unavailable, invalid plans | Plans load with the country's content: AC-059 (AC-015 to AC-017); Q9 |
| States | No plans (SC-04) | AC-058 |
| States | Final price waiting and failure | AC-045, AC-047 |
| Limits | Base price of 0, negative, decimal or missing; missing name, coverages; currency mismatch | AC-041; Q6 |
| Limits | Rule bracket boundaries, rounding, next year's model, missing inputs | AC-043 (boundaries and examples), AC-044 |
| Limits | Zero or several recommended plans; equal order values | AC-038 (none, or first in display order); AC-036 (creation order); Q5 |
| Validation | Where copy and messages come from | Strapi: AC-040; fallback only for AC-059 |
| Navigation | Continue without a choice or before the final price | AC-051; Q12 |
| Navigation | Double activation; quick or repeated choices | AC-052, AC-049 |
| Navigation | Back, forward, reload, per-country and per-tab data | AC-053; Q7 |
| Navigation | Step 1 data changed after choosing a plan | Choice kept, new final price required: AC-054; Q7 |
| Navigation | Plan no longer offered after it was chosen | AC-055 |
| Navigation | Entering the plan step or the summary step directly | AC-056 (AC-024) |
| Navigation | Leave confirmation of CHG-001 on the plan step | Never asks, the choice is stored when made: AC-057; Q8 |
| Navigation | What "move on to the summary" means while US-03 is not specified | Next step's address, heading and progress: AC-050; Q13 |
| Data | What leaves the browser for the price | Country, plan and two derived ages only; nothing stored or logged: AC-046 |
| Security | Public access to plans and the endpoint | AC-066 |
| Accessibility | Group name, accessible names, announcements, color not alone, keyboard, reduced motion | AC-060, AC-061, AC-063; AC-038 and AC-048 for text badges and marks |
| Responsive | Cards side by side and stacked, 320/375/1280 px, target size | AC-062 |

## Approved scope and exclusions

In scope, for component `app`:

- Plan list built from Strapi per country: published, active plans in configured order, plan content, recommended plan, plan list copy, content validation and changes visible on reload (REQ-008).
- Price formatting and the simulated final price: the rule, its inputs, the price-quote endpoint, data minimization, failure handling and public access (REQ-009).
- Plan selection and navigation: one choice stored when made, persistence, reconciliation, step 1 data changes, direct entry, moving on to the summary step, and no leave confirmation on this step (REQ-010).
- No-plans, loading, unavailable and invalid states (REQ-011).
- Accessibility and responsive behavior of the plan step (REQ-012).
- Seed plans, plan list copy and pricing-input marks for Colombia and Chile (REQ-013).

Excluded from this change:

- What the summary and payment step shows, the terms, the simulated payment endpoint and the confirmation (US-03). This change only takes the person to the summary step's address (AC-050).
- Showing the final price of every plan before the person chooses one (owner answer Q3).
- Comparison, filtering or sorting of plans by the person; plan details beyond the attributes of BR-01.
- Formatting coverage values as amounts: a coverage's highlighted value is free text written by the business team (AC-037).
- A rule that differs by country or is configured in Strapi (owner answer Q1); any real rating.
- Request timeouts beyond the browser's own; a price request that never answers stays in the waiting state of AC-045, and continue does not advance.

## Exact bases by component/capability

| Capability | Component | Base revision |
| --- | --- | --- |
| CAP-002 | app | none (new capability; no integrated contract exists) |

CAP-001 is not modified: no requirement or acceptance criterion of CAP-001 is revised, replaced or retired. CAP-002 relies on CAP-001's behavior and cites it where it applies (AC-008, AC-011, AC-015 to AC-017, AC-019, AC-020, AC-023, AC-024, AC-026, AC-033, AC-034).

## Requirements and acceptance

The authoritative texts are the files of the proposed CAP-002 snapshot: requirements REQ-008 to REQ-013 and acceptance criteria AC-036 to AC-066, each acceptance file stating its verification method. Requirement and acceptance IDs are project-wide, so they continue after CHG-001's REQ-007 and AC-035. Short form:

| AC | REQ | Behavior | Verification |
| --- | --- | --- | --- |
| AC-036 | REQ-008 | Only the country's published, active plans, in configured order; ties by creation order | End-to-end (both countries; inactive and draft plans created by the test setup) and unit test |
| AC-037 | REQ-008 | Plan content: name, description, base price, coverages with optional highlighted value, benefits (hidden when none) | Unit test (component) and end-to-end test |
| AC-038 | REQ-008 | Recommended plan: text badge and styling; none when none marked; only the first when several | Unit test (component) and end-to-end test |
| AC-039 | REQ-008 | Plan changes published in Strapi visible on reload; drafts and inactive plans never shown | End-to-end test |
| AC-040 | REQ-008 | Plan list copy comes from Strapi; missing copy makes content invalid | Unit test (component, schemas) |
| AC-041 | REQ-008 | Plan validation rules; an invalid plan makes the country's content invalid (AC-017) | Unit test (schemas) |
| AC-042 | REQ-009 | Prices with the country's currency and locale through `Intl`, no decimals | Unit and end-to-end test |
| AC-043 | REQ-009 | Documented simulated rule: brackets, rounding, examples | Unit test (pure function, boundaries) |
| AC-044 | REQ-009 | Rule inputs from fields marked in Strapi; ages derived on the device | Unit test |
| AC-045 | REQ-009 | Final price requested on choice; waiting and final price shown and announced; endpoint uses the published base price | Unit test (component, endpoint) and end-to-end test (both countries) |
| AC-046 | REQ-009 | Only country, plan and derived ages leave the browser; endpoint stores and logs nothing | End-to-end and unit test |
| AC-047 | REQ-009 | Final price failure: Strapi message with retry; choice kept; no advance | Unit and end-to-end test |
| AC-048 | REQ-010 | Exactly one plan chosen, marked with text and not by color alone, stored at once | Unit and end-to-end test (both countries) |
| AC-049 | REQ-010 | Quick or repeated choices: only the last choice's price is shown | Unit test (component) |
| AC-050 | REQ-010 | Continue takes the person to the summary step's address, heading and progress | End-to-end (both countries) and unit test |
| AC-051 | REQ-010 | Continue without a choice or before the final price: message, focus, no advance | Unit and end-to-end test |
| AC-052 | REQ-010 | Single advance on repeated continue | Unit test (component) |
| AC-053 | REQ-010 | Choice kept on back, forward and reload; final price requested again on every display; per country and tab | End-to-end and unit test |
| AC-054 | REQ-010 | Changed step 1 data keeps the choice and requires a new final price | Unit and end-to-end test |
| AC-055 | REQ-010 | Stored choice of a plan no longer offered is discarded silently | Unit test |
| AC-056 | REQ-010 | Direct entry to the plan step or the summary step | End-to-end and unit test |
| AC-057 | REQ-010 | No leave confirmation on the plan step | Unit and end-to-end test |
| AC-058 | REQ-011 | No plans available message; no continue; back available | Unit and end-to-end test |
| AC-059 | REQ-011 | Plans loading, unavailable and invalid use AC-015 to AC-017 | Unit and end-to-end test |
| AC-060 | REQ-012 | Accessible names, group, announcements; automated scan in every state | End-to-end (both countries) and unit test |
| AC-061 | REQ-012 | Keyboard-only use | Declared manual check |
| AC-062 | REQ-012 | Cards side by side at 1280 px, stacked at 375 px, no horizontal scroll, target size | End-to-end test and declared manual check |
| AC-063 | REQ-012 | Reduced motion | Declared manual check |
| AC-064 | REQ-013 | Seed plans, copy and marks for Colombia | End-to-end test |
| AC-065 | REQ-013 | Seed plans, copy and marks for Chile | End-to-end test |
| AC-066 | REQ-009 | Public role: read plans and the price-quote endpoint, nothing else; no token | Unit and end-to-end test |

## Normative deltas

Add REQ-008 to REQ-013 to the new capability CAP-002. Nothing is revised, replaced or retired.

## Components, dependencies and references

- Component: `app` (user-facing).
- Dependency: `app` CAP-001 at revision `d9a109a9933d4153ee9a5295d15a679e3561ced3e0104bcbf99c35f5fe2120fb`, the snapshot approved in CHG-001 (US-01). The plan step needs the country context, the wizard shell, the wizard data store and the step 1 fields of CAP-001. Roclec treats this dependency as satisfied only once that revision is integrated for `app`, so the implement and release gates of this change wait for CHG-001's integration (owner answer Q10).
- Pinned agreed references: architecture, context, design, engineering, flow, principles, stack, verification. The CAP-002 snapshot pins ADR-001, architecture, context, design and principles.
- Verification mapping (for the plan and implement stages, not part of this bundle): `.roclec/project.toml` needs AC-036 to AC-066 added to the `acceptance_ids` of the checks that will run their automated tests (`shared-unit`, `web-unit`, `cms-unit`, `e2e`); AC-061 and AC-063 are declared manual checks recorded as observations, and AC-062 also has a manual part.

## Decisions, alternatives and owner answers

### Architecture decisions

- ADR-001 (accepted) applies: plans are a collection related to `Country`; the plan list is the step type `plans`; every request filters by country; currency and locale come from the `Country` entry and are applied with `Intl`.
- No new architecture decision is needed by the owner's answers. The agreed architecture reference already decides the price quote as a stateless custom endpoint in Strapi, the simulated rule as a pure function in its `quote` service, the request flow (plans load with the country's content; on choice, the application asks the endpoint for the final price), the public role permissions and the formatting with `Intl`. The pricing-input marks on form fields (AC-044) are content attributes, which ADR-001 leaves to the architecture reference and the specs, as CHG-001 did for validations and copy.
- The owner answered Q1 with one rule in code and Q3 with the architecture's request flow, so no proposed ADR or reference update is needed. Choosing a rule configured per country in Strapi, or final prices for every plan before a choice, would have departed from the architecture reference.

### Owner answers

On 2026-11-23 the owner accepted the proposed resolution of every question, Q1 to Q13, as written below. Each answer is already reflected in the acceptance criteria. No question remains open; the alternatives are kept as the options the owner considered and did not choose.

- **Q1. The simulated price rule (BR-04).** Owner answer: one rule for every country, with its values in code (the `quote` service), documented in AC-043: final price = base × (1 + vehicle adjustment + age adjustment), rounded to whole units with halves up; vehicle age 0–5 years +0 %, 6–10 +10 %, 11 or more +20 %; policyholder age up to 25 +15 %, 26–64 +0 %, 65 or more +10 %; a missing input adds 0 %. Alternatives considered: rule values configured per country in Strapi (more flexible for the business team; needs a content model and an ADR); a single flat factor. Impact: AC-043, AC-045, AC-064, AC-065.
- **Q2. How the rule finds its inputs.** Owner answer: a form field can be marked in Strapi as "birth date for pricing" or "vehicle year for pricing" (at most one of each per country, on a date and a number field respectively); the seed marks both in each country. Alternatives considered: infer them from the validations (the date field with a minimum age, the number field with a year range), which needs no content change but is implicit; or fixed field names, which ties code to content. Impact: AC-044, AC-064, AC-065.
- **Q3. Base price on every card, final price on choice.** Owner answer: follow the architecture's request flow; every plan shows its base price and the chosen plan also shows its final price once obtained. Alternative considered: request the final price of every plan when the step opens so the person compares final prices; this changes the architecture's request flow (reference update). Impact: AC-045, AC-048, AC-049.
- **Q4. Currency format.** Owner answer: prices are whole amounts; `Intl` with the country's currency code and locale, the symbol it gives for that locale (`$` in both seeded countries), no decimal digits and no currency code shown (for example `$ 1.200.000` in Colombia and `$350.000` in Chile). Alternative considered: show the code (`COP`, `CLP`) to tell the two pesos apart. Impact: AC-042.
- **Q5. Recommended plan edge cases.** Owner answer: with no recommended plan, none is distinguished; with several, only the first in display order is distinguished; the recommended plan is not chosen in advance and its position does not change. Impact: AC-038.
- **Q6. Invalid plan content.** Owner answer, consistent with AC-017: a published, active plan that breaks a rule of AC-041 (blank name or description, base price that is not a whole number greater than zero, currency different from the country's, no coverage, blank benefit) makes the country's content invalid and the wizard shows the "not available right now" message. Alternative considered: hide only the invalid plan and show the others, which keeps selling but hides the configuration error. Also accepted: a short description and at least one coverage are required; benefits may be empty. Impact: AC-041.
- **Q7. Persistence of the choice.** Owner answer: the choice is stored when made; it survives back, forward and reload per country and tab; the final price is requested again every time the plan step is shown; confirming changed step 1 data keeps the choice but discards the stored final price, so the summary cannot be reached with a price from old data. Alternative considered: changed step 1 data clears the choice too. Impact: AC-048, AC-053, AC-054, AC-056.
- **Q8. Leave confirmation on the plan step.** Owner answer: since the choice is stored when made, the plan step never has unconfirmed values and never shows the confirmations of AC-033 or AC-034. Impact: AC-057.
- **Q9. When plans are loaded.** Owner answer: with the country's content when the wizard loads (architecture request flow), so a failure or invalid plans show the wizard's controlled states from the first step. Alternative considered: load plans when the plan step opens, so step 1 still works when only plans fail, at the cost of a failure after the person filled in their data. Impact: AC-059.
- **Q10. Capability and dependency.** Owner answer: US-02 is a new capability CAP-002 that depends on CAP-001 at CHG-001's approved revision, instead of a revision of CAP-001, because CAP-001 is scoped to country context and data capture and is not integrated yet. Consequence: Roclec will not let this change pass its implement gate (`DEPENDENCY_PENDING`) until CHG-001 is integrated for `app`; this change can be approved, planned and prototyped meanwhile. Impact: dependencies, bases.
- **Q11. Seed plans.** Owner answer: three plans per country with the names, base prices, order and recommended plan of AC-064 and AC-065, annual prices in the copy ("Precio base anual", "Tu precio anual"), the first plan of each country without benefits; inactive and draft plans are created only by end-to-end test setup, not seeded. Impact: AC-064, AC-065, AC-036, AC-039, AC-058.
- **Q12. Continue without a choice.** Owner answer, mirroring CHG-001's answer Q2: continue has the disabled style and disabled state for assistive technologies but stays focusable; activating it shows the Strapi message asking to choose a plan and moves focus to the first plan. Impact: AC-051.
- **Q13. "Move on to the summary" before US-03 is specified.** Owner answer: observable as the summary step's address, heading, focus and progress (AC-050); this change shows nothing else on that step. As with CHG-001's answer Q3, US-02 is released together with US-01 and US-03, and the end-to-end tests of this change stop when the summary step is shown. Impact: AC-050, release planning.
