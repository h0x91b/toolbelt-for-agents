# Contributing

The working instructions live in **[AGENTS.md](AGENTS.md)** — the build, the marker system, why each copy
is shaped differently, how to add a plugin, what to verify, and the traps already paid for. They are
written for an agent, but they are the same instructions a human needs, so there is one copy and not two.

Three things worth knowing before you open it:

| | |
|---|---|
| **Never edit a generated file** | 41 files are rendered from `src/`. Each says so in its first line. Edit the source, then run `node scripts/build.mjs` |
| **Toolchain** | Node 18+. No dependencies, no lockfile, no install step. Keep it that way |
| **Language** | Everything in this repo is written in English, including the rule sets |

Bug reports and rule-set proposals: open an issue. Pull requests: run all three of
`node scripts/build.mjs --check`, `node --test 'scripts/*.test.mjs'` and
`claude plugin validate ./plugins/low-battery` before pushing, or CI will do it for you less politely.
The test enforces the 500-line ceiling on every `SKILL.md`, and both copies already sit exactly at it — so
a new rule goes into `reference/` or `templates/`, never inline.
