# Car insurance quoting app

A single application that sells car insurance in Colombia and Chile: a three-step wizard (policyholder and vehicle data, plan list, summary and payment) whose fields, plans and copy are configured per country in Strapi. Product context: [docs/context.md](docs/context.md).

**Status:** the project references, ADR-001 and the agentic flow are agreed; the workspace is scaffolded (Angular, Strapi, shared package, end-to-end tests, Docker Compose) and no user story is implemented yet.

## Running the project

Requirements: Docker, and Node.js 26.13.1 with npm for local development.

```bash
docker compose up --build
```

- Web application: http://localhost:4200
- Strapi admin: http://localhost:1337/admin (create the first administrator on first visit)

The cms container generates its secrets on first start and keeps them, with the SQLite database, in the `cms-data` volume. Optional port and origin overrides are listed in [.env.example](.env.example). Seed data for both countries arrives with the user stories.

Local development without Docker:

```bash
npm install
cp apps/cms/.env.example apps/cms/.env   # then fill in the secrets
npm run dev:cms
npm run dev:web
```

The rest of the commands are listed in [CLAUDE.md](CLAUDE.md#commands).

## Requirements not met

To be listed when the implementation is complete.

## Repository guide

| What | Where |
| --- | --- |
| Agentic flow, step by step, with its diagram | [FLOW.md](FLOW.md) |
| Global context file for agents | [CLAUDE.md](CLAUDE.md) (same content in [AGENTS.md](AGENTS.md)) |
| Subagent definitions | [.claude/agents/](.claude/agents/) |
| Project knowledge skills | [.agents/skills/](.agents/skills/) (copies for Claude Code in `.claude/skills/`) |
| Principles | [.roclec/constitution.md](.roclec/constitution.md) |
| Context, stack, architecture, engineering, verification and design | [docs/](docs/) |
| Architecture decision records | [docs/adr/](docs/adr/) |
| Specs, one per user story | `.roclec/changes/CHG-NNN/`; integrated contracts readable in `specs/capabilities/` |
| Code reviews with findings and resolutions | `.roclec/evidence/` |
| Agent session logs | `.roclec/runtime/sessions/EVD-*/` (unedited originals) and `.roclec/evidence/EVD-*.session` (redacted copies) |
| Application code | `apps/web/` (Angular), `apps/cms/` (Strapi), `packages/shared/`, `e2e/` |

## Agentic flow tooling

- **Claude Code** with Claude Opus 5.5 runs every AI step.
- **Roclec** 0.9.0.dev0 records specs, approvals, runs, reviews and integrations under `.roclec/`. Its CLI runs from a local Python environment through `./.roclec/run` (for example `./.roclec/run --json check`).

[FLOW.md](FLOW.md) explains why this combination was chosen.

## Session logs

Agent sessions are stored as Roclec evidence and versioned twice: the unedited original transcript under `.roclec/runtime/sessions/EVD-*/`, and a copy under `.roclec/evidence/EVD-*.session` where values of the configured secret environment variables and matches of the configured patterns (tokens and email addresses) are replaced with `[REDACTED]`, as declared in [.roclec/project.toml](.roclec/project.toml). The evidence record holds the hash of both.

## Data

The application and its seed data use only fictitious data, and no credentials are stored in this repository. The unedited session logs include the author's own name and email address.


## Strategy and justification

In Strapi, each country is represented by a Country entry with its own wizard steps, fields, plans, and terms. The CMS defines the order of the steps and, for each form, which fields appear, which are required, and how they are validated. Angular identifies the country from the URL (/co/ or /cl/), fetches the published content for that market, and builds the quoting wizard using the same components and the same build.

I chose this strategy because the business team can publish changes for each country directly from Strapi without redeploying Angular. The configuration also lets each country define a different wizard structure. To demonstrate this, Colombia collects policyholder and vehicle details on a single screen, while Chile splits them across two screens.

## Questions


