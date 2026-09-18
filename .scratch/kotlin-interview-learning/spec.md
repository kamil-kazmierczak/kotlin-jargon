# Build a Kotlin interview learning app for experienced Java developers

Status: ready-for-agent

Source: [Resolved Wayfinder map](map.md)

## Problem Statement

An experienced Java backend developer with some Kotlin experience needs a deliberate way to reach senior-interview depth in Kotlin/JVM. The current fork is a visually strong but JavaScript-focused functional-programming glossary: its graph does not express Kotlin learning dependencies, its short concept drawer cannot carry deep lessons, its examples are not verified as Kotlin/JVM programs, and it has no practice or learning-progress model.

The learner needs more than definitions. They must be able to explain Kotlin semantics, predict behavior, compare Kotlin with Java, diagnose mistakes, choose between alternatives, and reason through multi-concept backend scenarios. They should be able to explore freely without losing the structure of a curated curriculum, and they should own their progress without accounts, automatic grading, or gamification.

## Solution

Convert the fork into a desktop-only, Kotlin/JVM learning application while preserving the visual concept graph as its orientation surface. The app will combine free graph exploration with a curated study path covering Kotlin language features, the standard library, Java interoperability, coroutines, and asynchronous/concurrent streams. Graph nodes will distinguish prerequisites from related concepts and from teaching order.

Selecting a concept will open a compact Concept Overview in a docked inspector. The learner can then enter a wide Focused Lesson with layered explanations, verified static Kotlin examples, selective Java comparisons, mistakes, decision guidance, a knowledge check, and a revealable interview-reasoning rubric. Related and prerequisite concepts open as contextual previews without destroying the current reading position, and returning to the graph restores the exact prior graph state.

Practice will use explicit learner self-assessment. Concept assessments and group-scenario readiness will persist locally, appear subtly on the graph, and support validated JSON export/import and complete reset. There will be no account, server-side progress, automated grading, certification claim, or gamification.

Content will be authored as structured, sourced Markdown and transformed into deterministic application data. A pinned Kotlin/JVM toolchain will compile or run eligible examples offline during verification. One local and CI verification command will cover content integrity, example fixtures, deterministic generation, the production build, and desktop browser behavior.

## User Stories

