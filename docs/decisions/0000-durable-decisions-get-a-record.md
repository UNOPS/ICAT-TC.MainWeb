# 0000 - Durable decisions get a record here

- **Status:** accepted 2026-07-29
- **Applies to:** all ICAT toolkit repos, and to AI assistants working in them

## Context

The rules that govern this toolkit are mostly invisible in the code. Scores are floored rather than rounded,
not-relevant means excluded rather than zero, barriers are locked on completed assessments, question rows are
deduplicated on read because the table is known to be dirty. Each of these looks like an oddity or a bug to
anyone meeting it for the first time.

Until now that knowledge lived in chat threads, in the heads of whoever handled the last country-team report,
and in an assistant's private notes. The costs were real and repeated: the same investigation gets run twice,
a well-meaning cleanup reverts a deliberate rule, and a country team's question takes days to answer because
nobody remembers whether the behaviour was intended. A deliberate decision that is not written down is
indistinguishable from an accident.

## Decision

**When a decision is made that future readers could mistake for a bug, or could undo without realising, it
gets a record in this folder - as part of the change, not afterwards.**

Write a record when:

- a rule is agreed with the product owner or a country team, such as who may edit what and when;
- a calculation behaves in a way that will read as wrong to someone checking it by hand;
- a defensive measure is added because of a known data or upstream problem, and removing it would silently
  break results;
- an approach was chosen over an obvious alternative and the alternative will keep being suggested;
- an investigation concludes that behaviour is intended - a closed "not a bug" is worth as much as a fix.

Do not write one for ordinary implementation work: a routine bug fix, a refactor, a dependency bump, or
anything the code and its tests already explain clearly.

The bar is not importance. It is **surprise**: would a competent newcomer, or an assistant with no memory of
this conversation, reasonably try to change this?

## How

Copy the shape of an existing record. Number sequentially, and use a filename that states the rule rather
than the topic - `0002-scores-are-floored-to-half-points.md`, not `0002-scoring.md` - so the index can be
read without opening anything.

```markdown
# NNNN - <the rule, as a sentence>

- **Status:** accepted <date> (or: superseded by NNNN)
- **Applies to:** <repos>
- **Implementation verified against code:** <date>

## Context

What was true that forced a choice. Include the symptom that prompted it.

## Decision

The rule, stated plainly.

## How it is enforced

Files, functions, queries. Prefer names that can be grepped over line numbers, which drift.

## Consequences

What this costs, what it makes harder, and how it will be misread.

## Open issues

Anything knowingly left undone.
```

Then add a row to the index in `README.md`.

Records live in `ICAT-TC.MainWeb/docs/decisions/` even when the decision is a backend one, because these
rules span repos and separating them would hide the connections. Name the affected repos in the record and
write cross-repo paths repo-first.

## These records are public

This repository is open source, so write every record as though a stranger will read it, because one will.

- **No environment identifiers.** Cloud project ids, regions, service names, hostnames, bucket or database
  names, and origin values belong in the deployment environment or an internal runbook, not here. Write the
  rule and use placeholders for the values.
- **No credentials or secret names**, no connection strings, and nothing copied out of a live environment.
- **Name roles, not people or partners.** "A country team", "the product owner". A record explains a rule; it
  does not need to say who asked, and naming an organisation attributes a complaint to them in public.
- **No production data.** Aggregate counts are fine and often necessary; assessment ids, intervention titles,
  and anything traceable to one submission are not.

When an investigation genuinely depends on such a detail, record the shape of it — "one assessment held 80
rows for 30 real items" — and keep the identifier in the internal notes.

## Expectations for AI assistants

Assistants working in these repos should:

1. **Read the relevant record before changing scoring, barriers, the result matrix, or CORS configuration**,
   and treat what it says as intended behaviour rather than something to tidy up.
2. **Propose a record when the work produces a decision meeting the bar above** - including when the
   conclusion is that current behaviour is correct and should stay.
3. **Correct a record in place when it turns out to be wrong**, and say so in the response. A confidently
   stale record is worse than no record, because both people and assistants will act on it.
4. **Verify before writing.** A record asserts how the code behaves today; check it against the code rather
   than reproducing an earlier summary, and date the verification.

## Consequences

This adds a step to work that already feels finished, and some records will age badly. Both are accepted: the
alternative is re-deriving the same rules from scratch every few months, which is what prompted this folder.

Records are not a changelog and not a substitute for tests. Where a rule can be enforced in a test - as the
half-point floor and the not-relevant exclusion both are - write the test as well, and let the record explain
why the test exists.
