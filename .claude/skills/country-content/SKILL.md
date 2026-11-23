---
name: country-content
description: Load when planning, implementing or reviewing a change that adds or modifies country-specific content in Strapi (content types, fields, wizard steps, plans, terms, themes, seed data) or the code that reads it.
---

# Country content

## Purpose

Every screen of the application, starting with the wizard, depends on content that differs by country and is edited by the business team in Strapi. This skill is the repeatable procedure to add or change that content end to end, from the Strapi model to the tests, so that no change breaks the single build for both countries or exposes more than the public role should.

## Applies to

- Stages: plan, implement and review (declared in `.roclec/flow.toml`).
- Components: `app` (`apps/cms`, `packages/shared`, `apps/web`, `e2e`).

## Authority

- `ADR-001` (`docs/adr/ADR-001-multi-country-content.md`)
- `principles` (`.roclec/constitution.md`): P1, P2, P3, P4, P5
- `architecture` (`docs/architecture.md`)
- `engineering` (`docs/engineering.md`)
- `verification` (`docs/verification.md`)
- `design` (`docs/design.md`), for country themes
- External skill `strapi-docs-mcp`: use it for Strapi API, configuration and CLI questions instead of memory.

## Procedure

1. **Check the decision.** Confirm the change fits ADR-001. A new step type, content that is not scoped by country or a change to how the country is resolved needs a proposed ADR before any code.
2. **Model it in Strapi.** Create or edit `apps/cms/src/api/<type>/content-types/<type>/schema.json`. Every country-scoped type has a many-to-one relation to `Country` and draft and publish enabled. Reusable groups of fields go in `apps/cms/src/components/<category>/`. Schema files are committed.
3. **Regenerate and share types.** Regenerate the Strapi TypeScript types and expose them through `packages/shared`. Update the matching Zod schema in `packages/shared` and add unit tests with valid and invalid content.
4. **Open only what is read.** If the wizard reads the type, add `find` and `findOne` for it to the public role permissions applied in the bootstrap. Any other permission, or one not covered by the architecture reference, requires updating that reference first.
5. **Seed both countries.** Extend the seed module for Colombia and Chile. The seed runs only when the database is empty, and the two countries keep different step configurations.
6. **Read it by country.** The front end requests the content filtered by the current country code, sorted by `order` and limited to published (and, where the type has it, active) entries. It validates the response with the shared Zod schema and handles loading, error and empty states.
7. **Test it.** Unit tests for the schema; component tests with fixtures for both countries; the end-to-end flow covers the change for Colombia and for Chile. Test titles include the acceptance criterion ID.

## Examples

Correct: the plan list requests `GET /api/plans?filters[country][code][$eq]=cl&filters[active][$eq]=true&sort=order:asc`, validates it with the shared plan schema and renders whatever plans arrive.

Mistake: `if (country === 'cl') { showRutField() }`. Country differences must come from content, never from code (P1).

## Verification

A reviewer checks, and records a finding for each unmet point:

- The change fits ADR-001, or a proposed ADR is cited.
- `schema.json` is committed, with the `Country` relation and draft and publish for country-scoped types.
- Types in `packages/shared` are regenerated and the Zod schema matches them, with unit tests.
- Public permissions are only `find`/`findOne` on types the wizard reads, applied in the bootstrap.
- Seed data covers both countries with different step configurations.
- Requests filter by country code; no code branches on a specific country.
- Tests cover both countries and cite acceptance criterion IDs.