1. As an experienced Java backend developer, I want the curriculum to assume my Java and JVM knowledge, so that I can focus on Kotlin rather than repeat foundational Java material.
2. As a learner with some Kotlin experience, I want concise foundation concepts to remain searchable, so that I can fill gaps without being forced through elementary syntax.
3. As a senior-interview candidate, I want a curated Kotlin/JVM study path, so that I can develop knowledge in a coherent order.
4. As an exploratory learner, I want to browse any concept without unlocking prerequisites, so that curiosity is never blocked.
5. As a learner, I want an early concept to show what is best understood first, so that I know which gaps may make the lesson harder.
6. As a learner, I want the main path to cover core semantics, null safety, domain modeling, collections, functions, generics, Java interoperability, coroutines, streams, concurrency, and advanced version-sensitive topics, so that it reflects senior backend interview scope.
7. As a learner, I want Java comparisons where they clarify a Kotlin semantic difference or JVM boundary, so that I can reuse my existing mental models safely.
8. As a learner, I want Java omitted when it adds no teaching value, so that lessons stay focused on Kotlin.
9. As a learner, I want every graph node to represent an independently teachable concept or meaningful design choice, so that the graph remains useful rather than encyclopedic.
10. As a learner, I want each concept to have one primary subject category, so that the graph has stable spatial organization.
11. As a learner, I want secondary concerns represented without duplicating concepts, so that cross-cutting topics remain navigable.
12. As a learner, I want core, deep-dive, and reference depth levels, so that uncommon detail does not overwhelm the main path.
13. As a learner, I want core concepts visible by default and deeper material discoverable through search and filters, so that the initial graph is readable.
14. As a learner, I want prerequisite edges to be directed and visually distinct, so that required knowledge is unambiguous.
15. As a learner, I want related-concept edges to be undirected and visually quieter, so that association is not mistaken for dependency.
16. As a learner, I want the curated study path shown as a separate optional overlay, so that teaching order is not confused with graph relationships.
17. As a learner, I want immediate relationships labeled in plain language when I select a node, so that I understand why concepts are connected.
18. As a learner, I want to pan, zoom, select, and search the visual graph, so that the graph remains the primary exploration surface.
19. As a learner, I want search to include concepts hidden by depth or other graph filters, so that every lesson remains discoverable.
20. As a learner, I want selecting a hidden search result to reveal it and its neighborhood temporarily, so that I can understand it in context.
21. As a learner, I want a simple way back to my previous filtered graph view, so that search does not destroy my exploration state.
22. As a learner, I want stable shareable concept URLs, so that I can bookmark or send a particular concept.
23. As a learner following a shared concept URL, I want the relevant concept context to open directly, so that the link has a predictable result.
24. As a desktop learner, I want selecting a node to open a compact right-hand Concept Overview over the graph, so that I remain oriented spatially.
25. As a learner, I want the Concept Overview to show a summary, Java-developer relevance, prerequisites, depth, and one clear study action, so that it supports a quick decision without duplicating the lesson.
26. As a learner, I want the interview question to stay out of the Concept Overview, so that the overview remains concise.
27. As a learner ready for depth, I want the study action to open a wide Focused Lesson while the graph recedes visibly, so that I can read comfortably without losing where I came from.
28. As a learner, I want a fixed lesson rail containing Back to graph and a compact section outline, so that long lessons remain navigable.
29. As a learner, I want the outline to indicate my current section and support direct section navigation, so that I can move through a lesson efficiently.
30. As a learner, I want the reading column to scroll independently at a comfortable bounded width, so that substantial explanations remain legible.
31. As a learner, I want substantial lessons to progress through mental model, semantics, examples, Java comparison where relevant, mistakes, design guidance, knowledge check, and interview reasoning, so that I build more than recall.
32. As a learner, I want compact concepts to omit sections that would be empty or artificial, so that consistent structure does not create filler.
33. As a learner, I want essential semantics and reasoning visible in the lesson spine, so that critical material is not hidden behind disclosure controls.
34. As a learner, I want JVM internals, uncommon edge cases, and version-sensitive details in named Deep Dives, so that I can opt into extra depth without interrupting the main argument.
35. As a learner, I want syntax-highlighted, read-only Kotlin and selective Java code with a copy action, so that I can study and reuse examples without expecting an in-browser runtime.
36. As a learner, I want expected output or compiler behavior explained beside relevant examples, so that static code still communicates its observable result.
37. As a learner, I want prerequisite and related links inside lessons to open a lightweight Concept Preview, so that I can inspect context without abandoning the current lesson.
38. As a learner, I want a Concept Preview to explain the linked concept and its relationship to my current lesson, so that the detour has a clear purpose.
39. As a learner, I want a deliberate choice between returning and studying the previewed concept, so that navigation never replaces my lesson unexpectedly.
40. As a learner who chooses the previewed concept, I want a short in-session trail to the origin, so that I can recover my reading context.
41. As a learner, I want previous and next lesson actions to follow the curated study path, so that lesson navigation has narrative coherence.
42. As a learner returning from a lesson, I want the selected node, camera position, filters, and study-path overlay restored exactly, so that focused reading does not erase my graph context.
43. As a learner, I want each substantial concept to pose a focused senior-interview question, so that I practise explaining rather than merely reading.
44. As a learner, I want optional scratch space before revealing reasoning, so that I can formulate an answer first.
45. As a learner, I want scratch answers to remain ephemeral, so that exploratory notes are not mistaken for lasting progress evidence.
46. As a learner, I want answers hidden on every new visit and revealed only by an explicit action, so that I am encouraged to reason first.
47. As a learner, I want the revealed material to show essential points, trade-offs, common traps, and likely follow-up probes, so that I learn a reasoning process rather than memorize a sentence.
48. As a learner, I want revealing an answer to leave progress unchanged, so that viewing content is not confused with understanding it.
49. As a learner, I want to assess a concept as Needs review, Can explain, or Interview-ready, so that progress reflects my own judgment.
50. As a learner, I want an unassessed concept to remain explicitly Not assessed, so that absence of evidence is not presented as success.
51. As a learner, I want to revise an assessment upward or downward and retain its latest date, so that progress can reflect changing understanding.
52. As a learner, I want each curriculum group to end with a staged scenario, so that I can combine several concepts in one backend-oriented problem.
53. As a learner, I want each scenario stage to ask for a prediction, diagnosis, or design choice before revealing brief feedback, so that later constraints build on active reasoning.
54. As a learner, I want a final scenario debrief and group-level rubric, so that I can connect decisions and trade-offs across the group.
55. As a learner, I want group readiness to be Not attempted, Needs review, or Scenario-ready independently of concept states, so that combined reasoning is not reduced to an average.
56. As a learner, I want concept and group assessments to persist in my browser without an account, so that the app remembers my work privately across visits.
57. As a learner, I want progress markers on graph concepts and compact summaries for curriculum groups, so that I can see where to focus next.
58. As a learner, I want to filter concepts by assessment state without hiding prerequisites or changing edge meanings, so that review planning does not distort the knowledge model.
59. As a learner, I want to export my progress as versioned JSON, so that I can back it up or move it manually.
60. As a learner, I want imported progress validated before it replaces local state, so that corrupt or incompatible data cannot silently damage my progress.
61. As a learner, I want to reset all progress deliberately, so that I can start again or clear a shared browser.
62. As a learner, I want progress represented without percentages, streaks, points, confetti, or certification claims, so that the app rewards honest understanding rather than traversal.
63. As a content author, I want each graph concept authored in one structured Markdown source with a permanent ID, so that titles can change without breaking identity, URLs, or relationships.
64. As a content author, I want substantial and compact lesson profiles with validated required sections, so that content stays consistent without manufactured filler.
65. As a content author, I want a curriculum manifest to own categories and curated study order, so that global structure has one source of truth.
66. As a content author, I want each concept to declare its category, depth, prerequisites, related concepts, publication state, sources, baseline, and verification date, so that local content remains explicit and auditable.
67. As a content author, I want related relationships normalized and prerequisite relationships cycle-checked, so that authoring direction does not alter graph semantics.
68. As a content author, I want complete examples marked for compilation, execution, intended failure, or intentional exclusion, so that every code block has a clear verification contract.
69. As a content author, I want mixed Java/Kotlin examples grouped as one fixture, so that interoperability claims are tested at the actual language boundary.
70. As a content author, I want intended compiler failures asserted by stable diagnostic category rather than full message text, so that useful tests survive wording changes.
71. As a reviewer, I want content to move through draft, review-ready, and verified states, so that incomplete material cannot enter the production curriculum accidentally.
72. As a reviewer, I want publication to require human review of pedagogy, authoritative support, interview realism, and guarantee-versus-implementation claims, so that compilation alone is not treated as correctness.
73. As a maintainer, I want only verified concepts in the production curriculum, so that learner-facing content has met its review contract.
74. As a maintainer, I want generated graph data, search indexes, and exports to be reproducible rather than parallel authored sources, so that content cannot drift between representations.
75. As a maintainer, I want invalid IDs, categories, links, relationships, profiles, provenance, and study-path references to fail verification, so that structural errors do not ship.
76. As a maintainer, I want Kotlin/JVM examples checked against one pinned baseline, so that behavior does not change silently with local dependency resolution.
77. As a maintainer, I want baseline upgrades to rerun all fixtures and identify affected lessons, so that language and toolchain changes are deliberate curriculum changes.
78. As a maintainer, I want one local and CI verification entry point, so that contributors and automation enforce the same release contract.
79. As a maintainer, I want the first migration slice centered on Platform types and its small Java-developer foundation neighborhood, so that the full content and interaction model is proven before bulk authoring.
80. As a learner, I want the finished product to be Kotlin-only rather than a parallel functional-programming catalogue, so that every visible concept supports the stated learning goal.

