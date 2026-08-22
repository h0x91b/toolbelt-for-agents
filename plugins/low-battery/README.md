<!-- GENERATED from src/low-battery/RULES.md by scripts/build.mjs — do not edit by hand.
     Edit the source, then run: node scripts/build.mjs
     Target: plugin readme -->

# Low Battery

Write every answer for a reader with a nearly-empty attention budget: header block first, decision at the bottom, tables over prose, every term glossed, certainty as a traffic light, ten hard templates picked one per turn.

Everything in this directory except `hooks/` is generated from `src/low-battery/`.
Edit the source, then run `node scripts/build.mjs`.

| File | Harness |
|---|---|
| `skills/low-battery/SKILL.md` | Every skills-aware harness — always-on rules plus a map of the templates |
| `skills/low-battery/templates/T1.md`…`T11.md` | Read on demand, one per turn |
| `output-styles/low-battery.md` | Claude Code — the user picks it in `/config` → Output style |
| `.claude-plugin/plugin.json` | Claude Code manifest |
| `.codex-plugin/plugin.json` | Codex manifest |
| `skills/low-battery/agents/openai.yaml` | Codex per-skill interface |
| `skills/low-battery/agents/gemini.toml` | Gemini CLI custom command |
| `hooks/` | Claude Code / Codex opt-in always-on (hand-written) |

Install commands for every harness: [../../INSTALL.md](../../INSTALL.md).
