# Choose how Kotlin learning content is authored and verified

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Assignee: Codex
Parent: [Plan a Kotlin interview learning app for an experienced Java developer](../map.md)
Blocked by: 01, 03

## Question

How should lessons, examples, interview answers, and graph relationships be stored, sourced, checked, and maintained so the selected curriculum stays accurate and practical to expand?

Decide the authoring workflow, source and version expectations, and proportionate verification for code examples and explanations. Account for the existing Markdown-to-graph pipeline and its JavaScript assumptions. Identify factual questions requiring separate research before settling choices; do not assume a Kotlin version, install dependencies, or implement a new content pipeline in this ticket.

## Answer

Kotlin learning content will use a structured, repository-authored model rather than extending the original monolithic functional-programming Markdown conventions. The reusable boundary in the existing application is the generated content data consumed by the graph and reading UI; the JavaScript-specific parser and its implicit schema should be replaced.

### Canonical content model

Each independently teachable graph concept has one Markdown source file with a permanent authored ID. Renaming its title must not change its identity, URL, or relationship keys. Structured front matter holds machine-readable metadata, while named Markdown sections hold explanations and examples.

There are two validated lesson profiles:

- A **substantial lesson** contains an overview, why the concept matters, mental model, semantics, worked example, Java comparison where relevant, common mistakes, decision guidance, knowledge check, focused interview question with model reasoning, and sources.
- A **compact concept** contains an overview, semantics, an example where applicable, connections, and sources.

Deep dives are explicitly marked subsections. Validation should enforce the selected profile without requiring empty or artificial sections when, for example, a Java comparison does not add value.

A separate curriculum manifest owns global category definitions and the curated study-path sequence. Each concept file owns its category, curriculum depth, prerequisite IDs, and related-concept IDs. A prerequisite is declared by the dependent concept. Related edges may be authored from either endpoint and are normalized as undirected relationships.

Content validation rejects duplicate or unknown IDs, nonexistent categories, dangling relationships, prerequisite cycles, missing study-path concepts, broken internal links, and invalid lesson structures. It must preserve the distinction between directed prerequisites, undirected related concepts, categories, curriculum depth, and curated teaching order.

### Versions and provenance

The curriculum targets an explicit teaching baseline rather than silently following the newest toolchain. One machine-readable baseline records the Kotlin compiler and language version, JDK, JVM target, and `kotlinx.coroutines` version. Concept-level exceptions are allowed only for clearly identified version-sensitive material.

The exact initial baseline requires current research from official compatibility information and is deferred to [Select the initial Kotlin teaching baseline](07-select-kotlin-teaching-baseline.md); this decision does not assume version numbers.

Kotlin specifications, official Kotlin documentation, official library API documentation, and relevant JDK documentation are the primary correctness sources. Each concept records its sources, baseline, and last verification. User-facing further reading remains concise, while subtle or version-sensitive claims receive a nearby reference. Third-party material may inform pedagogy but does not establish correctness.

Baseline upgrades are deliberate maintenance changes. They run every verification fixture, identify lessons affected by behavior or diagnostic changes, update provenance and verification dates only after review, and record curriculum-visible changes. Dependency resolution must never advance the teaching baseline implicitly.

### Example verification

The browser displays static examples; compilation and execution happen only in the authoring pipeline. Fenced code blocks or named example groups carry verification metadata:

- `compile` marks a self-contained successful example;
- `run` adds a deterministic expected-output assertion;
- a shared example ID groups mixed Java and Kotlin source files;
- `compile-fails` checks an intended failure using a stable diagnostic category rather than a brittle complete compiler message;
- `fragment` and `pseudocode` explicitly exclude intentionally incomplete material from compilation.

A build-time extractor turns these blocks into temporary fixtures verified by a small Gradle-based Kotlin/JVM harness against the pinned baseline. Every complete positive example compiles, runtime claims are asserted where deterministic, mixed-language boundaries compile together, and claimed compiler failures are exercised. Prose, interview reasoning, and relationship quality still require review because compilation cannot establish their accuracy or teaching value.

### Authoring and publication workflow

Content moves through `draft`, `review-ready`, and `verified` states. AI may assist with drafting and revision, but publication requires a human to confirm pedagogical clarity, authoritative support, interview realism, and whether statements describe a Kotlin guarantee or an implementation detail. Only verified concepts enter the production curriculum; drafts may be made available in a separate preview.

One local and CI verification entry point blocks merging or deployment on schema failures, graph-integrity errors, broken links or required provenance, failed Kotlin/Java fixtures, nondeterministic generation, application build failures, and focused UI smoke-test failures covering graph search, stable concept URLs, lesson rendering, and code-language handling. Style findings and stale-review notices may begin as warnings; correctness and structural-integrity findings block.

Concept Markdown and the curriculum manifest are the only committed content sources. Generated JSON, graph data, search indexes, and LLM exports are reproducible build artifacts rather than committed duplicates. CI still checks generation determinism.

The new pipeline deliberately replaces the original parser instead of supporting two authoring formats. Existing graph, search, sharing, Markdown rendering, static export, and data-consumption behavior may be retained behind an evolved generated schema. The first migration slice should be a small representative Kotlin foundation centered on `Platform types`, exercising structured lesson content, Kotlin/Java fixtures, typed graph edges, provenance, generation, and rendering before content is authored in bulk.
