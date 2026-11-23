# Agentic Flow Requirements

The expected solution is an **agentic flow**: a system of AI agents that takes the user stories to QA-ready code, with people stepping in at the points you define. We do not give you the order or composition of the flow; designing it is part of the test.

## Mandatory requirements

- **Subagents.** The flow uses subagents with separate responsibilities. Their definitions (instructions, allowed tools, inputs and outputs) are versioned in the repository.
- **Skills.** The flow uses at least one custom skill, versioned in the repository, that encapsulates reusable project knowledge (for example conventions, templates or procedures).
- **Context file.** There is a global context file (`AGENTS.md`, `CLAUDE.md` or equivalent) with the conventions all agents must follow.
- **ADRs.** Relevant architecture decisions are recorded in ADRs (MADR, Nygard or similar format), with context, alternatives considered and consequences. At minimum, one on the multi-country strategy.
- **Specs.** Each user story has its spec before it is implemented.
- **Code review.** There is evidence of code review within the flow, with findings and how they were resolved.
- **Traceability.** The thread user story → spec → ADR → code → tests → review can be followed.

## Suggestions

- We suggest, though it is not mandatory, using **Spec-Driven Development (SDD)**: the spec is the source of truth and the code is derived from it. You may use an SDD framework (for example Spec Kit, Kiro or another) or your own variant, but explain why.
- The tool is your choice: Claude Code, Cursor, GitHub Copilot, OpenCode, Codex or another. **Justify your choice.**

## Step by step: from functional user story to QA handoff

You must deliver a `FLOW.md` file that explains your full flow, from receiving a functional user story until the increment is ready for QA. Include a **diagram of the flow** (Mermaid or image).

For **each step** of the flow, document at least the following:

| Step | Description | AI used? | AI, agent, subagent or skill used | Deliverable produced | Human in the loop |
|------|-------------|----------|-----------------------------------|----------------------|-------------------|
| *Step name* | *What happens and why* | *Yes / No* | *Tool, model and component* | *File or artifact produced (path in the repo)* | *Who steps in, what they review or approve, and what happens on rejection* |

This table is only the minimum format: you define the number, order and content of the steps.

### Questions to answer briefly in `FLOW.md`

- What you would do differently if a team of 5 developers used this flow.
- Which part of the flow did not work as expected and how you adjusted it.
- At which points you decided not to use AI and why.
