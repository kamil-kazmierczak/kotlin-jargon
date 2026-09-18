# Define what Kotlin graph connections mean

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Assignee: Codex
Parent: [Plan a Kotlin interview learning app for an experienced Java developer](../map.md)
Blocked by: 01

## Question

For the selected curriculum, what should a graph node and a connection mean, and how should a learner distinguish concepts to study first from concepts that are simply related?

Decide whether the experience needs an explicit study order alongside free exploration, how categories and connections help the learner navigate, and what graph behaviour should be retained from the existing app. Use representative concepts to make these choices concrete; do not implement the graph or enumerate every connection.

## Answer

The graph remains the app's primary organizing experience, but it serves two distinct modes: free concept exploration and a curated learning path. It must not imply that spatial proximity, category membership, prerequisites, and teaching order all mean the same thing.

### Nodes and categories

A node represents one independently teachable Kotlin concept with distinct semantics or a meaningful design choice. Small syntax elements and convenience functions remain sections within a concept unless they independently meet that threshold.

Every node has one primary subject category, such as type system, domain modeling, collections, Java interoperability, or coroutines. Categories provide stable spatial organization rather than study order or difficulty. Tags and cross-category connections express secondary concerns such as performance or Java interoperability; concepts are not duplicated across categories.

Curriculum depth is a separate property. Core nodes appear by default. Deep-dive and reference nodes remain searchable and can be exposed through filters or by expanding a selected node's neighborhood.

### Connections and study order

The graph uses two connection meanings:

- A directed **prerequisite** edge means that understanding the source is materially necessary for understanding the destination.
- An undirected **related** edge means that the concepts illuminate one another but neither must be learned first.

Prerequisite arrows and quieter related lines should be visually distinguishable. Selecting a node labels its immediate relationships in plain language.

The recommended study path is separate from both connection types. It is a fixed, curated teaching sequence that provides narrative coherence; prerequisites explain knowledge dependencies. A concept can therefore occur earlier in the path because it is useful or motivating without being a strict prerequisite. The graph groups nodes spatially by subject category, while an optional overlay displays the curated path.

No concept is locked. Opening a concept before its prerequisites produces a light “Best understood after…” notice with links, not an access restriction.

### Navigation behavior

The default entry remains the graph overview, with a prominent action to start or continue the recommended path. Existing search, pan and zoom, node selection, related-concept navigation, and shareable concept links remain foundational.

Selecting a node keeps the graph context visible and opens its concept panel. From there, the learner can navigate directly to prerequisites, related concepts, and the next concept on the curated path without losing their place in the graph.

Search covers core, deep-dive, and reference concepts even when some are hidden by the current graph filter. Choosing a hidden result temporarily reveals it and its immediate neighborhood and provides an easy return to the previous view.

### Representative model

`Nullable types` is a core node in **Type system**, while `Platform types` is a core node in **Java interoperability**. A directed prerequisite runs from `Nullable types` to `Platform types`; both can also occupy positions in the curated Java-developer foundation path. `Java nullability annotations` is related to `Platform types`: it becomes its own node only if its distinct semantics and interview value justify independent teaching, otherwise it remains a section within the platform-types lesson.

Progress, completion, and remembered learner state are intentionally left to [Decide how learners practise and judge progress](05-practice-and-progress.md).
