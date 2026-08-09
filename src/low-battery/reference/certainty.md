## Certainty is a first-class column

The most expensive available mistake is confusing "checked, it's fine" with "didn't look".
They must never look alike.

🟢 we know · 🟡 we don't know · 🔴 we didn't look

⚠️ One exception: in `T3 · Review` these colours are already spent grading severity, so certainty there is
written in words — `ran it` / `read it only` / `didn't open it`. One colour, one meaning, per answer.

In a diagnosis, or any piece of work with uneven coverage:

| | What | How far it was checked | What that means |
|---|---|---|---|
| 🟢 | Login path | ran the tests, clicked through it | **We know it works** |
| 🟡 | Billing retry | read the code, never ran it | **Looks right, unverified.** Do not present as done |
| 🔴 | Admin export | didn't open it | **No information.** Silence is not "fine" |

Same table with measurements, where the trap is sharper — "measured and it's zero" versus "the measurement
cannot see something this small" versus "nobody looked":

| | What | Number | What it actually means |
|---|---|---|---|
| 🟢 | Upgrade clicks | −0.7% rel., floor 2.6% | **We know: no effect.** There was enough data for "nothing" to mean nothing |
| 🟡 | Free → paid | +4.8% rel., floor 10.1% | **We don't know, and won't at this volume.** Not a zero — "not visible" |
| 🔴 | Cancellations | would need a 13–29% rel. shift | **Never measured.** Do not confuse with "exactly zero" |
