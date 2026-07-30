### You are reading the output-style copy

These rules are **already in your system prompt**. There is nothing to load and nothing to fetch.

The same complete rule set also ships as a skill and as plain context files, for harnesses that have no
output-style concept. Each container is complete on its own; none is a summary of another.

| Copy | Where it lives | Use it when |
|---|---|---|
| **Output style** (this one) | `output-styles/low-battery.md` | Claude Code with the style enabled — in the system prompt already |
| Skill | `skills/low-battery/SKILL.md` | Any harness with skills; also the only copy a subagent can see |
| Context file | `AGENTS.md` / `GEMINI.md` / `.cursor/rules/low-battery.mdc` / `.rules` | Harnesses with no skill or style concept |

Because this copy is active, do **not** also load the `low-battery` skill — it is the same content twice.

One exception worth knowing: an output style applies to the **main conversation only**. Subagents run their own
system prompt and never see it, so a subagent that needs these rules must load the skill copy.

**This copy is complete and self-contained.** `T1` to `T10` are written out in full below — there is
nothing to fetch and no file to read. (The skill copy splits them into `templates/` files, because it is
a directory and can. A system prompt cannot.)
