# Engineering conventions

How code is written in this repository. It applies the [principles](../.roclec/constitution.md), [ADR-001](adr/ADR-001-multi-country-content.md) and the [architecture](architecture.md); technologies are in [docs/stack.md](stack.md). Testing is defined in the verification reference.

## Language

- Code, identifiers, comments, commits and documentation are in English.
- User-facing copy is in Spanish and comes from Strapi. The only copy written in the front end is the fallback shown when content cannot be loaded or is invalid, also in Spanish.

## TypeScript

- Strict mode in every package; no `any`.
- Data crossing a boundary (Strapi responses, browser storage, route parameters) is typed `unknown` until a Zod schema from `packages/shared` validates it (P3).
- Content types come from `packages/shared`; they are not redefined in the applications.

## Angular (`apps/web`)

- Standalone components, signals, `input()`, `output()` and `inject()`; built-in control flow (`@if`, `@for`); no NgModules.
- `OnPush` change detection in every component.
- File names follow the Angular style guide (v20 and later): kebab-case without type suffixes, for example `plan-card.ts`, `wizard-state.ts`. The folder tells the role: containers sit at the root of their feature folder and presentational components under `components/` (architecture).
- Data that is loaded asynchronously uses `httpResource` or `resource`. Every view that loads data handles its loading, error and empty states explicitly.
- Form steps use Signal Forms built from the field configuration; validators and error messages come from Strapi.
- Only the wizard-state store reads and writes `sessionStorage`; components use the store's API.
- No component contains conditions on specific country codes or a fixed number of steps (ADR-001).
- UI is built from Spartan UI components and Tailwind CSS utilities.

## Design and clean code

SOLID and clean code, stated as rules a reviewer can check:

- **Single responsibility:** a component, service or function does one thing. Containers orchestrate; presentational components only display.
- **Open/closed:** a new step type or field type is added as a new component registered by type, without editing the wizard shell or existing switches.
- **Liskov substitution:** every step component honors the same input and output contract, so the shell treats them alike.
- **Interface segregation:** services expose small, use-specific interfaces: content reading, price quote, payment.
- **Dependency inversion:** features depend on injected abstractions (`InjectionToken`) for content, price and payment, not on concrete HTTP clients, so tests can replace them.
- **Clean code:** names state intent; functions are short; no magic numbers or strings; no commented-out or dead code; business rules are pure functions; logic is not duplicated.

## Strapi (`apps/cms`)

- TypeScript.
- Content-type schemas live in the repository (`schema.json`); changes made with the admin Content-Type Builder during development are committed.
- Controllers stay thin; logic lives in services. The simulated price rule is a pure function in the `quote` service.
- Public role permissions and seed data are applied in the bootstrap and are idempotent (architecture).

## Security

- No API token reaches the browser; the front end reads content only through the read-only public role (P4).
- Secrets come from environment variables. `.env` files are never committed; `.env.example` lists every variable without values.
- Strapi's CORS allows only the web application's origin.
- The public role has only the permissions listed in the architecture; adding one requires updating that reference.
- Personal data entered in the wizard is not logged.

## Quality

- ESLint (angular-eslint) and Prettier pass in every package before a change is integrated.

## Commits

- Conventional Commits in English.
- Commits created by an AI agent end with a `Co-Authored-By` trailer that names the model.
