# 0004 - Result-matrix dots sit on the 0.5 grid, not centred in the box

- **Status:** accepted, implemented July 2026 at a country team's request
- **Applies to:** ICAT-TC.MainWeb
- **Implementation verified against code:** 2026-07-29

## Context

The transformational-change result matrix plots an assessment by its process score (one axis) and outcome
score (the other). Scores arrive already floored to half points ([0002](0002-scores-are-floored-to-half-points.md)),
but the matrix used to floor them again to whole numbers and draw the dot in the centre of the cell. A
process score of 2.5 was therefore indistinguishable from 2.0, which country teams read as the toolkit
losing half a point of their result.

## Decision

A half-point remainder shifts the dot onto the **gridline** between cells rather than to the centre of a
cell. The cell is still chosen by the whole-number floor; the remainder decides where in the cell the dot
sits. Because the axes render descending, a 0.5 remainder moves the dot half a cell toward the higher value -
upward or leftward.

This applies to single-assessment result views and to the dashboards.

## How it is enforced

The shared heat map is `src/app/charts/heat-map/heat-map.component.ts`, and the behaviour is **opt-in**
through `@Input() preciseDotPosition`, currently enabled in:

- `src/app/assessment-result-investor/assessment-result-investor.component.html`
- `src/app/Tool/carbon-market/cm-result/cm-result.component.html`
- `src/app/dashboard/all-too-dashbord/all-too-dashbord.component.html`
- `src/app/investment-dashboard/investment-dashboard.component.html`
- `src/app/portfolio-dashboard/portfolio-dashboard.component.html`
- `src/app/carbon-market-dashboard/carbon-market-dashboard.component.html`

Dashboards were the harder case, because a cell can hold many assessments and the existing convention is one
counted dot per cell. The insight that settled it: since each axis remainder is only ever 0 or 0.5, a cell has
exactly **four** possible half-step positions - centre, left gridline, top gridline, corner. So the component
groups a cell's scores by position and draws one counted dot per occupied position. Averaging the scores in a
cell was considered and rejected: it would place a dot where no actual assessment sits.

Implementation notes for anyone editing it:

- `getDotStyle` was replaced by `buildDots()` and `getDots(x, y)`, precomputed in `ngOnChanges`. Do not build
  the array inside the template - returning a fresh array per change-detection cycle thrashes `*ngFor`.
- The hover overlay filters to the hovered dot's sub-position, so hovering a corner dot must not report the
  centre dot's assessments.
- Dashboards feed the matrix `averageProcess` / `averageOutcome` in two places. That is safe because the
  component applies the half-point floor itself rather than trusting upstream flooring.

## Consequences

`floorToWholeForMatrix` and `scoresMatchMatrixCell`
(`ICAT-TC.MainService/src/shared/score-rounding.util.ts`) still exist and still select the cell. They are not
redundant with this decision - cell selection and within-cell placement are separate steps.

Known cosmetic quirk, pre-existing and deliberately left alone: a counted dot always renders the literal text
"1" no matter how many assessments it covers. The dot grows via `intervention-large`, but the number does not
change. Worth fixing separately.