## Implementation Decisions

- The existing static React/Vite application remains the delivery shell, but its product identity and visible content become Kotlin-only.
- The application is desktop-only. Existing mobile-specific layout behavior and acceptance tests are removed; no replacement mobile lesson experience is required.
- The graph remains the default entry and the primary orientation surface. Existing pan, zoom, search, direct concept navigation, sharing, Markdown rendering, and static deployment behavior may be retained behind the new content model.
- A concept is an independently teachable semantic unit or meaningful design choice. Convenience syntax and small library helpers stay within larger concepts unless they independently justify a node.
- Every concept has one primary category, one curriculum-depth level, stable identity, optional tags, and authored relationship metadata. Categories control spatial grouping, not difficulty or order.
- The relationship model has two edge types: directed prerequisites and undirected related concepts. The curated study path is a third, independent structure owned by the curriculum manifest.
- Concepts are never locked. Missing prerequisites produce an advisory notice with navigation options.
- Search spans all curriculum-depth levels regardless of current graph filters. Selecting a hidden result temporarily reveals its local neighborhood and preserves a route back.
- Stable authored IDs are used for URLs and relationship keys. Renaming a title does not change identity or break links.
- The selected desktop composition is the prototype's docked-inspector variant: a right-side Concept Overview over the graph, a wide centered Focused Lesson with a fixed left rail, and a narrower right-side Concept Preview layered above the lesson.
- Opening a Focused Lesson snapshots graph context. Back to graph restores the selected node, camera position, filters, and study-path overlay exactly.
- Concept Preview navigation is explicit. Previewing does not replace the current lesson; choosing to study the previewed concept does, while retaining a short session-local return trail.
- Previous and next lesson navigation follows the curated study path. It does not infer sequence from prerequisite edges.
- Substantial and compact lesson profiles share a structured schema but have different required sections. Deep Dives are explicit optional subsections for internals, rare edge cases, and version-sensitive material.
- Code remains static in the browser. Kotlin and selective Java blocks support correct highlighting, line display where useful, and copying; compilation and execution happen only during authoring verification.
- Practice uses authored reasoning rubrics and learner-owned self-assessment. There is no automated evaluation of free-form answers.
- Interview scratch text and answer-reveal state are session-only. Neither changes progress.
- Concept progress stores only the latest state and assessment date. Group-scenario state is independent rather than computed from concepts.
- Progress is browser-local and versioned. Export, validated import, and reset are supported; accounts, servers, synchronization, and assessment history are not introduced.
- The graph may display subtle assessment markers and state filters, but progress never changes relationship semantics or hides required context.
- Each concept is authored in a separate structured Markdown document with a permanent ID. Front matter carries machine-readable metadata; named sections carry lesson prose and examples.
- A separate curriculum manifest owns global categories and the curated study sequence. Each dependent concept declares its prerequisite IDs; related IDs may be authored from either endpoint and are normalized.
- The content pipeline replaces the JavaScript-focused monolithic parser rather than supporting two canonical authoring formats. Concept Markdown and the curriculum manifest are the only committed content sources.
- Generated application data, graph data, search indexes, and LLM-oriented exports are reproducible artifacts and are not committed as duplicate sources. Verification checks determinism.
- Content validation rejects duplicate and unknown IDs, nonexistent categories, dangling relationships, prerequisite cycles, missing study-path concepts, broken internal links, missing provenance, and invalid lesson profiles.
- Complete code examples carry an explicit verification mode: compile, run with deterministic expected output, compile-fails by stable diagnostic category, fragment, or pseudocode. Shared fixture IDs join Kotlin and Java sources for interoperability cases.
- Content publication states are draft, review-ready, and verified. Only verified concepts enter the production curriculum, and publication requires human review beyond automated checks.
- The pinned initial baseline is Kotlin compiler and Kotlin Gradle plugin 2.4.20, language/API 2.4, Eclipse Temurin 21.0.12.1+1, JVM target 21, Gradle Wrapper 9.7.0, and matching kotlinx.coroutines modules 1.11.0.
- The harness explicitly configures the Java/Kotlin toolchain, language and API versions, and JVM target. It locks the Gradle distribution checksum and an immutable JDK artifact or image identity.
- Progressive mode, preview language versions, unstable compiler flags, and experimental APIs are not enabled globally. Lessons that discuss them declare local opt-ins and version caveats.
- Kotlin 2.4 and coroutines 1.11 behavior that differs from older releases is labeled in affected lessons, especially K2-only compilation, Java nullability and sealed-class interoperability, annotation target behavior, and deprecated coroutine idioms.
- Baseline upgrades are intentional maintenance changes that rerun all fixtures and review diagnostics, interoperability, annotations, reflection output, coroutine deprecations, and runtime expectations before metadata changes.
- The delivery sequence starts with a representative Java-developer foundation centered on Platform types. It exercises structured lessons, mixed Java/Kotlin fixtures, typed graph edges, provenance, generation, desktop reading, practice, and persistence before broader curriculum authoring.
- The intended curriculum sequence and depth rules are those recorded in the resolved Wayfinder decisions; implementation tickets may divide content authoring into coherent curriculum groups without redefining those rules.

