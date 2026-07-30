## Nested proportions → a funnel out of 100

A share of a share of a share is unreadable, and it silently asks the reader to multiply. Rebase the whole thing
on 100 and draw it. Works for anything that narrows: requests, users, files, test cases, tickets, retries.

```
Out of 100 requests that hit the endpoint:
├─ 91 — served from cache
└─  9 — went to the database
   ├─ 8 — returned in under 50 ms
   └─  1 — timed out ❌
```

## A number built from several moving parts → step-by-step receipt

When a single headline number is the product of competing effects, the order of reasoning *is* the explanation,
and a table destroys order. Lay it out as steps, ending on the headline number.

Applies to cost, latency budgets, error budgets, disk or memory growth, build time, page weight — anything where
the reader will ask "so where does it actually come from".
