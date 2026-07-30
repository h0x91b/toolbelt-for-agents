# Install low-battery

`toolbelt-for-agents` is a **marketplace** repo. It ships one plugin today: **`low-battery`**, an output
style that shapes every answer for a reader with 30–60 seconds of attention. Apache-2.0.

Repo: <https://github.com/h0x91b/toolbelt-for-agents> · slug `h0x91b/toolbelt-for-agents` · marketplace name
`toolbelt-for-agents` · plugin name `low-battery`.

The same rules are generated into one file per harness, so every harness gets a native container. Generated
files at the repo root — `GEMINI.md`, `.rules`,
`.cursor/rules/low-battery.mdc`, `.github/copilot-instructions.md`, `.agents/skills/low-battery/SKILL.md`,
`plugin.json`. Plugin-scoped files live under `plugins/low-battery/`.

**One structural thing to know before you copy anything by hand.** The two containers are shaped
differently on purpose:

| Container | Shape | Why |
|---|---|---|
| The **skill** | A directory: `SKILL.md` + `templates/T1.md` … `T9.md` | A skill can read bundled files on demand, so it carries the always-on rules and pulls in only the one answer template it needs |
| The **output style** and every **context file** (`plugins/low-battery/AGENTS.md`, `.rules`, `.mdc`, Copilot) | A single self-contained file, all nine templates written out | These are injected wholesale into a system prompt or an always-on context. There is no path to resolve and nothing to fetch |

So whenever you place the skill by hand, copy the **whole folder** (`cp -R`), never just `SKILL.md`.
Every command below already does. Anything that installs a single file — the plugin's `AGENTS.md`, `.rules`, the Cursor
rule — is complete on its own and needs nothing extra.

<details>
<summary><strong>Claude Code — install the plugin, then pick the output style in <code>/config</code></strong></summary>

The plugin ships a Claude Code output style at `plugins/low-battery/output-styles/low-battery.md`. Installing
the plugin adds it to your list of styles. **It does not apply itself** — you pick it, exactly like any
built-in style, and you can pick your way back out.

That is deliberate. A plugin *can* seize the format by putting `force-for-plugin: true` in the style's
frontmatter, which makes Claude Code apply it on enable and stop reading your `outputStyle` at all — at which
point the only way out is disabling the whole plugin. This plugin does not do that. Installing a marketplace
plugin should not take your answer format hostage.

There is no `/low-battery` to type for the main conversation — once the style is picked, it is simply on.

**The complement — why a skill exists too.** An output style applies to the **main conversation only**.
Subagents run their own system prompt and never see it. So the same rules also ship as a skill at
`plugins/low-battery/skills/low-battery/SKILL.md` — that is what a subagent loads, and it is what gives you the
explicit `/low-battery` handle when you want the rules named on purpose.

### Install

```bash
claude plugin marketplace add h0x91b/toolbelt-for-agents
claude plugin install low-battery@toolbelt-for-agents
```

Restart Claude Code.

### Switch the style on — required, one time

1. Run `/config`.
2. Type `output style` to filter the list, then press Enter on that row.
3. Press Space to open the picker, choose **`low-battery:Low Battery`**, Enter to confirm, Enter again to save.

The `low-battery:` prefix is Claude Code marking a style as coming from a plugin — the style's own name is
`Low Battery`. From the next turn, answers come out in low-battery shape.

Prefer editing the file? Put this in `~/.claude/settings.json` for every project, or in
`.claude/settings.local.json` for one:

```json
{ "outputStyle": "low-battery:Low Battery" }
```

To turn it off, set it back to `Default` the same way. Say "stop low-battery" or "normal mode" to drop it for
the current conversation only.

### Verify

```bash
claude plugin list
```

`low-battery` should be listed and enabled.

⚠️ `/config` shows the **saved setting**, not what is actually in force. If the row reads `Default` while your
answers still arrive in low-battery shape, something else is supplying the rules — most likely a
`low-battery` copy in your own `~/.claude/output-styles/`, or the always-on hook below.

Trying it from a clone, without installing anything:

```bash
git clone https://github.com/h0x91b/toolbelt-for-agents
claude --plugin-dir ./toolbelt-for-agents/plugins/low-battery
```

Checking a local copy or a fork before you publish it:

```bash
claude plugin validate ./plugins/low-battery
```

### Update

```bash
claude plugin marketplace update toolbelt-for-agents
```