## Testing Decisions

- One top-level local and CI verification command is the release contract. It orchestrates content validation, Kotlin/JVM fixture verification, deterministic generation, the production application build, and desktop browser acceptance tests.
- Tests assert externally visible behavior and stable contracts rather than component structure, hook usage, CSS implementation, parser internals, or exact generated formatting.
- The first test seam is the content/build verification boundary. Fixture corpora exercise valid substantial and compact lessons plus failures for duplicate or unknown IDs, invalid categories, dangling edges, prerequisite cycles, missing study-path entries, broken links, missing provenance, invalid publication state, and malformed profiles.
- The content/build seam verifies every example mode: successful compilation, deterministic output, mixed Java/Kotlin compilation, expected compiler-failure category, and explicit exclusion of fragments and pseudocode.
- Deterministic-generation tests run the same inputs repeatedly and compare outputs. Generated data must preserve stable IDs and the distinct semantics of category, depth, prerequisite, related, and study-path fields.
- Toolchain verification runs against the exact pinned compiler, language/API, JDK, JVM target, Gradle, and coroutine versions. Tests must fail rather than silently substitute incompatible versions.
- The second test seam is Playwright against the production-built static app at a desktop viewport. This extends the existing end-to-end precedent used for hash navigation, search, and panel behavior.
- Desktop acceptance tests cover clean root loading, direct stable concept URLs, graph selection, search across filtered concepts, temporary neighborhood reveal, sharing, and restoration of prior search/filter context.
- Reading-flow acceptance tests cover Concept Overview contents, entry into Focused Lesson, independent lesson scrolling, outline navigation and current-section state, Concept Preview, explicit preview exits, path-based previous/next navigation, and exact restoration of graph selection, camera, filters, and overlay.
- Lesson-rendering tests cover substantial and compact profiles, visible core reasoning, expandable Deep Dives, Kotlin and Java highlighting, copying, expected-output content, and absence of browser-side compilation controls.
- Practice tests cover optional scratch text, explicit reasoning reveal, hidden state on a new visit, no progress mutation from reveal or reading, concept reassessment, assessment dates, staged group feedback, and independent group readiness.
- Persistence tests cover browser reload, versioned export, valid import replacement, rejection of invalid or incompatible imports without data loss, reset confirmation, and visible graph/group progress summaries.
- Accessibility-oriented browser assertions use roles, names, focus behavior, and keyboard interactions where possible, giving the acceptance suite stable learner-visible selectors.
- The obsolete mobile bottom-sheet acceptance test is removed. No mobile viewport behavior is required by this specification.
- The representative Platform types slice is the first end-to-end acceptance fixture because it exercises nullability, a Java boundary, unsafe and corrected Kotlin, typed relationships, a Deep Dive, interview reasoning, and progress.
- Longer coroutine content receives a later rendering sanity check to ensure the reading structure works at greater lesson length without changing the approved interaction model.

