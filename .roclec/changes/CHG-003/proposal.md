# CHG-003: Summary and payment (US-03)

## Intent

Deliver the summary and payment step, the last step of the quoting wizard. After choosing a plan and obtaining its final price (US-02), the person sees a summary of the data they confirmed in the form steps, grouped by form step, with the fields that the business team marked in Strapi (the document number in Colombia, the RUT in Chile) partially masked, and the chosen plan with its final price. From the summary they can edit their data or change the plan. They read the country's terms and conditions, configured in Strapi per country, and must accept them before the pay action is enabled. Paying calls the stateless simulated payment endpoint once; the pay action stays locked while the payment is processed. An approved payment shows a confirmation with a simulated quote number that is kept for the tab, so the same quote is never paid twice; a rejected or failed payment shows a clear message and lets the person pay again without losing anything. The change creates capability CAP-003, "Quoting wizard: summary and payment", for component `app`.

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

Derived acceptance criteria (each addresses a gap of the story; reasons are in `semantic.coverage.derived`): AC-073, AC-075, AC-077, AC-079, AC-082, AC-086, AC-087, AC-089, AC-090, AC-091, AC-092, AC-093.

## Gap checklist (story-spec)

| Topic | Gap in the story | Resolution |
| --- | --- | --- |
| Country | Which data is "policyholder" and which is "vehicle" when Colombia has one form step and Chile two | Sections by form step, titled with the step title: AC-067; Q2 |
| Country | Which field is "the document number" (cédula in Colombia, RUT in Chile) without naming fields in code | A masked mark on the field in Strapi: AC-069; seed AC-094, AC-095; Q1 |
| Country | Masking rule for different formats (digits only; RUT with dots, hyphen and K) | One rule for every country, last four letters or digits visible, separators kept: AC-069; Q1 |
| Country | Dates, prices and option values per country | `Intl` with the country's locale and currency: AC-068, AC-070 (AC-042); Q3 |
| Country | Terms text per country | Terms collection related to the country (ADR-001): AC-074; seed AC-094, AC-095 |
| Country | Quote number per country | Prefix from the request's country code, no country named in code: AC-084; Q10 |
| States | Loading, Strapi unavailable, terms missing, not published, duplicated or blank | Terms load with the country's content; AC-015 to AC-017 apply: AC-077; Q5 |
| States | Payment processing, rejected, technical failure, invalid answer | AC-078, AC-080, AC-081; Q8, Q14 |
| States | Confirmation | AC-083 |
| Limits | Values of four or fewer letters and digits; separators; letter case | AC-069, AC-068 |
| Limits | Date shown shifted by the device's time zone | Calendar date as entered: AC-068 |
| Limits | Long terms text; long values at 320 px | Scroll inside the dialog; wrapping: AC-075, AC-092 |
| Limits | Quote number uniqueness without storage | Random, not guaranteed unique, accepted for the simulation: AC-084; Q10 |
| Validation | Where summary copy and messages come from; missing copy | Strapi; missing copy is invalid content: AC-073 |
| Validation | Pay activated before accepting the terms | Disabled style, still focusable, message and focus: AC-076; Q7 |
| Navigation | What "edit data" and "change plan" return to, and the way back to the summary | Form step of the section / plan step; back through the configured order: AC-071, AC-072; Q12 |
| Navigation | Entering the summary address directly | AC-088 (AC-024, AC-056) |
| Navigation | Reload, back, leaving; leave confirmation; terms acceptance on return | No leave confirmation; acceptance not stored: AC-089, AC-076; Q6, Q13 |
| Navigation | Double activation of pay; other actions while processing | One request; actions locked: AC-078; Q13 |
| Navigation | Leaving while the payment is processed | Answer ignored, nothing recorded: AC-089; Q13 |
| Navigation | After the confirmation: reload, back, forward, paying again, a new quote | AC-085, AC-086, AC-087; Q11 |
| Data | What leaves the browser to pay; what the endpoint stores or logs | Country and plan only; nothing stored or logged: AC-079; Q9 |
| Data | Personal data on the confirmation | None: AC-083 |
| Security | Public access to terms and the payment endpoint | AC-082; Q15 |
| Accessibility | Headings, term and description pairs, names, associations, announcements, dialog, keyboard, reduced motion | AC-090, AC-091, AC-093; AC-075 for the dialog |
| Responsive | 320, 375 and 1280 px; target size | AC-092 |

## Approved scope and exclusions

In scope, for component `app`:

