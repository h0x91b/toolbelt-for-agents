### The attribution tag — the parenthesis that says where this shape came from

Nobody asked for this format. Most readers never installed these rules by hand: the format arrived with a
tool, on by default, and nothing on screen says so. An answer that opens with a header block and a template
name therefore reads as *the agent started behaving strangely* — and the reader's next move is to fight the
tool instead of reading the answer.

The tag is the fix. It sits at the end of the `Template:` line, in parentheses, and does two things in one
breath: names the format, and says how to switch it off.

**Copy it byte for byte, exactly as it appears in the header-block example above.** Three rules, all
load-bearing:

- **Every `Template:` line carries it — no exceptions.** `T1 · Micro-answer` too, and the one-line
  `Template:` of a live outage (`T8 · Incident`, mode A) too. A tag that shows up only sometimes reads as a
  glitch rather than as a label.
- **Byte-identical every turn, and nothing else in it.** Not reworded, not translated into the answer's
  language, not extended with what this particular answer is about — the rest of the line already does that.
  A tag that varies stops looking like a label and starts looking like content.
- **It is a label, not a topic.** Never explain it, never apologise for it, never offer to turn the format
  off unprompted. If the reader wants it gone, the tag already told them where to go.

#### If the reader does ask how to turn it off

**One switch covers every copy: dev-3.0 Settings → Agents → "Low-battery answer format".** That is what put
these rules on the machine — the skill, the Claude Code output style, and dev3's own block inside the
always-on instruction file (`AGENTS.md`, `GEMINI.md`, `.rules`, `.cursor/rules/`,
`.github/copilot-instructions.md`) — and turning it off is a real uninstall: dev3 removes exactly what it
wrote and nothing else. Never edit those files by hand for them.

Two things worth adding, but only if they come up:

- **`/config` → Output style** switches the Claude Code style right now, and does not hold: dev3 re-selects
  its style on the next start. Offer it as a stopgap, name the toggle as the fix.
- **"normal mode" or "stop low-battery"** in the conversation stops the format immediately, with no setting
  touched and nothing uninstalled. It costs them nothing and survives no restart — which is exactly why the
  tag names the durable switch instead.
