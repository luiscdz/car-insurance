# CHG-003: Summary and payment (US-03)

## Intent

Deliver the summary and payment step, the last step of the quoting wizard. After choosing a plan and obtaining its final price (US-02), the person sees a summary of the data they confirmed in the form steps, grouped by form step, with the identity document number (the cédula number in Colombia, the RUT in Chile) always partially masked by one fixed rule, and the chosen plan with its final price. From the summary they can edit their data or change the plan. They read the country's terms and conditions, configured in Strapi per country, and must accept them before the pay action is enabled. Paying calls the stateless simulated payment endpoint once; the pay action stays locked while the payment is processed, and leaving the step during that time asks first. An approved payment shows a confirmation with a simulated quote number that is kept for the tab, so the same quote is never paid twice; a rejected or failed payment shows a clear message and lets the person pay again without losing anything. The change creates capability CAP-003, "Quoting wizard: summary and payment", for component `app`, and revises CAP-002's REQ-009 so that the public role is stated only once, in CAP-003.

## Revision

This revision answers the owner's rejection `01595ad54c3cd543149d446c5cf05ae72a92586e9519b1dce3a68f7fb9b53e61` of proposal digest `de9947c75d18e0bdeceef17851ce7290914eaa4a2da8b4d00dd96d7fd0719b85`, recorded with consequence `revise`. `semantic.addresses` records the response to its only correction.

| Correction | Response | Where |
| --- | --- | --- |
| R-1 Record the answers to Q1 to Q16 (Q1 and Q13 changed; Q15 and Q16 applied now that CHG-002 is integrated; the rest accepted) and the acceptance of N1 to N3 | Addressed | "Owner answers" below; the acceptance criteria and records listed in the next table. No question remains open. |

The answers changed the proposal as follows:

| Answer | Change | Where |
| --- | --- | --- |
| Q1 Masking | No masking option in Strapi; the identity document number is identified by a fixed field kind and is always masked with the fixed rule | AC-069, AC-090, AC-094, AC-095, REQ-014, REQ-020; gap table |
| Q13 Leaving while processing | Leaving the summary while a payment is processed asks first with the wizard's leave confirmations; otherwise the summary never asks | New AC-096; AC-078, AC-089, AC-073, AC-090 to AC-093, REQ-018; gap table, exclusions |
| Q15 Public role | CAP-002 (now integrated) is a base; REQ-009 is revised and AC-066 retired, so AC-082 is the only statement of the public role; because a revised requirement needs a new acceptance criterion, REQ-009 gains AC-097 (the final price is requested without a token) | Bases, deltas, proposed CAP-002 snapshot, AC-082, new AC-097 |
| Q16 Dependencies | CHG-002 is integrated, so the implement gate is no longer waiting for it | Components, dependencies and references |
| N1 to N3 | Details left open by Q1 and Q13, accepted as proposed | AC-069, AC-073, AC-094 to AC-096 |

## Origin and coverage

The origin is user story US-03 (kind `story`), captured verbatim in [sources/US-03.md](sources/US-03.md) with the stable criterion IDs BR-01 to BR-06 (business rules) and SC-01 to SC-04 (scenarios). `semantic.origins` and `semantic.coverage` in `change.json` are the authoritative records; this table summarizes them.

| Criterion | Status | Acceptance criteria |
| --- | --- | --- |
| BR-01 Summary shows policyholder data, vehicle data, chosen plan and final price | covered | AC-067, AC-068, AC-070 |
| BR-02 Document number partially masked | covered | AC-069, AC-094, AC-095 |
| BR-03 Go back to edit data or change the plan | covered | AC-071, AC-072 |
| BR-04 Pay enabled only after accepting the terms | covered | AC-076 |
| BR-05 Payment cannot be submitted twice | covered | AC-078, AC-085 |
| BR-06 Confirmation with a simulated quote number | covered | AC-083, AC-084 |
| SC-01 Complete summary | covered | AC-067, AC-070, AC-088 |
| SC-02 Terms by country | covered | AC-074, AC-076, AC-094, AC-095 |
| SC-03 Successful payment | covered | AC-078, AC-080, AC-083 |
| SC-04 Rejected payment | covered | AC-080, AC-081 |

No origin criterion is excluded or deferred.

Derived acceptance criteria (each addresses a gap of the story; reasons are in `semantic.coverage.derived`): AC-073, AC-075, AC-077, AC-079, AC-082, AC-086, AC-087, AC-089, AC-090, AC-091, AC-092, AC-093, AC-096, and in CAP-002 AC-097.

