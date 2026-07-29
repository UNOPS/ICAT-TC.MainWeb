# 0002 - Scores are floored down to the nearest 0.5, never rounded

- **Status:** accepted, reaffirmed 2026-07-27 when a country team questioned the resulting numbers
- **Applies to:** ICAT-TC.MainService (calculation), ICAT-TC.MainWeb (display)
- **Implementation verified against code:** 2026-07-29

## Context

Every tool - investor, portfolio, carbon market - produces process and outcome scores as weighted averages,
which are rarely whole numbers. The toolkit presents scores on a half-point scale, so a raw average has to
be mapped onto that scale before display, and the transformational-change matrix places its dot from the
same value.

## Decision

Raw scores are **floored** to the nearest half point: 1.667 → 1.5, 2.9 → 2.5, 2.5 → 2.5. They are not
rounded to nearest, and not floored to whole numbers.

Flooring is deliberate - a score is only claimed once it has actually been reached - and it applies
system-wide so that the same assessment reads the same in every tool, chart, and report.

## How it is enforced

`ICAT-TC.MainService/src/shared/score-rounding.util.ts`:

- `floorToHalf(value)` - `Math.floor(value * 2) / 2`
- `floorToHalfOrNull(value)` - same, passing `null`/`undefined` straight through, so a not-relevant score
  stays not-relevant (see [0003](0003-not-relevant-is-excluded-not-zero.md))
- `floorToWholeForMatrix(value)` and `scoresMatchMatrixCell(...)` - a _separate_ whole-number mapping used
  only to pick the matrix cell; see [0004](0004-matrix-dots-use-half-point-placement.md) for how the dot is
  then positioned within that cell

Covered by `src/shared/score-rounding.util.spec.ts` (`npx jest src/shared`). Change the tests deliberately,
not to make a new expectation pass.

## Consequences

Country teams periodically report that a score reads "too low" by roughly 0.1–0.3 against a value they
computed by hand. In most cases this is the floor working as designed, not a defect. Before investigating,
compute the raw average and check whether flooring explains the whole gap:

- if it does, the answer is this decision;
- if the gap is larger - a category reading 0.5 where 1.7 was expected - look for a real calculation
  problem, such as [0005](0005-cm-question-rows-are-deduplicated-at-read-time.md).

A concrete example from a Carbon Market investigation (July 2026): after the duplicate-row fix, SD
Scale computed to a raw 1.667 and displays as 1.5, and the overall Outcome of Change computed to a raw 2.192
and displays as 2.0. The team expected 1.7 and 2.2. Those residual gaps are entirely this decision, and the
product owner chose to leave the rounding as it is.

Anyone proposing to switch to round-half-up should expect it to move published scores across the whole
system, including previously issued reports and every matrix dot.