Restart afterwards — the plugin index and hooks are read at startup.

### Uninstall

```bash
claude plugin uninstall low-battery
claude plugin marketplace remove toolbelt-for-agents
```

### Always-on hook — Claude Code users normally do NOT need this

`plugins/low-battery/hooks/always-on.sh` is a `SessionStart` hook that injects the whole ruleset when a flag
file exists. It is opt-in: no flag file, no injection, so installing the plugin changes nothing through this
path.

**For Claude Code it is redundant once the output style is picked** — that already applies the same rules to
every main-conversation turn, and setting the flag too loads the same text twice for nothing. Use it only if
you would rather not set an `outputStyle` at all and still want the rules always on:

```bash
touch ~/.claude/.low-battery-always     # opt in
rm ~/.claude/.low-battery-always        # opt out
```

Honours `$CLAUDE_CONFIG_DIR` if you moved your config directory. Saying "stop low-battery" or "normal mode"
still turns the rules off for the current session.

</details>

<details>
<summary><strong>Codex — no output-style concept, so it is the skill plus one of two always-on routes</strong></summary>

### Install — copy the skill folder, do not rely on the marketplace route

```bash
git clone https://github.com/h0x91b/toolbelt-for-agents
mkdir -p ~/.agents/skills
cp -R toolbelt-for-agents/plugins/low-battery/skills/low-battery ~/.agents/skills/
```

Start a new session and invoke it with `$low-battery`, or pick it from the `/skills` picker.

User-scope skills live in **`~/.agents/skills`**, not `~/.codex/skills`.

🔴 **The marketplace route does not currently work for this repo** — verified on `codex-cli 0.146.0`:

```bash
codex plugin marketplace add h0x91b/toolbelt-for-agents --ref main
codex plugin add low-battery@toolbelt-for-agents      # reports success, exposes no skill
```

`codex plugin list` then says `installed, enabled`, and `codex debug prompt-input` shows the skill is absent.
Codex treats the **repository root** as the plugin root and ignores the marketplace entry's
`"source": "./plugins/low-battery"`; it even writes its own synthesised `.codex-plugin/plugin.json` into the
clone. The root has no `skills/` directory, so there is nothing for it to pick up. Claude Code resolves the
same field correctly. Use the `cp -R` above until this is fixed.

### Verify

```bash
codex debug prompt-input | grep low-battery
```

That is the real audit rather than a guess — the skill should appear in the `### Available skills` list with a
path under `~/.agents/skills`. `codex plugin list` is not evidence: it reports the plugin as installed either
way.

### Update

```bash
cd toolbelt-for-agents && git pull
rm -rf ~/.agents/skills/low-battery
cp -R plugins/low-battery/skills/low-battery ~/.agents/skills/
```

### Uninstall

```bash
rm -rf ~/.agents/skills/low-battery
```

If you did try the marketplace route, undo it too:

```bash
codex plugin remove low-battery
codex plugin marketplace remove toolbelt-for-agents
```

### Always-on — do this, or the skill only fires when you name it

Codex has **no output-style concept at all**, so the automatic behaviour Claude Code gets for free has to be
arranged here. Three routes, in the order worth trying.

**Route 1 — one line in `~/.codex/AGENTS.md`.** Cheapest, and it survives plugin updates because the rules
themselves stay in the skill.

```md
Before writing your final answer, load the `low-battery` skill and follow it. Every turn, not only when asked.
```

Put it at the very top of the file.

⚠️ **If `~/.codex/AGENTS.override.md` exists, it fully replaces `~/.codex/AGENTS.md`** — your line in
`AGENTS.md` will never reach the model. Put it at the top of the override instead. Confirm with
`codex debug prompt-input | grep 'Before writing your final answer'`; anything else is guessing.

**Route 2 — the `SessionStart` hook flag.** Injects the whole rule set rather than a pointer, so the model
cannot skip the read.

```bash
touch ~/.codex/.low-battery-always     # opt in
rm ~/.codex/.low-battery-always        # opt out
```

Honours `$CODEX_HOME` if you moved your Codex directory. The hook reads the skill body, strips its frontmatter,
and injects it at session start.

**Route 3 — paste the rules in wholesale.** Works without the plugin's hooks at all, at the cost of going stale
on every update.

```bash
git clone https://github.com/h0x91b/toolbelt-for-agents
cat toolbelt-for-agents/plugins/low-battery/AGENTS.md >> ~/.codex/AGENTS.md
```

