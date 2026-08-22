# Working in this repo

You are an agent editing `toolbelt-for-agents` — a plugin marketplace for coding agents. It ships one
plugin today, `low-battery`, a set of output rules. Read this before you touch anything.

## The one rule: never edit a generated file

41 files in this repo are rendered from `src/`. Every one of them carries `GENERATED from …` in its first
line. If you edit a generated file, your work is silently overwritten by the next build, and CI fails the
PR before that even happens.

```bash
node scripts/build.mjs            # write every generated file
node scripts/build.mjs --check    # exit 1 if anything is stale — this is what CI runs
```

Node 18+ and nothing else. No dependencies, no lockfile, no install step. Keep it that way.

## What is a source and what is not

| Path | |
|---|---|
| `src/repo.json` | **source** — marketplace identity, plugin list, which plugin owns the root files |
| `src/<id>/meta.json` | **source** — names, descriptions, manifest metadata, Codex UI strings |
| `src/<id>/RULES.md` | **source** — the always-on rule text, body only, carries the build markers |
| `src/<id>/templates/T*.md` | **source** — one answer template each |
| `src/<id>/reference/*.md` | **source** — conditional rule blocks, loaded on demand |
| `src/<id>/fragments/*.md` | **source** — the paragraphs that legitimately differ per copy |
| `scripts/build.mjs` | **source** — the renderer |
| `plugins/<id>/hooks/` | **source**, hand-written. The only hand-written thing inside a plugin, because it holds no rule text |
| `AGENTS.md`, `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`, `INSTALL.md` | **source**, hand-written prose |
| everything else | **generated. Do not edit.** |

`CLAUDE.md` is a symlink to this file, so every harness finds the same instructions under whichever name
it looks for.

## The marker system

`RULES.md` has no frontmatter — each target needs different frontmatter, so the build adds it. The body
carries `<!-- @name -->` markers. There are two kinds.

**Structural** — three of them, hardcoded in `build.mjs`, and the build throws if any is missing:

| Marker | Becomes |
|---|---|
| `<!-- @title -->` | the H1, per target |
| `<!-- @which-copy -->` | `fragments/which-copy.<kind>.md` |
| `<!-- @templates -->` | **skill:** the read-the-file prose from `fragments/templates-lazy.md`, with `T1` inlined. **Everything else:** all ten template bodies concatenated |

The skill gets one more pass on top, `mergePickTable()`: it widens the "How to pick" table with `Sections` and
`Read` columns instead of repeating all ten template names in a second table underneath — that duplication cost
13 lines of a file that has a ~500-line ceiling. Single-file copies keep the narrow table; they have no bundled
files to point at. It throws if the table header or any `` | `T<n>` | `` row stops matching, so a reworded table
fails the build instead of silently dropping the pointers.

**Lazy blocks** — everything else, resolved purely by convention, no config to update:

```
<!-- @numbers -->  →  src/<id>/reference/numbers.md          content for single-file copies
                      src/<id>/fragments/pointer-numbers.md  what the skill gets instead
```

To add one: put the marker in `RULES.md`, create both files, run the build. To make a block skill-only
(an instruction that means nothing to a copy with no files), skip the `reference/` file and add its name
to `SKILL_ONLY_MARKERS` in `build.mjs`.

⚠️ A marker whose name does not match its `reference/` filename **silently deletes that rule text from
every single-file copy**. This already happened once (`@page-builder` vs `interactive-page.md`) and it
cost a debug cycle. `build.mjs` now throws instead — do not weaken that check.

## Why the copies are shaped differently

This is the central design fact. Do not "simplify" it by making every copy the same.

| Copy | Shape | Because |
|---|---|---|
| **Skill** | Directory: `SKILL.md` + `templates/` + `reference/` | A skill is read off the filesystem, so it can pull in one template and one reference file per turn. The documented Agent Skills pattern, and it keeps `SKILL.md` near the recommended 500-line ceiling |
| **Output style** | One self-contained file | It is appended to the system prompt. There is no directory, no path the model can resolve at inference time, and no on-demand read. Frontmatter is exactly four fields |
| **Context files** — `plugins/<id>/AGENTS.md`, `GEMINI.md`, `.rules`, `.cursor/rules/*.mdc`, `.github/copilot-instructions.md` | One self-contained file each | Users install them by copying a single file |

