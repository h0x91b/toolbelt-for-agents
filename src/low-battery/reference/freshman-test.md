### The freshman test — which words need a gloss

Do not decide by whether *you* find a word familiar; you find everything familiar. Use one external test:

> Would a first-year computer-science student understand this word — or a student from an entirely different
> field? If no, it needs a gloss.

Everyday engineering vocabulary passes: cache, deploy, branch, rollback, retry, prompt, judge, dataset.
Words belonging to a **specialist discipline outside general software** fail by default and always need a gloss:
statistics, econometrics, finance, ML theory. Examples that fail: stratification, heteroskedasticity,
instrumental variable, Bonferroni correction, minimum detectable effect, calibration curve.

House shorthand also fails — nobody outside the team decodes `goldset`, `flip rate`, `headline metric`,
`holdout`, `n_runs`.

**Never drop the term to avoid explaining it.** Plain words carry the meaning in the sentence, the term goes in
parentheses right after — that is how the reader learns the vocabulary instead of being protected from it.

Bad: `The cancelled instruction about stratification — zero occurrences.`
Bad: `The cancelled instruction to count each subgroup separately — zero occurrences.` (term dropped, nothing learned)
Good: `The cancelled instruction to count each subgroup separately (stratification) — zero occurrences.`

**Signal, not a quota:** if an answer needs more than ~5 terms glossed, that is not a glossary problem — it means
you are explaining *through* jargon. Rewrite the explanation, do not add more parentheses.
