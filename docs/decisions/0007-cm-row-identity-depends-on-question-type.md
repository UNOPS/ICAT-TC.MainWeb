# 0007 — Carbon Market row identity depends on the question type

- **Status:** accepted 2026-07-29
- **Applies to:** ICAT-TC.MainService, and any maintenance script that touches `cm_assessment_question`
- **Implementation verified against code:** 2026-07-29

## Context

The data cleanup described in [0005](0005-cm-question-rows-are-deduplicated-at-read-time.md) deduplicated the
whole `cm_assessment_question` table with a single key — `(assessmentId, characteristicId,
COALESCE(selectedSdgId, 0))` — keeping one row per group and deleting the rest wherever no answer carried a
non-null `selectedScore`.

Both halves of that were correct for outcome-of-change rows and wrong for everything else. Process-of-change
rows are identified by their question, and one characteristic legitimately holds several guiding questions:
Adoption has `S-3-ADOPTION-Q-1` and `Q-2`, Scale up has `SCALE_UP-Q-1` and `Q-2`. Section 2 precondition rows
have no characteristic at all, so an entire assessment's preconditions collapsed into one group. And neither
type ever populates `selectedScore` — their answer is `cm_assessment_answer.answerId` with the weighted value
in `.score` — so the guard meant to protect answered rows saw every one of them as blank.

2,788 answered rows across 212 assessments were deleted; only 517 of the 3,414 deleted rows were genuine
duplicates. The reporting country team saw the Process of Change score for one assessment fall from 3 to 2,
because Adoption dropped from 2 to 0 and Scale up from 3.5 to 1.5 as their first guiding question disappeared,
and seven of nine precondition rows vanished from the export. The rows were restored from backup on
2026-07-29.

## Decision

**Anything that groups, deduplicates, compares or deletes Carbon Market question rows branches on the row type
first.** There is no single key that identifies a row across all three types, and there is no single test for
whether a row has been answered.

| Row type | Identified by | Answer stored in | `characteristicId` | `selectedSdgId` |
| --- | --- | --- | --- | --- |
| Outcome of change | characteristic + SDG | `selectedScore` | set | set for SD, null for GHG and adaptation |
| Process of change | `questionId` | `answerId` + `score` | set — several questions share one | null |
| Section 2 precondition | `questionId` | `answerId` + `score` | null | null |

The row type is told apart by `questionId`: outcome rows carry none, process and precondition rows always do.
Process and precondition rows are then separated by whether a characteristic is present.

## How it is enforced

In `ICAT-TC.MainService/src/carbon-market/service/cm-assessment-question.service.ts`, each read path already
uses the key that suits the rows it reads. Grep for these rather than trusting line numbers:

- the process queries deduplicate in SQL with a `MAX(aq2.id)` subquery correlated on `aq2.questionId` — two
  occurrences, both guarded by `category.type = "process"`
- `calculateOutcomeResult` deduplicates in code on a `characteristicId_selectedSdgId` composite key
- in `getResults`, outcome rows are deduplicated on a `${chId}_${sdgId ?? 'none'}` composite key, while
  precondition rows are deduplicated separately, keyed on `assessment_question.question.code`

Nothing enforces this for ad-hoc scripts run against the database, which is why the rule is written down here.
A maintenance script that touches these rows should deduplicate per type and report its intended deletions per
type before running, so that a key applied to the wrong rows shows up as an implausible count rather than as a
silent loss.

## Consequences

The three keys look like an inconsistency that ought to be unified. Unifying them is exactly what caused this
incident, and it will keep looking tempting to anyone reading the service for the first time.

`selectedScore IS NULL` reads like "unanswered" and is not. For process and precondition rows it is always
null, answered or not. Any check for real user data on those rows must look at `answerId`.

Because process rows are keyed on `questionId` while duplicates are collapsed by highest `id`, restoring
deleted rows alongside surviving ones is safe: removing non-maximum rows never changes which row a `MAX(id)`
dedup selects, so displayed answers are unaffected.

## Open issues

1. **The write-side defect from [0005](0005-cm-question-rows-are-deduplicated-at-read-time.md) is still
   open**, and was observed again on 2026-07-28: a single re-save of one assessment's preconditions created
   three identical rows for `S-2-C-1-Q-1`.
2. **`assessment.process_score`, `outcome_score` and `tc_value` are stored columns that can disagree with what
   the results path computes live.** One assessment checked in July 2026 held values dated months earlier that
   did not match its export. Whether anything reads those columns has not been established.
