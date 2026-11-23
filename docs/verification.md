# Verification

How the product is verified. It applies the [principles](../.roclec/constitution.md), [ADR-001](adr/ADR-001-multi-country-content.md), the [architecture](architecture.md) and the [engineering conventions](engineering.md); tools are in [docs/stack.md](stack.md).

## Test levels

| Level | Tool | What it covers | Location |
| --- | --- | --- | --- |
| Unit | Vitest | Pure functions (formatting, masking, simulated price rule), the wizard-state store, mapping of Strapi validations to form validators, Zod schemas with valid and invalid content | `apps/web/`, `apps/cms/` (`quote` service), `packages/shared/` |
| Component | Vitest with Angular Testing Library | Presentational components in isolation; containers with their injected abstractions replaced; loading, error and empty states | `apps/web/` |
| End-to-end | Playwright | The full flow, from country selection to payment confirmation, for Colombia and for Chile, against the stack started with Docker Compose and its seed data | `e2e/` |
| Accessibility | @axe-core/playwright | An automated scan of every wizard step inside the end-to-end tests | `e2e/` |

## Countries and data

- Tests exercise content from both countries; the seed data gives Colombia and Chile different step configurations, and the end-to-end tests run the flow for each (ADR-001).
- Unit and component tests use fixtures for both countries.
- Only fictitious data is used (P5).

## Traceability

- Every acceptance criterion names how it is verified: unit test, end-to-end test or declared manual check.
- Automated tests include the acceptance criterion ID in their title, for example `AC-03 shows only the active plans of the country`.
- A declared manual check is recorded as an observation in Roclec with the acceptance criterion ID.

## Coverage

- Coverage is reported for every package.
- Pure logic has a minimum of 80 % line coverage: `apps/web` `core/` and `shared/utils/`, the `apps/cms` `quote` service and `packages/shared`. There is no global threshold.

## Checks run by Roclec

`run verify` executes these checks on every candidate; all of them must pass:

- lint and format check;
- unit and component tests of every package, with the coverage minimum;
- production builds of `apps/web` and `apps/cms`;
- end-to-end and accessibility tests against the Docker Compose stack.

Checks always execute; results are never replayed from a cache. The exact commands are set in the Roclec profile when the workspace is created.