## Gap checklist (story-spec)

| Topic | Gap in the story | Resolution |
| --- | --- | --- |
| Country | Which data is "policyholder" and which is "vehicle" when Colombia has one form step and Chile two | Sections by form step, titled with the step title: AC-067; owner answer Q2 |
| Country | Which field is "the document number" (cédula number in Colombia, RUT in Chile) without naming fields or countries in code | A fixed field kind "identity document number" in the content model, exactly one text field per country: AC-069; seed AC-094, AC-095; owner answers Q1, N1 |
| Country | Masking rule for different formats (digits only; RUT with dots, hyphen and K) | One fixed rule for every country, last four letters or digits visible, separators kept, not configurable: AC-069; owner answer Q1 |
| Country | Dates, prices and option values per country | `Intl` with the country's locale and currency: AC-068, AC-070 (AC-042); owner answer Q3 |
| Country | Terms text per country | Terms collection related to the country (ADR-001): AC-074; seed AC-094, AC-095 |
| Country | Quote number per country | Prefix from the request's country code, no country named in code: AC-084; owner answer Q10 |
| States | Loading, Strapi unavailable, terms missing, not published, duplicated or blank | Terms load with the country's content; AC-015 to AC-017 apply: AC-077; owner answer Q5 |
| States | Payment processing, rejected, technical failure, invalid answer | AC-078, AC-080, AC-081; owner answers Q8, Q14 |
| States | Confirmation | AC-083 |
| Limits | Values of four or fewer letters and digits; separators; letter case | AC-069, AC-068 |
| Limits | Date shown shifted by the device's time zone | Calendar date as entered: AC-068 |
| Limits | Long terms text; long values at 320 px | Scroll inside the dialog; wrapping: AC-075, AC-092 |
| Limits | Quote number uniqueness without storage | Random, not guaranteed unique, accepted for the simulation: AC-084; owner answer Q10 |
| Validation | Where summary copy and messages come from; missing copy | Strapi; missing copy is invalid content: AC-073 |
| Validation | No identity document number field, several, or one that is not text | Invalid content: AC-069; owner answer N1 |
| Validation | Pay activated before accepting the terms | Disabled style, still focusable, message and focus: AC-076; owner answer Q7 |
| Navigation | What "edit data" and "change plan" return to, and the way back to the summary | Form step of the section / plan step; back through the configured order: AC-071, AC-072; owner answer Q12 |
| Navigation | Entering the summary address directly | AC-088 (AC-024, AC-056) |
| Navigation | Reload, back, leaving when no payment is processed; terms acceptance on return | No leave confirmation; acceptance not stored: AC-089, AC-076; owner answers Q6, Q13 |
| Navigation | Double activation of pay; other actions while processing | One request; actions locked: AC-078; owner answer Q13 |
| Navigation | Leaving while the payment is processed | Native confirmation on reload or close, application dialog on in-app navigation; leave ignores the answer, stay keeps processing: AC-096; owner answers Q13, N2, N3 |
| Navigation | Leaving while processing in browsers without the native confirmation | Stated limitation, as for AC-033: no confirmation, the answer is lost, nothing recorded: AC-096 |
| Navigation | After the confirmation: reload, back, forward, paying again, a new quote | AC-085, AC-086, AC-087; owner answer Q11 |
| Data | What leaves the browser to pay; what the endpoint stores or logs | Country and plan only; nothing stored or logged: AC-079; owner answer Q9 |
| Data | Personal data on the confirmation | None: AC-083 |
| Security | Public access to terms and the payment endpoint; AC-066 of CAP-002 says "nothing else" | AC-082 is the only statement; AC-066 retired; AC-097 keeps its price-quote part (no token): owner answer Q15 |
| Accessibility | Headings, term and description pairs, names, associations, announcements, dialogs, keyboard, reduced motion | AC-090, AC-091, AC-093; AC-075 and AC-096 for the dialogs |
| Responsive | 320, 375 and 1280 px; target size | AC-092 |

## Approved scope and exclusions

In scope, for component `app`:

