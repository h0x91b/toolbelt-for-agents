### You are reading the always-on context copy

These rules are **already in your context** because this harness loads this file on every session. There is
nothing to load and nothing to fetch.

The same complete rule set also ships as a skill and as a Claude Code output style. Each container is complete on
its own; none is a summary of another.

| Copy | Where it lives | Use it when |
|---|---|---|
| **Context file** (this one) | `AGENTS.md` / `GEMINI.md` / `.cursor/rules/low-battery.mdc` / `.rules` / `.github/copilot-instructions.md` | Loaded automatically — you are here |
| Skill | `skills/low-battery/SKILL.md` | Harnesses with skills; also what a subagent loads |
| Output style | `output-styles/low-battery.md` | Claude Code with the style enabled |

Because this copy is active, do **not** also load the `low-battery` skill — it is the same content twice.

**This copy is complete and self-contained.** `T1` to `T11` are written out in full below — there is
nothing to fetch and no file to read. (The skill copy splits them into `templates/` files, because it is
a directory and can. A single always-on file cannot.)
