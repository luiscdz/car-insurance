---
name: story-spec
description: Load when drafting or revising the change bundle (spec) of any user story of this application, before it is presented for approval.
---

# Story spec

## Purpose

User stories describe what a screen or feature must do but leave product decisions open: how the country is chosen, what happens when Strapi fails, inclusive limits, differences between countries. This skill is the repeatable procedure to turn any user story of the application (the wizard screens or any later screen or feature) into a change bundle whose acceptance criteria are observable, verifiable and free of silent assumptions, so that it can pass the approve checkpoint.

## Applies to

- Stages: define (declared in `.roclec/flow.toml`).
- Components: `app`.

## Authority

- `context` (`docs/context.md`) and the user story being specified.
- `principles` (`.roclec/constitution.md`)
- `ADR-001` (`docs/adr/ADR-001-multi-country-content.md`) and any other accepted ADR.
- `verification` (`docs/verification.md`), for how each acceptance criterion is verified.
- `design` (`docs/design.md`), for accessibility and responsive rules.
- `flow` (`.roclec/flow.toml`): the approve checkpoint criteria CR-004 to CR-008 that the bundle must satisfy.

## Procedure

1. **One story, one change.** Each user story is one change with an origin of kind `story` and the story's own ID (for example `US-01`). Capture only the story text the change needs.
2. **List the origin criteria.** Every Gherkin scenario and every business rule of the story is one origin criterion with its own ID.
3. **Run the gap checklist** on the story and record each answer:
   - Country: what differs between Colombia and Chile (documents, identifiers, currency, steps, copy).
   - States: loading, error, empty and content not published; Strapi unavailable.
   - Limits: boundary values, inclusive or exclusive, dates relative to today.
   - Validation: where rules and error messages come from (Strapi) and when they show.
   - Navigation and data: entering the screen directly, going back, reloading, double submission.
   - Accessibility and responsive behavior that the design reference makes concrete for this screen.
4. **Resolve every gap.** A gap becomes a derived acceptance criterion with its reason, or a question for the owner through `roclec-clarify`. Never fill a gap with an assumption.
5. **Write the acceptance criteria.** One observable behavior per criterion, in Given/When/Then, with limits and error cases stated. Content-dependent behavior is stated for both countries. Each criterion names how it is verified: unit test, end-to-end test or declared manual check. Criteria describe behavior, not components or file names.
6. **Map coverage.** Every origin criterion is covered by acceptance criteria that actually satisfy it, or excluded or deferred with a reason for the owner.
7. **Cite decisions.** Cite every accepted ADR the change depends on. A new architecture decision the story needs is raised as a proposed ADR, never decided inside the spec.

## Examples

Correct: "Given the current year is Y, when the vehicle year is between Y−20 and Y+1 inclusive, then the step accepts it; when it is Y−21 or Y+2, then the field shows the error message configured in Strapi and the step cannot advance. Verified by unit test."

Mistake: "Validate the vehicle year according to the business rules." It repeats the story's ambiguity and cannot be tested.

## Verification

The owner, at the approve checkpoint, and any reviewer check:

- Every origin criterion has a coverage entry whose acceptance criteria actually satisfy it (CR-004).
- Every acceptance criterion states observable behavior with its limits and error cases (CR-005) and names its verification method (CR-006).
- The gap checklist was applied and every gap is a derived criterion or an owner's answer (CR-007).
- Accepted ADRs are cited and no new architecture decision is hidden in the spec (CR-008).