</details>

<details>
<summary><strong>Cursor — the rule file must be <code>.mdc</code>, a plain <code>.md</code> is ignored</strong></summary>

Cursor project rules live in `.cursor/rules/` and must use the **`.mdc`** extension with YAML frontmatter. A
plain `.md` file in that directory is **not** read as a rule. Our file is
`.cursor/rules/low-battery.mdc` with `alwaysApply: true`, so once it is in a project it applies to every
request in that project without being invoked.

### Install

```bash
git clone https://github.com/h0x91b/toolbelt-for-agents
mkdir -p .cursor/rules
cp toolbelt-for-agents/.cursor/rules/low-battery.mdc .cursor/rules/
```

### Verify

Open **Settings → Rules** and confirm `low-battery` appears as an always-applied project rule. If it is
missing, check the extension is `.mdc` and that the frontmatter contains `alwaysApply: true`.

### Update

Re-run the `cp` above after `git pull`.

### Uninstall

```bash
rm .cursor/rules/low-battery.mdc
```

### Always-on

Already always-on — that is what `alwaysApply: true` means. For every project instead of one, paste the
contents of `plugins/low-battery/AGENTS.md` into **Settings → Rules → User Rules**.

</details>

<details>
<summary><strong>Gemini CLI — extension for always-on, custom command for opt-in</strong></summary>

No plugin marketplace here. Two native routes.

### Install (extension — always-on)

```bash
gemini extensions install https://github.com/h0x91b/toolbelt-for-agents
```

The extension manifest is `gemini-extension.json` at the repo root; it sets `contextFileName: "GEMINI.md"`, so
the root `GEMINI.md` — the full ruleset — loads from message one. `git` must be installed.

### Install (custom command — opt-in)

```bash
mkdir -p ~/.gemini/commands
curl -fsSL https://raw.githubusercontent.com/h0x91b/toolbelt-for-agents/main/plugins/low-battery/skills/low-battery/agents/gemini.toml \
  -o ~/.gemini/commands/low-battery.toml
```

Start a new session and type `/low-battery`. It stays on for that session only.

### Verify

```bash
gemini extensions list      # extension route
ls ~/.gemini/commands       # command route: low-battery.toml present
```

Or type `/` in a session and confirm `low-battery` is listed.

### Update

```bash
gemini extensions update low-battery     # extension route
# command route: re-run the curl above
```

### Uninstall

```bash
gemini extensions uninstall low-battery    # extension route
rm ~/.gemini/commands/low-battery.toml     # command route
```

</details>

<details>
<summary><strong>Zed — reads the same SKILL.md natively, plus the root <code>.rules</code> file</strong></summary>

Zed's Agent reads Agent Skills natively: the same `SKILL.md`, no conversion. Zed also reads a project-level
`.rules` file, and the repo root has one — `.rules`, the full ruleset.

### Install (skill)

```bash
git clone https://github.com/h0x91b/toolbelt-for-agents
mkdir -p ~/.config/zed/skills
cp -R toolbelt-for-agents/plugins/low-battery/skills/low-battery ~/.config/zed/skills/
```

Start a new thread in the Agent Panel and type `/low-battery`.

The Skills manager's **Create skill from URL** also works, but it imports a **single file**:

```
https://github.com/h0x91b/toolbelt-for-agents/blob/main/plugins/low-battery/skills/low-battery/SKILL.md
```

⚠️ That route gives you `SKILL.md` without its `templates/` directory, and the nine answer templates live
in there. The skill would pick a template and then find nothing to read. Prefer the `cp -R` above; if you
must use the URL, copy `templates/` in afterwards.

### Install (project rules — always-on for one project)

```bash
cp toolbelt-for-agents/.rules ./.rules
```

### Verify

Open the Skills manager in the Agent Panel and confirm `low-battery` is listed, or type `/` and look for it.

### Update

Re-copy the folder after `git pull`, or re-import from the same URL.

### Uninstall

```bash
rm -rf ~/.config/zed/skills/low-battery
rm ./.rules
```

### Always-on

The `.rules` file above covers one project. For every project, paste the contents of
`plugins/low-battery/AGENTS.md` into `~/.config/zed/AGENTS.md`.

</details>

<details>
<summary><strong>GitHub Copilot — <code>.github/copilot-instructions.md</code> outranks <code>AGENTS.md</code></strong></summary>

