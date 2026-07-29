# 0003 - "Not relevant" is excluded from averages, never counted as zero

- **Status:** accepted, long-standing methodology rule
- **Applies to:** ICAT-TC.MainService
- **Implementation verified against code:** 2026-07-29

## Context

Assessors can mark a characteristic, question, or outcome dimension as **not relevant** to the intervention
being assessed. Not relevant is a statement that the item does not apply - it is not a score of zero, which
would mean the intervention performs as badly as possible on that item.

The distinction matters because scores are weighted averages. Treating a not-relevant item as 0 pulls the
average down twice over: it adds nothing to the numerator while still consuming weight in the denominator.

## Decision

Not-relevant items are **excluded from both the numerator and the denominator** of every weighted average.
Denominators count only relevant items and their weights. A group whose items are all not relevant produces
`null` - no score - rather than 0.

This is the single most frequently reintroduced bug in the scoring code. Any new aggregation must be written
to exclude, and any `+ 0` fallback over a possibly-not-relevant value should be treated as a defect.

## How it is enforced

`ICAT-TC.MainService/src/shared/outcome-ghg-fallback.util.ts` holds the shared helpers:

- `averageRelevantScores(scores)` - filters out `null`/`undefined` before averaging, returns `null` when
  nothing is relevant
- `averageValidOutcomeScores(scores)` - additionally discards the sentinel values `99` and `-99`
- `isGhgOutcomeModuleUsed(scores)` and `shouldFallbackGhgCategoryToSdg13(...)` - decide when an unused GHG
  outcome module should fall back to the SDG 13 score instead of contributing a zero

Tested in `src/shared/outcome-ghg-fallback.util.spec.ts`, including the case that names the rule directly:
scale relevant at 3 with sustained not relevant averages to 3, not to `(3 + 0) / 2`.

Elsewhere, relevance is represented inconsistently and needs care when touching a calculation:

- Carbon Market uses `relevance === 0` to mean not relevant, and maps it to a `null` score
  (`src/carbon-market/service/cm-assessment-question.service.ts`)
- the investor tool uses `relavance` - note the spelling - with `x.relavance == 0 || !x.relavance` marking a
  row as not calculable (`src/investor-tool/investor-tool.service.ts`)
- persisted characteristics use the string `'not_relevant'`
  (`src/methodology-assessment/methodology-assessment.service.ts`)

## Consequences

Because not-relevant reaches the arithmetic as `null`, JavaScript coercion is a live hazard: `+null === 0`,
so a stray `Number(...)`, `+x`, or `x || 0` silently converts "excluded" into "scored zero" and reintroduces
exactly the bug this decision exists to prevent. The same coercion is what made duplicate rows so damaging in
[0005](0005-cm-question-rows-are-deduplicated-at-read-time.md).

Prefer the shared helpers over a local `reduce` when adding a new aggregate, and add a spec that includes a
not-relevant member.
