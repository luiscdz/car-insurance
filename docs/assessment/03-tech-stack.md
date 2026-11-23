# Technical Requirements (Tech Stack)

| Topic | Requirement |
|-------|-------------|
| Front end | Angular 21 or later: standalone components, signals, built-in control flow (`@if`, `@for`), no NgModules |
| Content backend | Strapi 5 or later |
| Forms | Step 1 form generated dynamically from the Strapi configuration, with typed validations |
| Multi-country | Content differentiation strategy by country, proposed by you and documented in an ADR |
| Security | No Strapi token with write permissions may reach the browser. Public role permissions minimal and justified |
| Testing | Unit tests for the relevant logic and at least one e2e test of the full flow for one country |
| Environment | The whole project starts with a single command (for example `docker compose up`), with seed data for both countries |
| Accessibility | The wizard can be completed using only the keyboard, and fields have accessible labels |
| Responsive | Works on mobile and desktop |

> List in the README any requirement you decide not to meet and why.