- The summary of the quote: data grouped by form step, value presentation, the identity document number always masked, the chosen plan and its final price, edit data and change plan actions, and the summary copy (REQ-014).
- Terms and conditions per country: content, display in a dialog, acceptance that enables pay, loading and validation (REQ-015).
- The simulated payment: one request per activation and locked pay action, data minimization, the endpoint's outcome, rejected and failed payments, public access (REQ-016).
- The confirmation: content, simulated quote number, persistence for the tab, changes after paying, new quote (REQ-017).
- Navigation and data of the summary step: direct entry, reload, leaving, and the leave confirmation while a payment is processed (REQ-018).
- Accessibility and responsive behavior of the summary, the terms dialog, the leave dialog and the confirmation (REQ-019).
- Seed terms, summary copy and the identity document number field of Colombia and Chile (REQ-020).
- Revision of CAP-002's REQ-009: AC-066 is retired; its statement of the public role is replaced by AC-082, and its price-quote part (no token) by the new AC-097.

Excluded from this change:

- Any real payment, payment gateway, payment method form or card data (P5); any real policy issuance.
- Storing quotes, payments, quote numbers or terms acceptances anywhere outside the tab's session storage; sending a confirmation by email or offering a downloadable receipt.
- Guaranteed uniqueness of the quote number (AC-084).
- Verification of the RUT check character (CHG-001 owner answer Q1); masking anywhere other than the summary step and the confirmation; any masking setting in Strapi (owner answer Q1).
- Terms versioning, terms in rich text or with links, and a record of when terms were accepted (owner answers Q5, Q6).
- Showing coverages, benefits or the base price on the summary (owner answer Q4).
- A shortcut from an edited form step straight back to the summary (owner answer Q12).
- A leave confirmation on reload or tab close in browsers that do not show the native one, such as Safari on iOS, while a payment is processed (AC-096), as CHG-001 excluded for AC-033.
- Request timeouts beyond the browser's own: a payment request that never answers keeps the locked state of AC-078 until the person leaves (AC-096) or reloads.

## Exact bases by component/capability

| Capability | Component | Base revision |
| --- | --- | --- |
| CAP-002 | app | `c8a973e708d69f46246a2ca995ddbfd53b1843b7b0c7925b1d2cfae054b35a36` (integrated by CHG-002) |
| CAP-003 | app | none (new capability; no integrated contract exists) |

CAP-001 is not modified. In CAP-002 only REQ-009 changes, by retiring AC-066 and adding AC-097; every other requirement and acceptance criterion of CAP-002 is carried unchanged into its proposed snapshot. CAP-003 relies on the behavior of CAP-001 and CAP-002 and cites it where it applies (AC-008, AC-011, AC-015 to AC-017, AC-020, AC-023 to AC-026, AC-033 to AC-035, AC-042, AC-044 to AC-046, AC-050, AC-051, AC-053 to AC-056).

## Requirements and acceptance

The authoritative texts are the files of the proposed snapshots: CAP-003 requirements REQ-014 to REQ-020 and acceptance criteria AC-067 to AC-096, and CAP-002's revised REQ-009 with its new AC-097, each acceptance file stating its verification method. Requirement and acceptance IDs are project-wide, so they continue after CHG-002's REQ-013 and AC-066. Short form:

| AC | REQ | Behavior | Verification |
| --- | --- | --- | --- |
| AC-067 | REQ-014 | Entered data in one section per form step, titled with the step title, fields in configured order | Unit test (component, both countries) and end-to-end test (both countries) |
| AC-068 | REQ-014 | Option labels, dates with the country's locale (no time zone shift), numbers and text as entered, checkbox yes/no, empty optional fields omitted | Unit test |
| AC-069 | REQ-014 | Identity document number identified by a fixed field kind (exactly one text field per country) and always masked: last four letters or digits visible, separators kept; full value never on the page | Unit test (function, schemas) and end-to-end test (both countries) |
| AC-070 | REQ-014 | Chosen plan name and stored final price; nothing else of the plan | Unit test (component) and end-to-end test (both countries) |
| AC-071 | REQ-014 | Edit action per section goes to that form step; back to the summary through the configured order | End-to-end test (both countries) and unit test (component) |
| AC-072 | REQ-014 | Change plan, back action and browser back go to the plan step; a new choice reaches the summary | End-to-end test (both countries) and unit test (component) |
| AC-073 | REQ-014 | Summary, leave-while-processing and confirmation copy from Strapi; missing copy makes content invalid | Unit test (component, schemas) |
| AC-074 | REQ-015 | Terms dialog with the country's published text as plain paragraphs; changes on reload; no drafts | End-to-end test (both countries; published change) and unit test (component) |
| AC-075 | REQ-015 | Modal terms dialog: focus to title, scrolls, Escape and close, focus return | Unit test (component) and end-to-end test |
| AC-076 | REQ-015 | Unchecked acceptance; pay disabled but focusable; message and focus; check enables pay | Unit test (component) and end-to-end test (both countries) |
| AC-077 | REQ-015 | Terms loaded with the country's content; loading, unavailable, and invalid when none, several or blank | Unit test (schemas, reader, component) and end-to-end test |
| AC-078 | REQ-016 | One payment request; pay and other actions locked while processing; status announced; leaving asks (AC-096) | Unit test (component) and end-to-end test (both countries) |
| AC-079 | REQ-016 | Only country and plan sent to pay; nothing entered in requests, address or console; endpoint stores and logs nothing | End-to-end test (both countries) and unit test (endpoint) |
| AC-080 | REQ-016 | Endpoint approves an offered plan of the country with a quote number; rejects otherwise; no chance involved | Unit test (endpoint) |
| AC-081 | REQ-016 | Rejection, failure or invalid answer: Strapi message, everything kept, pay again sends one request | Unit test (component) and end-to-end test (both countries) |
| AC-082 | REQ-016 | Public role: read wizard content incl. terms, price-quote and payment endpoints, nothing else; no token; replaces AC-066 | Unit test (bootstrap) and end-to-end test |
| AC-083 | REQ-017 | Confirmation with title, message, quote number, plan and amount paid; focus; progress complete; no personal data | Unit test (component) and end-to-end test (both countries, full flow) |
| AC-084 | REQ-017 | Quote number `CC-YYYYMMDD-XXXXXX`, random, not stored | Unit test (fixed clock and random source) and end-to-end test (both countries) |
| AC-085 | REQ-017 | Confirmation stored for the tab; summary address shows it again; no second payment | Unit test (store) and end-to-end test |
| AC-086 | REQ-017 | Changing data or plan after paying discards the confirmation; unchanged navigation keeps it | Unit test (store) and end-to-end test |
| AC-087 | REQ-017 | New quote discards the country's data and opens the empty first step | Unit test (store, component) and end-to-end test |
| AC-088 | REQ-018 | Direct entry to the summary with complete data shows it; otherwise AC-024, AC-056, AC-085 | End-to-end test and unit test |
| AC-089 | REQ-018 | No leave confirmation when no payment is processed; acceptance not kept on reload | Unit test and end-to-end test |
| AC-090 | REQ-019 | Headings, term and description pairs, names, associations, announcements; automated scan in every state, including the leave dialog | End-to-end test (both countries) and unit test (component) |
| AC-091 | REQ-019 | Keyboard-only use, including both dialogs | Declared manual check |
| AC-092 | REQ-019 | No horizontal scrolling at 320, 375, 1280 px; terms scroll in the dialog; target size | End-to-end test and declared manual check |
| AC-093 | REQ-019 | Reduced motion, including both dialogs | Declared manual check |
| AC-094 | REQ-020 | Seed terms, summary copy and "Número de documento" as identity document number for Colombia | End-to-end test |
| AC-095 | REQ-020 | Seed terms, summary copy and "RUT" as identity document number for Chile | End-to-end test |
| AC-096 | REQ-018 | While a payment is processed: native confirmation on reload or close, application dialog on in-app navigation; stay keeps processing, leave ignores the answer; browsers without the native confirmation stated | End-to-end test (both countries, supporting browser) and unit test |
| AC-097 | REQ-009 (CAP-002) | The final price request and the other plan step requests carry no token; the public role's list is only in AC-082 | End-to-end test |

Retired: AC-066 (CAP-002, REQ-009), replaced in substance by AC-082 and AC-097.

## Normative deltas

- CAP-002: `revise` REQ-009, retiring AC-066 and adding AC-097. REQ-009 keeps the same obligation for prices and the simulated final price; its text now points to CAP-003 (AC-082) for the list of the public role's actions. Roclec requires a revised requirement to gain a new acceptance criterion, and AC-082 cannot move into CAP-002 because its identity already belongs to REQ-016, so AC-097 keeps only the price-quote part of AC-066 (no token in the browser).
- CAP-003: `add` REQ-014 to REQ-020.

Nothing is replaced, and no requirement is retired.

## Components, dependencies and references

