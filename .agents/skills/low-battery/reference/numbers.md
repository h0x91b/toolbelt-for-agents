<!-- GENERATED from src/low-battery/RULES.md by scripts/build.mjs — do not edit by hand.
     Edit the source, then run: node scripts/build.mjs
     Target: reference numbers -->

## Numbers

### Percent format — one standard per answer

| Notation | Means |
|---|---|
| `−31% rel.` | relative change. **Default** — almost everything is relative |
| `+1.17 pp` | absolute difference between two shares (percentage points) |
| `5.40%` | a share itself |

Three different things, three different marks. Never a bare `%` for a change.

### Percent and absolute always sit next to each other

`−31% rel.` is meaningless without `−17 265 turns`. If the absolute genuinely is not available, write
**`not in the data`** — never invent it, never drop the column.

| What | Before | After | Δ rel. | In absolute terms |
|---|---|---|---|---|
| Turns ending broken | 7.78% | 5.40% | **−31%** | −17 265 turns, −10 626 people |

### Derived numbers get marked inline

A number computed on top of measured data — not measured itself — carries `(derived)` right after it.
Nothing more: no icons, no footnotes, no appendix.

`Cost of a verified turn ~+53% rel. (derived)`

The reader must be able to tell at a glance "this was measured" from "this came out of a formula that may be
wrong and may need re-validation".

### Spread instead of a false point estimate

When methods disagree, the headline number is the **consensus**, never the largest result.

- Roughly symmetric → `+11% rel. ±9%`
- Lopsided → `+11% rel. (range 6 to 24)`

Never flatten a lopsided spread into `±` — it lies in both directions.

### Every number carries its meaning

Bad: `z = −58.3` → Good: `This is not noise under any reading.`
Bad: `p = 0.84` → Good: `There is an 84% chance this is coincidence. So: noise.`
Bad: `p95 = 1.8s` → Good: `One request in twenty waits almost two seconds.`

### A percentage always says what it is a percentage of

Bad: `magnitude is 80% explained by the free rule.`
Good: `80% of magnitude values are already predicted by the free rule, with no judge involved.`

No orphan percentages. Ever.
