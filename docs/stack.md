# Technology stack

## Choices

| Area | Choice | Location | Constraints |
| --- | --- | --- | --- |
| Language | TypeScript, strict mode | all packages | Version supported by the Angular and Strapi versions in use |
| Front end | Angular 21 or later | `apps/web/` | Standalone components, signals and built-in control flow (`@if`, `@for`); no NgModules |
| Content backend | Strapi 5 or later | `apps/cms/` | Holds the form fields and plans per country |
| CMS database | SQLite | `apps/cms/` | Used only by Strapi; quote data stays in the front end |
| CMS types | TypeScript types generated from the Strapi content types | `apps/cms/types/` | The front end uses them instead of hand-written copies |
| UI components | Spartan UI | `apps/web/` | — |
| Styling | Tailwind CSS | `apps/web/` | — |
| Forms | Angular Signal Forms | `apps/web/` | Form steps are generated dynamically from the Strapi configuration, with typed validations |
| Runtime validation | Zod | `packages/shared/`, used by `apps/web/` | Validates the content returned by Strapi before the application uses it |
| Unit tests | Vitest (Vite); Angular Testing Library for components | `apps/web/`, `apps/cms/`, `packages/shared/` | — |
| End-to-end tests | Playwright | `e2e/` | — |
| Accessibility tests | @axe-core/playwright | `e2e/` | Runs inside the end-to-end tests |
| Lint and format | ESLint (angular-eslint) and Prettier | each package | — |
| Runtime | Node.js 26.13.1 | all packages | — |
| Local environment | Docker Compose | `docker-compose.yml` | The whole project starts with a single command (`docker compose up`), with seed data for both countries |
| Package manager | npm workspaces | root `package.json` | One lockfile at the root; workspaces `apps/web`, `apps/cms`, `e2e` and `packages/shared`. Scripts are run with `npm run` |
| Shared code | Workspace package | `packages/shared/` | Types and Zod schemas used by both the front end and the CMS |

## Covered by other references

- Multi-country content strategy: ADR-001.
- Security (Strapi tokens, public role permissions): engineering reference.
- Testing scope (unit and end-to-end): verification reference.
- Accessibility and responsive behavior: design reference.
