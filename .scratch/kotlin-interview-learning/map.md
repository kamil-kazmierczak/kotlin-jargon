# Plan a Kotlin interview learning app for an experienced Java developer

Labels: wayfinder:map
Status: resolved

## Destination

A set of linked decisions ready to turn into a buildable specification for converting this fork into a Kotlin-only learning app for senior backend interviews, preserving the visual concept graph and supporting deep understanding through theory and code examples.

## Notes

### Agreed starting point

- The learner has six years of Java experience and approximately six months of Kotlin experience.
- The goal is deep understanding of each Kotlin concept, with theory and Kotlin code examples.
- There is no interview deadline.
- Initial subject scope: Kotlin language features, standard library, Java interoperability, and coroutines.
- Each concept should offer a short explanation, a Kotlin example, relevant Java comparisons, common mistakes, and an interview question with a revealable answer. Deeper explanations should support understanding beyond the summary.
- Keep the visual concept graph as the foundation, with connected concepts and searchable explanations.
- This fork is Kotlin-only. The user chose the upstream project for its visual presentation, not its functional-programming subject matter.

### Working conventions

- This effort plans the app; it does not implement it. Once the route is clear, hand off through `/to-spec`, then `/to-tickets` and `/implement`.
- Use `/wayfinder` and `/grilling` when working decision tickets. The referenced `/domain-modeling` skill was not found locally; make terminology explicit in the conversation and record agreed meanings in each ticket's resolution.
- Use the local Markdown tracker conventions in [Issue tracker: Local Markdown](../../.agents/skills/setup-matt-pocock-skills/issue-tracker-local.md). No configured tracker was found; `/setup-matt-pocock-skills` can configure one later.
- Child tickets live in `issues/`. Select the first open, unclaimed ticket whose blockers are all resolved; claim it before work. Resolve at most one non-research ticket per session.
- Ticket creation order is not an implementation sequence. Blocking lines record decision dependencies.
- Initial repository inspection found an existing static React/Vite graph, search, concept panels, related concepts, and share links. Content parsing and code highlighting are JavaScript-focused. There is no existing assessment or learning-progress system. These are observations, not architectural decisions.

## Decisions so far

<!-- Charting records the agreed starting point above. Resolved child decisions will be indexed here by title with links; their detail belongs in the tickets. -->

- [Define the Kotlin curriculum and evidence of understanding](issues/01-curriculum-and-depth.md): established the Kotlin/JVM curriculum sequence, three depth levels, reasoning-based evidence, prerequisites, coverage rules, and the first Java-developer foundation slice.
- [Define what Kotlin graph connections mean](issues/02-graph-meaning-and-navigation.md): separated concept categories, prerequisite and related edges, and the curated study path while preserving open graph exploration and navigation.
- [Fit deep Kotlin explanations into the visual app](issues/03-deep-concept-reading.md): established a compact graph-side overview, desktop focused lessons with layered depth, static code and revealable reasoning, contextual concept previews, and exact return to the graph.
- [Choose how Kotlin learning content is authored and verified](issues/04-content-authoring-and-verification.md): established structured per-concept Markdown, a global curriculum manifest, pinned and sourced version baselines, offline Kotlin/JVM example verification, human publication review, and reproducible generated artifacts.
- [Prototype the desktop concept-reading flow](issues/06-prototype-desktop-reading-flow.md): selected a docked graph overview, wide focused lesson with fixed outline, overlaid concept preview, and exact return to graph context.
- [Decide how learners practise and judge progress](issues/05-practice-and-progress.md): established structured self-assessment, staged group scenarios, explicit concept and group states, and browser-local portable progress without inferred completion or gamification.
- [Select the initial Kotlin teaching baseline](issues/07-select-kotlin-teaching-baseline.md): pinned the supported Kotlin/JVM, JDK, Gradle, and coroutines baseline and identified behavior that lessons must label as version-sensitive.

## Not yet specified

None. The linked decisions are ready to become a buildable specification.

## Out of scope

- Java as a separate curriculum, Kubernetes, Kafka, microservices, and databases. Java comparisons remain useful within Kotlin explanations.
- Framework-specific teaching in the initial scope, including Spring. Ktor is explicitly not of interest.
- Preserving the original functional-programming catalogue as a separate learning track.
- Implementing or publishing the app during this planning effort.
- Lesson-by-lesson factual research, full curriculum authoring, and decisions exposed only while producing individual lessons; those belong to specification execution rather than planning this app.