A single-file copy that says "read `templates/T4.md`" names a file it cannot reach. The answer still
*looks* compliant and is missing sections — an invisible failure, strictly worse than a fat context. That
is why the split is per-target and decided in `build.mjs`, so the two renderings can never disagree about
what a rule says.

## Why some files sit at the repository root

Gemini extensions, Cursor rules, Zed's `.rules`, Copilot instructions and Antigravity's `plugin.json` are
only read from the root of a repository. Exactly one plugin owns them, named in `src/repo.json` as
`rootHarnessOwner`. **Never add a second owner** — those files exist once per repo, so a second owner
means one plugin silently overwriting another's.

`GEMINI.md` is the awkward one: it is both the Gemini extension's context file (must be at the root) and
the file a Gemini agent reads as its working instructions. The extension wins; if you are Gemini working
here, read this file too.

**Generate, do not symlink** — for everything except `CLAUDE.md`. Symlinks break on Windows without
Developer Mode and are invisible to Zed's first-match `.rules` lookup. `CLAUDE.md` → `AGENTS.md` is the
one exception, because it is a same-directory link to a file every harness reads anyway.

## Adding a plugin

```
src/<new-id>/RULES.md                      must carry the three structural markers
src/<new-id>/meta.json                     copy low-battery's, change every field
src/<new-id>/templates/T1.md … T10.md      each starts with "## T<n> · <Name>"
src/<new-id>/reference/*.md                optional
src/<new-id>/fragments/templates-lazy.md
src/<new-id>/fragments/pointer-*.md        one per lazy block
src/<new-id>/fragments/which-copy.skill.md
src/<new-id>/fragments/which-copy.output-style.md
src/<new-id>/fragments/which-copy.context-file.md
plugins/<new-id>/hooks/                    optional, hand-written
```

Add `"<new-id>"` to `plugins` in `src/repo.json`, run the build. It creates `plugins/<new-id>/` and adds
the plugin to both marketplace files. Then add a row to `README.md` and a `<details>` block to
`INSTALL.md`.

`build.mjs` expects exactly ten templates named `T1`–`T10`. A different count needs `TEMPLATE_IDS`
changed, or the `@templates` marker left out and the templates written inline in `RULES.md`.

## Verify before you claim it works

Run all of these. Schema validation alone is not enough — it misses load-layer breakage.

```bash
node scripts/build.mjs --check                    # → "up to date — N generated files match the source"
node --test 'scripts/*.test.mjs'                  # → "# fail 0"   (the 500-line skill ceiling)
claude plugin validate ./plugins/low-battery      # → "Validation passed"
claude plugin validate .                          # → "Validation passed"  (the marketplace)
for f in plugins/*/hooks/*.sh; do sh -n "$f"; done
```

**The build and the tests are mandatory before every push, no exceptions.** `node scripts/build.mjs
--check` and `node --test 'scripts/*.test.mjs'` must both pass on the exact commit you are pushing — not on
an earlier state of the branch, and not "it was green before I touched the last file". Both run in CI on
every pull request, so skipping them locally only moves the failure somewhere slower.

Quote the glob. Unquoted, zsh expands it before Node sees it, and a bare `node --test scripts/` tries to
execute the directory as a script instead of discovering the test files in it.

Both skill copies currently sit at exactly 500 lines, so **the ceiling test has zero headroom**: any rule
text added inline to `SKILL.md` fails the push. New rules go into `reference/` or `templates/` with a
pointer from `SKILL.md`. Never delete a rule to fit, and never raise `MAX_LINES` in
`scripts/skill-size.test.mjs` — the number is Anthropic's recommended ceiling, not this repo's preference.
Past it the model skims the skill instead of reading it, and a skimmed skill fails invisibly: the answer
still looks compliant and is quietly missing sections.

Then actually install it, in a scratch config so you never touch the user's own:

