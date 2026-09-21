# Publication and generation contract

Canonical curriculum inputs live only in `content/curriculum.json` and `content/concepts/*.md`.
Files generated under `app/src/data` and `app/public` are build artifacts; never edit them as
independent sources.

## Publication states

Every concept records `publicationStatus` and the ordered `publicationHistory` that reached it.
The only valid progression is:

1. `draft`
2. `review-ready`
3. `verified`

Automation and AI-authored changes must stop at `review-ready`. A human reviewer may move a
concept to `verified` only after recording their trusted reviewer ID, date, confirming commit, and
all four review confirmations: pedagogical clarity, authoritative support, interview realism,
and accurate guarantee-versus-implementation wording. Production generation verifies that the
commit is an ancestor, was authored by the reviewer's registered Git email, and contains the exact
verified state, reviewer record, four confirmations, and authored content. Later AI edits therefore
invalidate the attestation until a human reviews and commits the new record. The later reference-only
commit completes this two-commit handshake without permitting self-attestation.

Production generation includes only `verified` concepts. Drafts and review-ready concepts can be
inspected with the explicitly separate `npm --prefix app run generate:preview` command, which
writes ignored output under `app/.preview`.

Empty unpublished study paths are omitted from production. A group scenario is included only
when all concepts on its path are published, so a partially reviewed group cannot expose its
unreviewed assessment. Review the manifest's scenario together with its lessons.

## Lesson profiles and path placement

Both profiles require Overview, Why it matters to Java developers, Semantics, Example,
Connections, and Sources. `profile: substantial` additionally requires Mental model, Common
mistakes, Decision guidance, Knowledge check, and the five interview sections: Interview
question, Essential points, Trade-offs, Common traps, and Follow-up probes. Java comparison is
optional when it adds no new information. These sections appear in the reader and generated
reference; example prose stays beside its code blocks.

A verified concept normally belongs to a study path. A `depth: reference` concept may stay
off every path with a nonempty `pathExclusionReason`. It remains available in graph, search,
lessons, and assessment. This keeps syntax reminders from becoming mandatory study steps.

The execution/core-semantics group for issue #19 contains nine path concepts plus the off-path
Basic Kotlin syntax reference. Kamil approved the curriculum authored in commit `99383c5`
on 2026-09-21, confirming pedagogy, source support, all interview rubrics, the staged cache-policy
scenario, and the distinction between language guarantees and JVM implementation observations.
Each concept records the corresponding publication attestation. In particular, the lessons
do not claim a guaranteed zero/null result from reading a property before initialization.

## Verification

Run the complete local release gate from the repository root:

```bash
npm run verify
```

It checks baseline metadata against the effective Gradle toolchain, human-review attestations,
structural content and provenance, all Kotlin/JVM teaching examples, byte-stable generation, the
production application build, state tests, and desktop smoke tests.
The deployment workflow runs this same command.

Changing the Kotlin/JVM teaching baseline requires updating both `content/curriculum.json` and
`examples/gradle/verification-baseline.properties`, including the previous baseline ID, adoption
date, rationale, and official release source. Verification rejects partial baseline changes.
