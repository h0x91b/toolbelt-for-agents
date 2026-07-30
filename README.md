# low-battery

**Make your coding agent answer like a person who respects your time.**

Newer models have a habit: they pad. Every answer opens with a warm-up, buries the finding in a wall of
prose, hedges instead of committing, and ends with "let me know if you'd like me to elaborate!" Ask for
something shorter and they do the worse thing — they delete the caveats and keep the filler.

`low-battery` is a rule set that fixes that. It installs into your agent and reshapes every answer:
what this is, where we stand, the substance in tables, and the decision at the bottom. It works with
Claude Code, Codex, Cursor, Gemini CLI, Zed, Copilot and anything else that reads `AGENTS.md`.

```bash
claude plugin marketplace add h0x91b/toolbelt-for-agents
claude plugin install low-battery@toolbelt-for-agents
```

Installing puts the style in your list; it does not take over your answers. Switch it on once:

1. Run `/config` in Claude Code.
2. Type `output style` to filter, then Enter on that row.
3. Press Space, pick **`low-battery:Low Battery`**, Enter to confirm, Enter again to save.

It is a normal setting from then on — pick `Default` again whenever you want out. Every other harness is
one command: **[INSTALL.md](INSTALL.md)**.

---

## What it looks like

You ask: *"Should we cache this endpoint in Redis?"*

<table>
<tr><th width="50%">Without it</th><th width="50%">With it</th></tr>
<tr valign="top">
<td>

> Great question! Let me break this down for you.
>
> There are several factors worth considering when
> evaluating a caching strategy. Redis is a popular
> choice for many teams because it offers excellent
> performance characteristics and a mature ecosystem,
> though it does introduce operational overhead that
> you'll want to weigh carefully against the benefits.
> An in-process cache could also work depending on
> your deployment topology…
>
> Ultimately, the right choice depends on your
> specific requirements. Let me know if you'd like me
> to elaborate on any of these points!

</td>
<td>

> **Template:** `T4 · Decision`
> **Task:** Pick a cache for `GET /invoices`.
> **Where we stand:** 90% of load is repeat reads.
> **Last time:** You asked if Redis fits.
> **Now:** Two options and a recommendation.
>
> | | Option | Upside | Cost |
> |---|---|---|---|
> | ⭐ | Redis | Removes 90% of load | Half a day |
> | | In-process | Zero infra | Breaks past 1 instance |
>
> **Decision:** Redis, unless you're staying
> single-instance for the next year. Your call.

</td>
</tr>
</table>

Same facts. One of them you can act on in fifteen seconds.

---

## Who it's for

Someone who runs a lot of long-lived work in parallel, comes back to a task after two days with **zero**
memory of it, and has about half a minute of attention before deciding whether to engage.

It does **not** dumb anything down. That is the whole point — the reader is an expert who is simply out
of context. The substance stays; the wording gets fixed.

---

## What it actually enforces

| Rule | What changes in practice |
|---|---|
| **Header block first** | Every answer opens by re-establishing what this even is — task, current state, what you asked last time, what's in this message |
| **Decision at the bottom** | You came to decide. No answer ends on a recap or "hope this helps" |
| **Never delete a fact to be shorter** | Long answers get *repacked* into tables, not truncated. The caveats you actually need survive |
| **Tables over prose** | Anything with 4+ numbers becomes a table, so you can skip what's boring |
| **Every term explained** | Plain words in the sentence, the jargon in parentheses: "the smallest shift this can detect (MDE)". You learn the vocabulary instead of being shielded from it |
| **Numbers that mean something** | `−31% rel.` never appears without `−17 265 turns` next to it. Computed numbers are marked `(derived)` |
| **Certainty as a traffic light** | 🟢 we checked · 🟡 we can't tell at this volume · 🔴 nobody looked. "We measured zero" and "we didn't look" stop looking identical — that's the most expensive misread available |
| **No technobabble** | If a sentence needs a second read, it's a bug. Rewritten, not annotated |
| **Size matches the ask** | A yes/no question gets two lines. Small answers don't get bureaucratised into fake reports |

### Nine answer shapes, one picked per turn

The model names the shape it chose on the first line, so you can see at a glance whether it understood
what kind of answer you wanted.

| | For | | For |
|---|---|---|---|
| `T1` | A fact, a number, yes/no | `T6` | Explaining code or docs that already exist |
| `T2` | Something got changed | `T7` | Anything resting on measurements |
| `T3` | Reviewing a PR, SQL, a doc | `T8` | It's broken right now, or diagnosing why |
| `T4` | Choosing between options | `T9` | You didn't get the last answer, again but properly |
| `T5` | Work that hasn't started yet | | |

> ⚠️ **The `Template:` line is temporary — treat it as beta.** It exists so I can see which shape the
> model picked while I'm still tuning the rules, and go edit that exact template. It will probably be
> dropped once the shapes settle; it may also stay, because knowing which template to edit is genuinely
> handy. Either way, don't build anything that depends on that line being there.

Before sending, the model walks a 23-item checklist in its own thinking — did it pick the right shape,
is every fact still there, is anything left unglossed. Most of the enforcement lives there.

In the **skill**, the nine templates and the number-formatting rules are separate files it reads only when
they apply, so a turn carries one shape and not nine. In the **output style** everything is inlined,
because a system prompt has nothing to read from. Same rules either way — [AGENTS.md](AGENTS.md) explains
why the two are shaped differently.

---

## Turning it off

Say **"stop low-battery"** or **"normal mode"** and it's off for that conversation.

To turn it off for good, put the setting back: `/config` → **Output style** → `Default`. The style stays
installed, it just isn't applied. To remove it from the list entirely:

```bash
claude plugin disable low-battery
```

---

## Two copies, on purpose

| | Covers | Notes |
|---|---|---|
| **Output style** | Your main conversation | Claude Code only. Pick it once in `/config`, then nothing to invoke |
| **Skill** | Subagents, and any harness without output styles | Gives you an explicit `/low-battery` handle |

Subagents run their own system prompt and never see an output style, which is why the skill ships too.
They're the same rules — never load both into one context.

**Honest limit:** these are instructions, not enforcement. A model can ignore them, and occasionally
does. There's no harness where prompt rules are binding.

---

## The rest of the repo

This is a marketplace that happens to hold one plugin today. Everything the agents read is generated
from `src/low-battery/` — the always-on rules, the nine templates, and the conditional blocks — so no copy
can drift from another.

Want to change the rules, or add a plugin of your own? **[AGENTS.md](AGENTS.md)** is the working guide, and
`CLAUDE.md` is a symlink to it so every harness finds it. The one thing to know up front: never edit a
generated file, edit `src/` and run `node scripts/build.mjs`.

Full behaviour spec, if you want to read the rules themselves before installing:
[`src/low-battery/RULES.md`](src/low-battery/RULES.md).

## License

[Apache-2.0](LICENSE).