- The summary of the quote: data grouped by form step, value presentation, masked fields, the chosen plan and its final price, edit data and change plan actions, and the summary copy (REQ-014).
- Terms and conditions per country: content, display in a dialog, acceptance that enables pay, loading and validation (REQ-015).
- The simulated payment: one request per activation and locked pay action, data minimization, the endpoint's outcome, rejected and failed payments, public access (REQ-016).
- The confirmation: content, simulated quote number, persistence for the tab, changes after paying, new quote (REQ-017).
- Navigation and data of the summary step: direct entry, reload, leaving, leaving while processing (REQ-018).
- Accessibility and responsive behavior of the summary, the terms dialog and the confirmation (REQ-019).
- Seed terms, summary copy and masked marks for Colombia and Chile (REQ-020).

Excluded from this change:

- Any real payment, payment gateway, payment method form or card data (P5); any real policy issuance.
- Storing quotes, payments, quote numbers or terms acceptances anywhere outside the tab's session storage; sending a confirmation by email or offering a downloadable receipt.
- Guaranteed uniqueness of the quote number (AC-084).
- Verification of the RUT check character (CHG-001 owner answer Q1); masking anywhere other than the summary step and the confirmation.
- Terms versioning, terms in rich text or with links, and a record of when terms were accepted (Q5, Q6).
- Showing coverages, benefits or the base price on the summary (Q4).
- A shortcut from an edited form step straight back to the summary (Q12).
- Request timeouts beyond the browser's own: a payment request that never answers keeps the locked state of AC-078 until the person leaves or reloads (AC-089).

## Exact bases by component/capability

| Capability | Component | Base revision |
| --- | --- | --- |
| CAP-003 | app | none (new capability; no integrated contract exists) |

CAP-001 and CAP-002 are not modified by this bundle: no requirement or acceptance criterion of theirs is revised, replaced or retired. CAP-003 relies on their behavior and cites it where it applies (AC-008, AC-011, AC-015 to AC-017, AC-020, AC-023 to AC-026, AC-033 to AC-035, AC-042, AC-045, AC-046, AC-050, AC-051, AC-053 to AC-056). AC-082 conflicts with the "nothing else" clause of CAP-002's AC-066; that is open question Q15.

## Requirements and acceptance

The authoritative texts are the files of the proposed CAP-003 snapshot: requirements REQ-014 to REQ-020 and acceptance criteria AC-067 to AC-095, each acceptance file stating its verification method. Requirement and acceptance IDs are project-wide, so they continue after CHG-002's REQ-013 and AC-066. Short form:

