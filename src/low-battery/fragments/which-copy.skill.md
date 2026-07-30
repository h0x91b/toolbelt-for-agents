### You are reading the skill copy

The same rule set ships in several containers, each complete on its own. If the output style or a
context-file copy (`AGENTS.md`, `GEMINI.md`, `.cursor/rules/low-battery.mdc`, `.rules`) is already
active, you do **not** need this skill as well — never load two copies into one context. Subagents are
the reverse case: they never see an output style, so this copy is the only one that reaches them.

**Read this file directly at its own path** — no globbing, no directory listing, no hunting for it.

This copy is a directory, so part of the rule set sits in files next to this one:

| Always here, in full | In `templates/` | In `reference/` |
|---|---|---|
| Parts 1 and 3, certainty and caveats, Part 5, the self-validation checklist | the nine answer templates | numbers, nested proportions, how to build the page |

Read one of those the moment the rule pointing at it applies — not before, and never instead.
