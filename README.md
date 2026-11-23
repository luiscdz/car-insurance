# Car insurance quoting app

A single application that sells car insurance in Colombia and Chile: a three-step wizard (policyholder and vehicle data, plan list, summary and payment) whose fields, plans and copy are configured per country in Strapi. Product context: [docs/context.md](docs/context.md).

**Status:** the project references, ADR-001 and the agentic flow are agreed; the application code does not exist yet.

## Running the project

To be added with the workspace: the whole project will start with `docker compose up`, with seed data for both countries.

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