Copilot reads Agent Skills natively — the same `SKILL.md`, no conversion. It scans `.github/skills/`,
`.claude/skills/`, and `.agents/skills/` inside a project, and `~/.copilot/skills/`, `~/.claude/skills/`, and
`~/.agents/skills/` globally.

For always-on rules, Copilot prefers `.github/copilot-instructions.md` over `AGENTS.md`: when both exist, the
Copilot-specific file wins. The repo root ships `.github/copilot-instructions.md` with the full ruleset.

### Install (skill)

```bash
npx skills add h0x91b/toolbelt-for-agents -a github-copilot        # this project
npx skills add h0x91b/toolbelt-for-agents -a github-copilot -g     # all projects
```

By hand:

```bash
git clone https://github.com/h0x91b/toolbelt-for-agents
mkdir -p ~/.copilot/skills
cp -R toolbelt-for-agents/plugins/low-battery/skills/low-battery ~/.copilot/skills/
```

### Install (always-on instructions)

```bash
mkdir -p .github
cp toolbelt-for-agents/.github/copilot-instructions.md .github/
```

### Verify

Type `/` in the chat input and confirm `low-battery` appears. Or:

```bash
npx skills list
```

### Update

```bash
npx skills update low-battery
```

Or re-copy after `git pull`.

### Uninstall

```bash
npx skills remove low-battery
rm .github/copilot-instructions.md
```

</details>

<details>
<summary><strong>Everything else — Amp, Devin, Factory, Warp, Windsurf, OpenCode, Pi, Hermes, Antigravity, any agent-skills harness</strong></summary>

Two routes work almost everywhere.

### Route 1 — the distributable `AGENTS.md`

`plugins/low-battery/AGENTS.md` is the full ruleset in the de-facto cross-harness instructions format. Drop it
into your project, or append it to your harness's global instructions file:

```bash
git clone https://github.com/h0x91b/toolbelt-for-agents
cp toolbelt-for-agents/plugins/low-battery/AGENTS.md ./AGENTS.md
```

Global equivalents, by harness: `~/.codex/AGENTS.md` (Codex), `~/.config/opencode/AGENTS.md` (OpenCode),
`~/.gemini/GEMINI.md` (Gemini CLI, Antigravity), `~/.config/zed/AGENTS.md` (Zed).

### Route 2 — install the skill with `npx skills`

```bash
npx skills add h0x91b/toolbelt-for-agents                    # this workspace
npx skills add h0x91b/toolbelt-for-agents -g                 # all projects
npx skills add h0x91b/toolbelt-for-agents -a cursor -y        # one agent only
npx skills add h0x91b/toolbelt-for-agents -a opencode -y
npx skills add h0x91b/toolbelt-for-agents -a amp -y
```

Start a new chat and type `/low-battery`.

**Where the skill lives in this repo.** Canonical copy:
`plugins/low-battery/skills/low-battery/`. There is also a byte-identical root mirror at
`.agents/skills/low-battery/`, for harnesses that only scan the repository root for skills. Use whichever your
harness finds.

Placing it by hand:

```bash
git clone https://github.com/h0x91b/toolbelt-for-agents
mkdir -p ~/.agents/skills
cp -R toolbelt-for-agents/plugins/low-battery/skills/low-battery ~/.agents/skills/
```

`~/.agents/skills/` is the shared user-scope location that Codex, Pi, and Copilot all read.

### Verify

```bash
npx skills list
npx skills ls -g    # if installed globally
```

### Update

```bash
npx skills update low-battery
```

### Uninstall

```bash
npx skills remove low-battery
```

</details>

---

## How activation works

One row per harness: the minimum file you need, and whether the rules apply on their own or only when you ask.