- Component: `app` (user-facing).
- Dependencies: `app` CAP-001 at `d9a109a9933d4153ee9a5295d15a679e3561ced3e0104bcbf99c35f5fe2120fb` (integrated by CHG-001) and `app` CAP-002 at `c8a973e708d69f46246a2ca995ddbfd53b1843b7b0c7925b1d2cfae054b35a36` (integrated by CHG-002), which is also the base of the CAP-002 revision. Both are integrated, so the implement gate does not wait for another change.
- Pinned agreed references: architecture, context, design, engineering, flow, principles, stack, verification. The CAP-003 snapshot pins ADR-001, architecture, context, design and principles; the revised CAP-002 snapshot keeps its pins.
- Verification mapping (for the plan and implement stages, not part of this bundle): `.roclec/project.toml` needs AC-067 to AC-097 added to the `acceptance_ids` of the checks that will run their automated tests (`shared-unit`, `web-unit`, `cms-unit`, `e2e`) and AC-066 removed from them; AC-091 and AC-093 are declared manual checks recorded as observations, and AC-092 also has a manual part.

## Decisions, alternatives and owner answers

### Architecture decisions

- ADR-001 (accepted) applies: terms are a collection related to `Country`; the summary is the step type `summary`, last in each country's sequence; every content request filters by country; prices and dates use the country's locale and currency with `Intl`; no code names a country.
- No new architecture decision is needed. The agreed architecture reference already decides the simulated payment as a stateless custom endpoint in Strapi that "returns success or failure and, on success, a simulated quote number" and stores nothing, its public permission, terms as a content type read by the content client, the request flow ("after the terms are accepted, the payment endpoint is called once and its result is shown"), and the wizard data in a signals store mirrored to session storage, where the confirmation is kept.
- The identity document number kind (owner answer Q1) is a fixed value of the form field configuration that says what a field holds, like the pricing inputs CHG-002 added (AC-044). It keeps the field types of CAP-001 unchanged (the field stays `text`), names no field and no country in code (P1), and is content attribute detail that ADR-001 leaves to the architecture reference and the specs. Adding a new field type instead would have changed CAP-001's set of field types (AC-005, AC-017), so it was not chosen.

### Owner answers

On 2026-11-23 the owner answered Q1 to Q16 and then accepted the proposed resolutions of N1 to N3, the details that the answers to Q1 and Q13 left open. Each answer is reflected in the acceptance criteria. No question remains open; the alternatives are kept as the options the owner considered and did not choose.