| AC | REQ | Behavior | Verification |
| --- | --- | --- | --- |
| AC-067 | REQ-014 | Entered data in one section per form step, titled with the step title, fields in configured order | Unit test (component, both countries) and end-to-end test (both countries) |
| AC-068 | REQ-014 | Option labels, dates with the country's locale (no time zone shift), numbers and text as entered, checkbox yes/no, empty optional fields omitted | Unit test |
| AC-069 | REQ-014 | Fields marked in Strapi shown masked: last four letters or digits visible, separators kept; full value never on the page | Unit test (function, schemas) and end-to-end test (both countries) |
| AC-070 | REQ-014 | Chosen plan name and stored final price; nothing else of the plan | Unit test (component) and end-to-end test (both countries) |
| AC-071 | REQ-014 | Edit action per section goes to that form step; back to the summary through the configured order | End-to-end test (both countries) and unit test (component) |
| AC-072 | REQ-014 | Change plan, back action and browser back go to the plan step; a new choice reaches the summary | End-to-end test (both countries) and unit test (component) |
| AC-073 | REQ-014 | Summary and confirmation copy from Strapi; missing copy makes content invalid | Unit test (component, schemas) |
| AC-074 | REQ-015 | Terms dialog with the country's published text as plain paragraphs; changes on reload; no drafts | End-to-end test (both countries; published change) and unit test (component) |
| AC-075 | REQ-015 | Modal terms dialog: focus to title, scrolls, Escape and close, focus return | Unit test (component) and end-to-end test |
| AC-076 | REQ-015 | Unchecked acceptance; pay disabled but focusable; message and focus; check enables pay | Unit test (component) and end-to-end test (both countries) |
| AC-077 | REQ-015 | Terms loaded with the country's content; loading, unavailable, and invalid when none, several or blank | Unit test (schemas, reader, component) and end-to-end test |
| AC-078 | REQ-016 | One payment request; pay and other actions locked while processing; status announced | Unit test (component) and end-to-end test (both countries) |
| AC-079 | REQ-016 | Only country and plan sent to pay; nothing entered in requests, address or console; endpoint stores and logs nothing | End-to-end test (both countries) and unit test (endpoint) |
| AC-080 | REQ-016 | Endpoint approves an offered plan of the country with a quote number; rejects otherwise; no chance involved | Unit test (endpoint) |
| AC-081 | REQ-016 | Rejection, failure or invalid answer: Strapi message, everything kept, pay again sends one request | Unit test (component) and end-to-end test (both countries) |
| AC-082 | REQ-016 | Public role: read wizard content incl. terms, price-quote and payment endpoints, nothing else; no token | Unit test (bootstrap) and end-to-end test |
| AC-083 | REQ-017 | Confirmation with title, message, quote number, plan and amount paid; focus; progress complete; no personal data | Unit test (component) and end-to-end test (both countries, full flow) |
| AC-084 | REQ-017 | Quote number `CC-YYYYMMDD-XXXXXX`, random, not stored | Unit test (fixed clock and random source) and end-to-end test (both countries) |
| AC-085 | REQ-017 | Confirmation stored for the tab; summary address shows it again; no second payment | Unit test (store) and end-to-end test |
| AC-086 | REQ-017 | Changing data or plan after paying discards the confirmation; unchanged navigation keeps it | Unit test (store) and end-to-end test |
| AC-087 | REQ-017 | New quote discards the country's data and opens the empty first step | Unit test (store, component) and end-to-end test |
| AC-088 | REQ-018 | Direct entry to the summary with complete data shows it; otherwise AC-024, AC-056, AC-085 | End-to-end test and unit test |
| AC-089 | REQ-018 | No leave confirmation; acceptance not kept on reload; leaving while processing ignores the answer | Unit test and end-to-end test |
| AC-090 | REQ-019 | Headings, term and description pairs, names, associations, announcements; automated scan in every state | End-to-end test (both countries) and unit test (component) |
| AC-091 | REQ-019 | Keyboard-only use, including the terms dialog | Declared manual check |
| AC-092 | REQ-019 | No horizontal scrolling at 320, 375, 1280 px; terms scroll in the dialog; target size | End-to-end test and declared manual check |
| AC-093 | REQ-019 | Reduced motion | Declared manual check |
| AC-094 | REQ-020 | Seed terms, summary copy and masked document number for Colombia | End-to-end test |
| AC-095 | REQ-020 | Seed terms, summary copy and masked RUT for Chile | End-to-end test |

## Normative deltas

