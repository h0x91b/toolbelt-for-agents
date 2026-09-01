### You are reading the skill copy

The same rule set ships in several containers, each complete on its own. If the output style or a
context-file copy (`AGENTS.md`, `GEMINI.md`, `.cursor/rules/low-battery.mdc`, `.rules`) is already
active, you do **not** need this skill as well — never load two copies into one context. Subagents are
the reverse case: they never see an output style, so this copy is the only one that reaches them.

**Read this file directly at its own path** — no globbing, no directory listing, no hunting for it.

This copy is a directory, so part of the rule set sits in files next to this one: the eleven answer templates
in `templates/`, and numbers, thresholds, certainty, nested proportions, the attribution tag and how to build
the page in `reference/`. Everything else — Parts 1, 3 and 5 and the self-validation checklist — is here in
full. Read one of those files the moment the rule pointing at it applies — not before, and never instead.
