# Contributing

Kotlin Concepts teaches Kotlin/JVM semantics and design decisions to experienced Java developers.

## Content

Edit `content/concepts/*.md` and `content/curriculum.json`. Follow the [publication contract](docs/publication-contract.md) and the [example verification modes](content/examples/verification-modes.md). Generated application data and exports must not be edited or committed.

Use plain language, explain the Java-developer relevance, and support claims with authoritative sources. Distinguish language guarantees, library contracts, compiler behavior, and JVM implementation observations. Accuracy and pedagogy are both required. Keep category, depth, prerequisites, related concepts, and study-path order separate.

Substantial lessons include worked examples, decision guidance, knowledge checks, and interview reasoning. Use the pinned Kotlin/JVM baseline. Every code block declares its verification mode; runnable and compiler-rejection examples are verified by the Gradle harness.

AI-authored content stops at `review-ready`. Only a human can approve publication using the review attestation workflow. Do not alter reviewed prose without renewing its approval.

## Application

Preserve the desktop graph, compact Concept Overview, centered Focused Lesson, independent reading column, outline, and connected-concept preview. Back to graph must restore the entry selection, camera, filters, and path. Keep curated navigation separate from prerequisite and related edges.

Assessments are explicit learner judgments. Scratch answers and reveal state are temporary. Group readiness is independent of individual concept assessments. Do not add automated grading or gamification.

Follow the existing JavaScript and React conventions. Add regression coverage for changed learner or author behavior. Run focused tests while developing and `npm run verify` before release. The pre-commit hook runs the content and state tests; it does not rewrite authored files.