Add REQ-014 to REQ-020 to the new capability CAP-003. Nothing is revised, replaced or retired (see Q15 for a possible revision of CAP-002's REQ-009).

## Components, dependencies and references

- Component: `app` (user-facing).
- Dependencies: `app` CAP-001 at `d9a109a9933d4153ee9a5295d15a679e3561ced3e0104bcbf99c35f5fe2120fb` (integrated, CHG-001) and `app` CAP-002 at `c8a973e708d69f46246a2ca995ddbfd53b1843b7b0c7925b1d2cfae054b35a36` (approved in CHG-002, integration pending). The summary needs the country context, wizard shell, wizard data store and form steps of CAP-001, and the chosen plan, its final price and the price formatting of CAP-002. Roclec treats the CAP-002 dependency as satisfied only once that revision is integrated for `app`, so the implement gate of this change waits for CHG-002's integration (Q16).
- Pinned agreed references: architecture, context, design, engineering, flow, principles, stack, verification. The CAP-003 snapshot pins ADR-001, architecture, context, design and principles.
- Verification mapping (for the plan and implement stages, not part of this bundle): `.roclec/project.toml` needs AC-067 to AC-095 added to the `acceptance_ids` of the checks that will run their automated tests (`shared-unit`, `web-unit`, `cms-unit`, `e2e`); AC-091 and AC-093 are declared manual checks recorded as observations, and AC-092 also has a manual part.

## Decisions, alternatives and open questions

### Architecture decisions

- ADR-001 (accepted) applies: terms are a collection related to `Country`; the summary is the step type `summary`, last in each country's sequence; every content request filters by country; prices and dates use the country's locale and currency with `Intl`; no code names a country.
- No new architecture decision is proposed. The agreed architecture reference already decides the simulated payment as a stateless custom endpoint in Strapi that "returns success or failure and, on success, a simulated quote number" and stores nothing, its public permission, terms as a content type read by the content client, the request flow ("after the terms are accepted, the payment endpoint is called once and its result is shown"), and the wizard data in a signals store mirrored to session storage, where the confirmation is kept. The masked mark on form fields (AC-069) and the summary copy (AC-073) are content attributes, which ADR-001 leaves to the architecture reference and the specs, as CHG-002 did for the pricing marks and the plan list copy.
- Alternatives that would need a reference update or an ADR are flagged in the questions: a Strapi-configured payment outcome (Q8, alternative C, a new content type not listed in the architecture) and a masking rule configured per country (Q1, alternative B).

### Open questions

Each question has a proposed resolution already written into the acceptance criteria, for the owner to confirm or correct. The alternatives are the options considered.

- **Q1. Masking rule and which field is masked (BR-02).** Proposed: a text field can be marked in Strapi as "masked in the summary" (seed: "Número de documento" in Colombia, "RUT" in Chile); one rule in code for every country: every letter and digit except the last four is replaced with `•`, separators are kept, and a value of four or fewer letters and digits is fully masked (`1234567890` → `••••••7890`, `12.345.678-5` → `••.•••.678-5`). The document type stays visible. Alternatives: (A) keep the last three instead of four; (B) the number of visible characters configured per field in Strapi (more flexible; the mask is then content); (C) output without separators (`•••••6785`), which hides the RUT's shape; (D) mask a fixed field type such as "identity document" instead of a free mark. Impact: AC-069, AC-090, AC-094, AC-095.
- **Q2. How "my data" and "my vehicle's data" are grouped (BR-01, SC-01).** Proposed: one section per form step, titled with the step title from Strapi (Colombia: one section "Tus datos y tu vehículo"; Chile: "Tus datos" and "Tu vehículo"); it needs no new content. Alternative: a group mark on each field in Strapi (policyholder or vehicle) with headings from the summary copy, so both countries show two sections even with one form step; it adds a required attribute to every field. Impact: AC-067, AC-071.
- **Q3. Presentation of values.** Proposed: option labels instead of values; dates as day, month and four-digit year with `Intl` and the country's locale (`05/03/1990` in Colombia, `05-03-1990` in Chile); numbers and text exactly as entered (a plate typed in lower case stays lower case; years without thousands separators); checkbox values as yes/no copy; empty optional fields not listed. Alternatives: plates and RUT shown in upper case; a long date ("5 de marzo de 1990"); empty optional fields listed with a "not provided" text. Impact: AC-068, AC-073.
- **Q4. What the summary shows of the plan, and whether its price is requested again.** Proposed: the plan name and the final price stored on the plan step, not requested again (the plan step already requests it every time it is shown, AC-053, and the summary is reachable only with that price, AC-056). Alternatives: also show coverages, benefits and the base price; request the final price again on every summary display, which adds waiting and error states to the summary and catches a base price changed in Strapi after the plan step. Impact: AC-070.
- **Q5. Terms content and its validity.** Proposed: one terms entry per country (ADR-001's Terms collection) with a plain long text whose blank-line-separated blocks are paragraphs, no markup; terms are loaded with the country's content when the wizard loads (as CHG-002's answer Q9 for plans), and a country with no published terms, several published entries, or a blank text is invalid content, so its wizard shows the "not available right now" message from the first step. Alternatives: rich text (Strapi blocks or Markdown) with headings and links, which needs a renderer and sanitization; loading terms only on the summary step and, when missing, showing a message there with pay unavailable, so the person discovers the problem only at the end; with several entries, using the first by creation order. Impact: AC-074, AC-077.
- **Q6. How the terms are shown and accepted.** Proposed: a "view terms" action below the pay action (design reference: terms link below the call to action) opens a modal dialog with the text; a checkbox above the pay action records acceptance; opening the text is not required to accept; acceptance is never stored, so it starts unchecked every time the summary is shown, including after a reload. Alternatives: the text inline in a scrollable box on the summary; acceptance allowed only after opening or scrolling the text; acceptance kept in session storage across reloads. Impact: AC-074, AC-075, AC-076, AC-089.
- **Q7. "The pay button is disabled until I accept them" (BR-04, SC-02).** Proposed, mirroring CHG-001's answer Q2 and CHG-002's answer Q12: disabled style and disabled state for assistive technologies, but still focusable; activating it sends nothing, shows the Strapi message asking to accept the terms and moves focus to the checkbox. Alternative: natively disabled (not focusable, no message), which keyboard and screen reader users cannot discover as easily. Impact: AC-076.
- **Q8. How the simulated payment fails (SC-04).** Proposed: the endpoint approves every well-formed request for a plan that is published, active and of that country, and rejects any other request; nothing random. With the seed, a rejection happens when the business team deactivates or unpublishes the chosen plan after the summary was shown; end-to-end tests produce rejections and network failures by answering the request in the browser. Consequence: a person cannot trigger a rejection from the screen with the seed data. Alternatives: (B) a mock gateway: after pay, a simulated gateway dialog lets the person choose "approve" or "reject" (demonstrable, adds an interaction the story does not state); (C) a Strapi setting with the outcome, editable by the business team (needs a new content type and an architecture reference update); (D) a server environment variable forcing the outcome (needs a restart to change); (E) a random rejection rate (not deterministic, hard to test). Impact: AC-080, AC-081.
- **Q9. What the payment request carries and which amount is "paid".** Proposed: only the country code and the plan's identifier; the amount shown as paid is the final price shown on the summary; the endpoint does not compute or check an amount. Alternatives: send the same derived ages as the price quote (AC-046) so the endpoint recomputes and returns the amount charged; send the amount and have the endpoint reject it when it differs from its own computation. Both add data leaving the browser and a "price changed" case. Impact: AC-079, AC-080, AC-083.
- **Q10. Quote number format.** Proposed: country code in upper case, the UTC date and six random upper-case letters or digits (`CO-20261123-7KQ2MX`), not stored and not guaranteed unique. Alternatives: a prefix configured per country in Strapi; digits only; a random UUID. Impact: AC-084.
- **Q11. Behavior after the confirmation.** Proposed: the confirmation is stored with the country's wizard data, which is kept; the summary address shows the confirmation (never the pay action again) until the person changes the quote (changed form values, another plan) or starts a new quote; going back shows the earlier steps with their data as usual; a "new quote" action clears the country's data and opens the empty first step. This keeps AC-020, AC-024, AC-053 and AC-056 of CAP-001 and CAP-002 unchanged. Alternative: a terminal confirmation that discards the entered data at once; it is more conventional but contradicts AC-024 and AC-056 (the summary address would show the confirmation with incomplete steps), so CAP-001 and CAP-002 would need revisions. Impact: AC-083, AC-085, AC-086, AC-087.
- **Q12. Where "edit data" returns.** Proposed: the edit action of a section opens that form step; the person then continues through the configured order, passing the plan step (which requests the final price again, AC-053, AC-054) before the summary. Alternative: after editing from the summary, continue goes straight back to the summary when nothing else is incomplete, which needs a new navigation mode in the wizard shell and a fresh final price on the summary. Impact: AC-071.
- **Q13. Leaving the summary and the processing lock.** Proposed: the summary never shows the leave confirmations of AC-033 and AC-034, even with the terms checked or a payment processing; leaving while processing ignores the answer and records no confirmation (nothing is charged in a simulation); while processing, the terms, view terms, edit, change plan and back actions are locked too. Alternatives: ask before leaving while a payment is processed; record the confirmation even when the answer arrives after leaving; lock only the pay action. Impact: AC-078, AC-089.
- **Q14. Error message.** Proposed: one Strapi message for a rejection and for a technical failure, shown next to the pay action and announced; focus stays where it was and pay is enabled again. Alternatives: separate copy for "rejected" and "could not connect"; move focus to the message. Impact: AC-073, AC-081.
- **Q15. Public role list and CAP-002's AC-066.** AC-066 (CAP-002, approved, integration pending) states that the public role has the read actions plus the price-quote endpoint "and nothing else", and that the payment endpoint is not part of CHG-002. AC-082 adds the payment endpoint, so both cannot hold at once. Proposed: once CHG-002 is integrated, revise this bundle before approval to add a CAP-002 base at its integrated revision and a `revise` delta on REQ-009 that retires AC-066, so AC-082 becomes the only statement of the public role. Alternatives: approve this bundle as it is and retire AC-066 in a separate follow-up change; or keep AC-066 and word AC-082 as an addition, accepting two criteria that disagree until one is retired. Impact: AC-082, bases, deltas.
- **Q16. Capability and dependencies.** Proposed: US-03 is a new capability CAP-003 that depends on CAP-001 (integrated) and on CAP-002 at CHG-002's approved revision; Roclec will block this change's implement gate (`DEPENDENCY_PENDING`) until CHG-002 is integrated for `app`; this change can be approved, planned and prototyped meanwhile. As with CHG-001's answer Q3 and CHG-002's answer Q13, US-01 to US-03 are released together, and the end-to-end tests of this change cover the complete flow from country selection to the confirmation for both countries, as the verification reference requires. Alternative: a revision of CAP-002 to add the summary, which would mix plan selection and payment in one capability. Impact: dependencies, bases, release planning.