| Harness | Minimum file | Applies |
|---|---|---|
| Claude Code — main conversation | `plugins/low-battery/output-styles/low-battery.md` | Every turn, once **you** pick it in `/config` → Output style. Installing alone does nothing |
| Claude Code — subagents | `plugins/low-battery/skills/low-battery/SKILL.md` | On invocation only. Output styles never reach a subagent |
| Claude Code / Codex — hook route | `plugins/low-battery/hooks/always-on.sh` + flag file | **Automatically**, every session, but only while the flag file exists |
| Codex | `plugins/low-battery/skills/low-battery/SKILL.md` | On invocation (`$low-battery` or `/skills`). Automatic only via the hook flag or `~/.codex/AGENTS.md` |
| Cursor | `.cursor/rules/low-battery.mdc` (`alwaysApply: true`) | **Automatically**, every request in that project |
| Gemini CLI — extension | `gemini-extension.json` + root `GEMINI.md` | **Automatically**, from message one |
| Gemini CLI — command | `~/.gemini/commands/low-battery.toml` | On invocation (`/low-battery`), then for the rest of that session |
| Zed — skill | `~/.config/zed/skills/low-battery/SKILL.md` | On invocation (`/low-battery`) |
| Zed — rules | root `.rules` | **Automatically**, every request in that project |
| GitHub Copilot — instructions | `.github/copilot-instructions.md` | **Automatically**, every chat in that project. Outranks `AGENTS.md` |
| GitHub Copilot — skill | skill folder in a scanned directory | On invocation |
| Everything else | `plugins/low-battery/AGENTS.md`, or `.agents/skills/low-battery/SKILL.md` | `AGENTS.md`: automatically, if the harness reads it. Skill: on invocation |

⚠️ **Every prompt-based route above is advisory, not enforced.** An output style, a rule file, an `AGENTS.md`,
a skill — all of them are text handed to the model, and the model can drift away from them mid-answer. The only
surface in any of these harnesses that actually *runs* rather than *suggests* is hooks. If you need the rules
present with certainty rather than probability, use the always-on hook and check what landed with
`codex debug prompt-input`.

## Troubleshooting

**`/low-battery` is not in autocomplete.** Restart the agent. The plugin and skill index is read at startup,
so a skill installed mid-session is invisible until the next one.

**I installed the plugin and nothing changed.** Expected — installing only adds the style to the list. Pick it
in `/config` → **Output style** → `low-battery:Low Battery`, or set `"outputStyle": "low-battery:Low Battery"`
in your settings file. This plugin deliberately does not force itself on you.

**Answers changed shape and `/config` says `Default`.** `/config` shows the saved setting, not what is actually
in force, so something else is supplying the rules. In order of likelihood: a `low-battery` file of your own in
`~/.claude/output-styles/`, the always-on hook's flag file (`~/.claude/.low-battery-always`), a context-file
copy in the project (`AGENTS.md`, `CLAUDE.md`, `.rules`, `.cursor/rules/`), or a different plugin that *does*
use `force-for-plugin: true`. Saying "stop low-battery" or "normal mode" turns it off for the current session
whichever route it came in by.

**I want the style applied automatically on install, in my own fork.** Set `"forceForPlugin": true` under
`outputStyle` in `src/low-battery/meta.json` and rebuild. Know the cost: Claude Code then stops reading your
`outputStyle` entirely, so the style can no longer be switched off from `/config` — only with
`claude plugin disable low-battery`.

**`claude plugin marketplace add` fails.** Use the `owner/repo` form: `h0x91b/toolbelt-for-agents`. If you are
pointing at a local checkout, the path must be the **repo root** — the directory that *contains*
`.claude-plugin/marketplace.json`. Not `.claude-plugin/` itself, and not `plugins/low-battery/` (that is the
plugin, not the marketplace).

**The Cursor rule is ignored.** Wrong extension. It must be `.cursor/rules/low-battery.mdc` — Cursor does not
read `.md` files in that directory as rules. Also confirm the frontmatter has `alwaysApply: true`.

**Subagents ignore the rules while the main conversation follows them.** Working as designed: an output style
applies to the main conversation only, and a subagent runs its own system prompt. Load the skill inside the
subagent instead — the skill is the copy built for that case.

**I want to fork and change the wording.** Every harness file in this repo is generated. Edit
`src/low-battery/RULES.md`, then rebuild:

```bash
node scripts/build.mjs
```

**Never edit a generated file** — `GEMINI.md`, `.rules`,
`.cursor/rules/low-battery.mdc`, `.github/copilot-instructions.md`, `.agents/skills/low-battery/SKILL.md`,
`plugin.json`, and everything under `plugins/low-battery/` except `hooks/`. The next build overwrites it. Each
generated file carries a header saying so.

Then point your harness at your fork:

```bash
claude plugin uninstall low-battery
claude plugin marketplace remove toolbelt-for-agents
claude plugin marketplace add <your-username>/toolbelt-for-agents
claude plugin install low-battery@toolbelt-for-agents
```
