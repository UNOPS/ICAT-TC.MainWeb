# 0005 - Carbon Market question rows are deduplicated when scores are calculated

- **Status:** accepted, implemented July 2026; the underlying write-side defect is still open
- **Applies to:** ICAT-TC.MainService
- **Implementation verified against code:** 2026-07-29

## Context

The `cm_assessment_question` table has accumulated duplicate rows for the same logical item - the same
characteristic and SDG recorded more than once for one assessment. The duplicates are historical and the code
path that creates them has never been identified (see the open issue below).

Duplicates are not merely untidy. A duplicate row usually carries a `NULL` `selectedScore`, and `+null === 0`
in JavaScript, so each duplicate enters a weighted average as a zero in both numerator and denominator -
precisely the failure mode [0003](0003-not-relevant-is-excluded-not-zero.md) exists to prevent.

This surfaced in July 2026 when a country team reported Carbon Market "Outcome of Change" category scores
reading far too low: SD Scale showing 0.5 against an expected 1.7, Sustained SD showing 0 against 2.0.
Per-characteristic scores looked correct while the aggregates did not, because the process query and the
results display path each deduplicated and the outcome query did not. Against the production database, one
assessment held 80 outcome rows for 30 real (characteristic, SDG) items, which reproduced every reported
figure exactly.

## Decision

Every calculation path that reads Carbon Market question rows **deduplicates to one authoritative row per
logical item before aggregating**. Reads defend themselves; they do not assume the table is clean.

Authoritative means: prefer a row that carries a real answer, then the highest `id`.

## How it is enforced

In `src/carbon-market/service/cm-assessment-question.service.ts`:

- the process query deduplicates in SQL, selecting `MAX(aq2.id)` per item
- `calculateOutcomeResult` deduplicates in code at the top of the method, keyed by
  `characteristicId_selectedSdgId`, preferring a row with a comment and then the maximum id
- the results display path deduplicates by characteristic and SDG on the same principle

Fixed alongside it, in the same method: the per-SDG `sdgs_score` accumulator used `if (sdgs_score[id])`,
which treats a running total of exactly 0 as unset and overwrites it instead of adding. It now tests for
existence. This is the same falsy-zero family of bug as the `null` coercion above.

After the fix, the reported assessment computes SCALE_GHG 3.0, SCALE_SD 1.667 raw, SUSTAINED_SD 2.0,
SCALE_ADAPT 2.5 and an overall Outcome of 2.192 raw - matching the team's expectations up to the half-point
floor described in [0002](0002-scores-are-floored-to-half-points.md).

## Data cleanup performed, and the damage it caused

On 2026-07-27 duplicates were deleted database-wide: 3,414 `cm_assessment_question` rows and 3,269
`cm_assessment_answer` rows across 212 assessments. A small set of rows protected by a data request was
excluded by design. The deletion ran inside a transaction with pre-delete safety assertions, row counts were
reconciled afterwards, and a full backup of the deleted rows was taken first.

**The cleanup was wrong, and the backup is the only reason it was recoverable.** It deduplicated every row in
the table with the outcome key — characteristic and SDG — and treated a null `selectedScore` as proof that a
row held no real answer. Neither holds for process-of-change or precondition rows, which are identified by
their question and store their answer in `answerId`. Distinct guiding questions were therefore deleted as
though they were duplicates of one another, and answered rows were deleted as though they were blank: 2,788
answered rows across 212 assessments, against only 517 genuinely duplicate rows. A country team reported one
assessment's Process of Change score falling from 3 to 2 two days later.

All 2,788 rows and their 2,792 answers were restored with their original ids on 2026-07-29, leaving the 517
true duplicates deleted. The outcome-of-change work described above was unaffected throughout, and the
assessment that prompted this record still computes the figures given.

[0007](0007-cm-row-identity-depends-on-question-type.md) states the rule this cleanup violated, and applies to
any future script of the same kind.

The read-time dedup was **not** removed afterwards, and should not be. It is what keeps the calculations
correct while the write-side defect remains.

## Open issues

1. **Duplicates carrying real scores still exist.** The cleanup targeted rows it read as unanswered, so
   outcome duplicates holding real scores were left alone. They represent genuinely conflicting answers and
   need human judgement, not a script. Read-time dedup currently picks one of them.
2. **The write path that creates duplicates is unfixed.** Until the Carbon Market outcome save path is
   investigated, the table will keep accumulating them.
3. **The 2026-07-27 cleanup must not be re-run in that form.** Any repeat needs the per-type keys set out in
   [0007](0007-cm-row-identity-depends-on-question-type.md), and per-type counts reviewed before it runs.
