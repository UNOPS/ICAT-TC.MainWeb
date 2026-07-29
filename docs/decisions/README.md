# Decision records

Durable decisions about how the ICAT Transformational Change toolkit behaves - the rules that are easy to
mistake for bugs, easy to "fix" by accident, and expensive to rediscover.

Each record states a rule, why it exists, where it is enforced in code, and what it costs us. They are
written for both humans and AI coding assistants: an assistant asked to change scoring, barriers, or the
result matrix should read the relevant record **before** editing, and treat the rule as intended behaviour
rather than something to clean up.

## Index

| #                                                               | Decision                                                                | Applies to           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------- |
| [0000](0000-durable-decisions-get-a-record.md)                  | Durable decisions get a record here - when to write one, and how        | all repos            |
| [0001](0001-barrier-editing-restricted-to-draft-or-reopened.md) | Barriers are editable only on draft or reopened assessments             | MainWeb              |
| [0002](0002-scores-are-floored-to-half-points.md)               | Scores are floored down to the nearest 0.5, never rounded               | MainService, MainWeb |
| [0003](0003-not-relevant-is-excluded-not-zero.md)               | "Not relevant" is excluded from averages, never counted as 0            | MainService          |
| [0004](0004-matrix-dots-use-half-point-placement.md)            | Result-matrix dots sit on the 0.5 grid, not centred in the box          | MainWeb              |
| [0005](0005-cm-question-rows-are-deduplicated-at-read-time.md)  | Carbon Market question rows are deduplicated when scores are calculated | MainService          |
| [0006](0006-cors-origins-are-environment-config.md)             | Allowed CORS origins are per-environment config, not repo content       | MainService, ops     |
| [0007](0007-cm-row-identity-depends-on-question-type.md)        | Carbon Market row identity depends on the question type                 | MainService, ops     |

## Repository layout (context for the records)

The toolkit is not one repository. `icat-github/` is a container folder holding several independent git
repos, each with its own branch state - run git with `-C <subdir>`, and re-check the branch before
committing, since different subfolders can sit on different branches at once.

The records above concern two of them:

- **ICAT-TC.MainService** - NestJS/TypeScript backend. Scoring lives in
  `src/carbon-market/service/cm-assessment-question.service.ts` and `src/investor-tool/`; shared scoring
  helpers are in `src/shared/*.util.ts` with `.spec.ts` tests (`npx jest src/shared`).
- **ICAT-TC.MainWeb** - Angular frontend, this repo. Type-check with
  `npx tsc --noEmit -p tsconfig.app.json`.

This folder lives in MainWeb but deliberately covers backend decisions too, because the rules span both
repos and splitting them would hide the connection. Every record names the repos it applies to; paths
outside this repo are written repo-first (`ICAT-TC.MainService/src/...`).

## Writing a new record

See [0000](0000-durable-decisions-get-a-record.md). It sets out when a decision earns a record, when it does
not, the template to copy, and what is expected of AI assistants working in these repos.