- **Q1. Masking rule and which field is masked (BR-02).** Owner answer, changed from the proposal: there is no configurable masked mark in Strapi; the identity document field is always masked with one fixed rule: every letter and digit except the last four is replaced with `•`, separators are kept, a value of four or fewer letters and digits is fully masked (`1234567890` → `••••••7890`, `12.345.678-5` → `••.•••.678-5`), and the document type stays visible. The field is identified, without country branches and without naming fields in code, by a fixed field kind "identity document number" in the content model (the proposal's alternative D). Alternatives considered: the configurable masked mark first proposed; keep the last three; the visible count set per field in Strapi; output without separators. Impact: AC-069, AC-090, AC-094, AC-095.
- **Q2. Grouping of "my data" and "my vehicle's data".** Owner answer: one section per form step, titled with the step title from Strapi (Colombia: one section; Chile: two). Alternative considered: a policyholder or vehicle group mark on every field. Impact: AC-067, AC-071.
- **Q3. Presentation of values.** Owner answer: option labels; dates as day, month and four-digit year with `Intl` and the country's locale (`05/03/1990` in Colombia, `05-03-1990` in Chile); numbers and text exactly as entered; checkbox values as yes/no copy; empty optional fields not listed. Alternatives considered: plates and RUT in upper case; a long date; empty optional fields listed with a "not provided" text. Impact: AC-068, AC-073.
- **Q4. The plan on the summary.** Owner answer: the plan name and the final price stored on the plan step, not requested again. Alternatives considered: also coverages, benefits and the base price; requesting the final price again on the summary. Impact: AC-070.
- **Q5. Terms content and its validity.** Owner answer: one terms entry per country with a plain long text whose blank-line-separated blocks are paragraphs; loaded with the country's content; no published terms, several published entries or a blank text make the country's content invalid. Alternatives considered: rich text; loading terms only on the summary with pay unavailable when missing; the first of several entries. Impact: AC-074, AC-077.
- **Q6. How the terms are shown and accepted.** Owner answer: a view terms action below the pay action opens a modal dialog; a checkbox above the pay action; opening the text is not required; acceptance is never stored. Alternatives considered: the text inline; acceptance only after opening or scrolling; acceptance kept across reloads. Impact: AC-074, AC-075, AC-076, AC-089.
- **Q7. Disabled pay action.** Owner answer: disabled style and disabled state for assistive technologies, still focusable; activating it sends nothing, shows the Strapi message and moves focus to the checkbox. Alternative considered: natively disabled. Impact: AC-076.
- **Q8. How the simulated payment fails.** Owner answer: never random; the endpoint approves every well-formed request for a plan that is published, active and of that country, and rejects any other; end-to-end tests produce rejections and failures by answering the request in the browser. Alternatives considered: a mock gateway choice; a Strapi setting (new content type and architecture reference update); a server environment variable; a random rate. Impact: AC-080, AC-081.
- **Q9. Payment request content.** Owner answer: only the country code and the plan's identifier; the amount shown as paid is the final price shown on the summary. Alternatives considered: sending the derived ages so the endpoint recomputes the amount; sending the amount for the endpoint to check. Impact: AC-079, AC-080, AC-083.
- **Q10. Quote number format.** Owner answer: country code in upper case, UTC date and six random upper-case letters or digits (`CO-20261123-7KQ2MX`), not stored and not guaranteed unique. Alternatives considered: a prefix per country in Strapi; digits only; a UUID. Impact: AC-084.
- **Q11. After the confirmation.** Owner answer: the confirmation is stored with the country's wizard data, which is kept; the summary address shows the confirmation until the quote changes or a new quote starts; a new quote action clears the country's data. Alternative considered: a terminal confirmation that discards the data, which would contradict AC-024 and AC-056. Impact: AC-083, AC-085, AC-086, AC-087.
- **Q12. Where "edit data" returns.** Owner answer: the form step of the section, then through the configured order via the plan step. Alternative considered: a shortcut straight back to the summary. Impact: AC-071.
- **Q13. Leaving the summary and the processing lock.** Owner answer, changed from the proposal: while a payment is processed, leaving the summary asks first, reusing the leave confirmations of CHG-001 (the browser's native confirmation of AC-033 on reload or close, the application's dialog of AC-034 on in-app navigation) with copy from Strapi; outside processing, the summary never asks. As proposed, the other actions are locked while processing, and when the person confirms leaving, the late answer is ignored and nothing is recorded. Alternatives considered: never asking (the original proposal); recording the late answer. Impact: AC-073, AC-078, AC-089, AC-090 to AC-093, AC-096.
- **Q14. Error message.** Owner answer: one Strapi message for a rejection and for a technical failure, next to the pay action and announced; focus does not move; pay is enabled again. Alternatives considered: separate copy; moving focus to the message. Impact: AC-073, AC-081.
- **Q15. Public role and CAP-002's AC-066.** Owner answer: now that CHG-002 is integrated, this change takes CAP-002 at its integrated revision as a base and revises REQ-009, retiring AC-066, so AC-082 is the only statement of the public role. A revised requirement needs a new acceptance criterion, so REQ-009 gains AC-097, which keeps only the price-quote part of AC-066 (the final price is requested without a token). Alternatives considered: a separate follow-up change; two disagreeing criteria for a while. Impact: AC-082, bases, deltas.
- **Q16. Capability and dependencies.** Owner answer: US-03 is the new capability CAP-003, depending on CAP-001 and CAP-002, both integrated; US-01 to US-03 are released together, and the end-to-end tests of this change cover the complete flow from country selection to the confirmation for both countries. Alternative considered: a revision of CAP-002 that adds the summary. Impact: dependencies, release planning.

- **N1. How many identity document number fields a country has.** Owner answer, accepting the proposed resolution: exactly one, and it is a text field; none, two or more, or the kind on a field of another type is invalid content (AC-017), so a missing configuration never shows a document number in clear. Alternative considered: at most one, with nothing masked when a country has none. Impact: AC-069.
- **N2. Copy of the leave dialog while a payment is processed.** Owner answer, accepting the proposed resolution: the dialog keeps the behavior of AC-034 but has its own title, message, stay label and leave label in the country's summary copy in Strapi (AC-073), seeded in Spanish (for example "¿Quieres salir mientras procesamos tu pago?"), because the copy of AC-034 speaks of losing values typed and not confirmed. Alternative considered: reusing the leave dialog copy of AC-034 unchanged. Impact: AC-073, AC-094, AC-095, AC-096.
- **N3. An answer that arrives while the leave dialog is open.** Owner answer, accepting the proposed resolution: it is applied at once (the confirmation is stored or the error shown) and the dialog stays open until the person answers; leave then navigates without asking again, and a stored confirmation stays. Alternative considered: holding the answer until the person answers the dialog and discarding it when they choose leave. Impact: AC-096.