## Out of Scope

- Java as a separate curriculum or a complete parallel set of Java lessons.
- Android, Kotlin Multiplatform, Ktor, Spring, or any other framework-specific curriculum in the initial scope.
- Kubernetes, Kafka, microservices, databases, and general backend-system design except where a compact scenario provides context for Kotlin reasoning.
- Retaining the original functional-programming catalogue as a second track.
- Mobile and responsive lesson experiences.
- Executing or compiling Kotlin in the browser.
- Accounts, authentication, a backend, cloud storage, cross-device synchronization, or collaborative progress.
- Automated grading of prose answers, certification, scores, completion percentages, streaks, points, badges, and celebratory gamification.
- Persisting interview scratch answers, reveal state, detailed rubric checklists, or assessment history.
- Treating generated application data, graph indexes, or exports as independently authored canonical content.
- Globally enabling experimental Kotlin language behavior or silently moving the teaching baseline to newer component versions.

## Further Notes

- The target learner has approximately six years of Java experience and six months of Kotlin experience, with no interview deadline and a preference for deep understanding.
- English is the curriculum language.
- The full decision trail remains in the [Wayfinder map](map.md). Detailed interaction evidence is in the [desktop concept-reading prototype](assets/06-desktop-reading-prototype.md), and baseline evidence is in the [primary-source toolchain research](assets/07-kotlin-teaching-baseline-research.md).
- The prototype is a behavioral and compositional reference, not production code or a production styling specification.
- Lesson-by-lesson source research and human publication review occur during specification execution. The resolved decisions establish their required provenance and review process but do not pre-author the curriculum.
