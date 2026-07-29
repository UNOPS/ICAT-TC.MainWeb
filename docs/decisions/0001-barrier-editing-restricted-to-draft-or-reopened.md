# 0001 - Barriers are editable only on draft or reopened assessments

- **Status:** accepted, agreed with the product owner and confirmed 2026-07-29
- **Applies to:** ICAT-TC.MainWeb (enforcement), ICAT-TC.MainService (persistence)
- **Implementation verified against code:** 2026-07-29

## Context

Intervention barriers are captured in step 1 of each assessment tool. They also flow through to the
generated assessment reports, so changing a barrier changes a report that may already have been issued.

A country team applying the toolkit originally could not edit or delete barriers at all - the rows were
display-only, with just an add button. Edit and delete were added in July 2026, which raised the question
of _when_ they should be available.

## Decision

Barriers may be added, edited, or deleted on assessments in **draft** status, and on **completed
assessments that a user has explicitly reopened** for editing. On a completed assessment that has not been
reopened, barriers are read-only.

## How it is enforced

All three tools render the barriers section from their own component:

- `src/app/Tool/investor-tool/`
- `src/app/Tool/carbon-market/carbon-market-assessment/`
- `src/app/Tool/portfolio-track4/`

Each gates the add button and the per-row edit/delete buttons on the same expression:

```html
[hidden]="isSavedAssessment || (isEditMode && !isCompleted && isContinue)"
```

The flags come from query params set by the two list screens:

- `src/app/assessment/assessment.component.ts` - completed assessments. `Edit` navigates with
  `isEdit=true, iscompleted=true`. **This is the reopen path.**
- `src/app/assessment-inprogress/assessment-inprogress.component.ts` - drafts. `Edit` navigates with
  `isEdit=isDraft`; `Continue` adds `isContinue=true`.

Resulting behaviour:

| Entry point                                  | Status   | Barrier add/edit/delete             |
| -------------------------------------------- | -------- | ----------------------------------- |
| New assessment, before the first step-1 save | –        | shown                               |
| New assessment, after the step-1 save        | draft    | hidden                              |
| Drafts list → **Edit**                       | draft    | **shown**                           |
| Drafts list → **Continue**                   | draft    | hidden (Continue skips past step 1) |
| Completed list → **Edit**                    | reopened | **shown**                           |

There is no literal "reopened" status in the schema. `Assessment.isDraft` is the only draft/completed
marker, and "reopened" means nothing more than having entered a tool through the completed list's `Edit`
action, which the components observe as `isEditMode && isCompleted`. Searching the codebase for "reopen"
returns nothing; use the flag combination instead.

## Persistence

Barrier edits live in the component's `finalBarrierList` and are written only when the user saves step 1.
That save posts the entire list to `POST /policybar`, which **deletes every barrier on the assessment and
reinserts the posted list** (`ICAT-TC.MainService/src/climate-action/climate-action.service.ts`,
`deleteBarriers` then re-insert). Supporting edit and delete therefore needed no backend change at all -
posting a modified list is enough.

Consequences:

- Leaving a tool without saving step 1 discards barrier edits. This is intended: it makes edits reversible.
- The gating above is **frontend-only**. `POST /policybar` performs no draft/completed check, so the rule is
  a UI guarantee rather than a server-enforced one. Any new client of that endpoint has to re-implement it.

## Open issue

`carbon-market-assessment.component.ts` wraps its `policyBar` post in `if (this.finalBarrierList.length > 0)`.
Deleting the _last_ remaining barrier therefore posts nothing, and the stale barrier survives in the database
and in the report. The investor and portfolio components post unconditionally and behave correctly. Fixing
this means dropping the length guard so an empty list is still sent.