```bash
export CLAUDE_CONFIG_DIR="$(mktemp -d)"
claude plugin marketplace add "$PWD"
claude plugin install low-battery@toolbelt-for-agents
claude plugin list          # → "Status: ✔ enabled"
```

A scratch config has **no credentials**, so it cannot run a prompt. Anything about how an answer comes out is
verifiable there as present and valid, never as observed behaviour — say so rather than implying you saw it
work. To watch actual output you need the user's real config and a throwaway project directory.

The output style is **not** forced. `force-for-plugin: true` in an output style's frontmatter makes Claude Code
apply it the moment the plugin is enabled and stop reading the user's `outputStyle` at all, which also means
`/config` can no longer switch it off — only `claude plugin disable`. This plugin shipped that way for one
version and it was wrong: installing a marketplace plugin must not seize the answer format. `meta.json` now
carries `"forceForPlugin": false` plus a `//forceForPlugin` note, and `build.mjs` emits the frontmatter key only
when it is `true`. Do not turn it back on.

When you change how the rules are split, prove nothing was lost. Compare the multiset of non-blank lines
before and after, rather than eyeballing it:

```bash
python3 - <<'PY'
from collections import Counter
a = Counter(l.strip() for l in open("/tmp/before.md")  if l.strip())
b = Counter(l.strip() for l in open("/tmp/after.md")   if l.strip())
print("lost:", sum((a-b).values()), "added:", sum((b-a).values()))
PY
```

## Traps already paid for

Do not rediscover these.

| Trap | What actually happens |
|---|---|
| `displayName` in `.claude-plugin/plugin.json` | `claude plugin validate` fails: `Unrecognized key`. Codex takes it, but as `interface.displayName` |
| `hooks` declared in either manifest | Validation passes, then the plugin **fails to load**: `Duplicate hooks file detected`. `./hooks/hooks.json` is auto-discovered; `manifest.hooks` is only for *additional* files |
| `$schema` or a top-level `description` in `marketplace.json` | Rejected as unrecognized keys. The description belongs under `metadata.description`, and omitting it is only a warning — easy to ship half-broken |
| `(?m)` in a JS regex | Throws `Invalid group`. That is Python syntax; use the `m` flag: `/^### /m` |
| Zed's "Create skill from URL" | Imports a **single file**, so it takes `SKILL.md` and leaves `templates/` behind. Any single-file install route needs the monolithic copy instead |
| Dropping `source.path` from `.agents/plugins/marketplace.json` | Codex clones the repo and, with no `path`, uses the **repository root** as the plugin root. Root has no `skills/`, so it synthesises its own `.codex-plugin/plugin.json` and loads an empty plugin — while `codex plugin add` reports `installed, enabled`. `"source": "./plugins/low-battery"` (the Claude Code field) is a different key and does nothing here. Fixed by `path: "./plugins/<id>"`; verified on `codex-cli 0.147.0` |
| Auditing a Codex install from inside this repo | `codex debug prompt-input` picks the skill up from the project-scope `.agents/skills/low-battery/`, so a completely broken plugin install looks fine. Audit from a directory outside the repo, with a scratch `$CODEX_HOME`. `codex plugin list` is never evidence |

## Conventions

- **English only**, including the rule sets — they are meant to be shared with teams that do not speak the
  maintainer's first language.
- Commit messages in English, imperative, describing the code change.
- Hook scripts: POSIX `sh` only (Git Bash on Windows counts), resolve paths from `$0` rather than an env
  var, and **exit 0 on every failure** — a hook that errors can block session start.
- Keep reference files one level deep from `SKILL.md`. Deeper and the model previews them with `head`
  instead of reading them whole.
- Never file something smaller than the read that fetches it. That is why `T1`, at 8 lines, is inlined in
  the map rather than given its own file.

## Write your own answers under these rules

This repo's product is a set of output rules, and it eats its own cooking. Follow them in what you write
here — header block first, decision at the bottom, tables over prose, every term glossed, certainty as a
traffic light, nothing deleted to make an answer shorter.

@plugins/low-battery/AGENTS.md
