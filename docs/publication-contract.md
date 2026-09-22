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

The type-system/null-safety group for issue #20 expands the existing
`java-developer-foundations` path in place so saved group progress and the permanent
`platform-types` identity survive the curriculum expansion. Kamil approved the curriculum in
commit `673e2d3` on 2026-09-21, confirming the smart-cast, `Any`, `Unit`, and `Nothing` lessons,
their sources and interview rubrics, the uncertain-Java-boundary scenario, and its Kotlin 2.4
version wording. The previously verified nullable, platform-type, and not-null-assertion lessons
retain their earlier human attestations.

The domain-modeling group for issue #21 uses six semantic decision nodes rather than one node per
syntax form: closed domain models compare sealed hierarchies with enums, and objects are taught
with companions and their JVM API shape. Data classes, value classes, delegation, and immutability
complete the path. Kamil approved the curriculum authored in commit `bac7636` on 2026-09-21,
confirming its pedagogy, authoritative sources, interview realism, staged order-model scenario,
and guarantee-versus-generated-implementation wording.

The collections/sequences group for issue #22 uses four semantic decision nodes: collection
interfaces and ownership, materialized transformations, grouping and aggregation, and lazy
sequence evaluation. It deliberately distinguishes read-only capabilities from deep immutability
and sequence laziness from automatic performance improvement. Kamil approved the curriculum
authored in commit `c7dd3dd` on 2026-09-22, confirming its pedagogy, authoritative sources,
interview realism, bounded-report scenario, and performance wording.

The functions/idioms group for issue #23 uses four semantic decision nodes: lambdas and
higher-order contracts, extensions and receiver resolution, scope-function receiver/result
choices, and inline control flow with reified access. It distinguishes source semantics,
compiler-emitted bytecode, runtime performance, and API constraints. Kamil approved the
curriculum authored through commit `a406f11` on 2026-09-22, confirming its pedagogy,
authoritative sources, interview realism, readable-API scenario, and
guarantee-versus-implementation wording.

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
