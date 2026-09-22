---
id: collection-transformations
title: Collection transformations and materialized results
profile: substantial
category: collections
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [collection-interfaces, functions]
relatedIds: [grouping-aggregation, sequences]
aliases: [map, filter, flatMap, associate, zip, eager collection operations]
---

## Overview

Kotlin collection transformations express what result to derive—mapping, filtering, flattening, associating, or combining values. On ordinary collections, these operations are eager and normally materialize a result before the next call begins.

## Why it matters to Java developers

A chain on `Iterable` can look like a Java Stream pipeline while behaving differently. Kotlin's collection `map` and `filter` run immediately and produce intermediate collections; Java Stream intermediate operations are lazy until a terminal operation.

## Mental model

Read a collection chain as a sequence of complete passes and materialized boundaries. First establish the semantic result, then count traversals, retained values, and intermediate collections when cost matters.

## Semantics

`map` produces one result per input, `filter` keeps matching inputs, `mapNotNull` can transform and discard null results in one operation, and `flatMap` concatenates produced iterables. `associate*` operations build maps; if keys repeat, later values overwrite earlier ones. These operations do not mutate the receiver. For collection receivers, each operation completes eagerly, so a later `take` cannot stop work already performed by an earlier `map` or `filter`.

## Example

```kotlin run id=collections-transform-traversal file=TransformTraversal.kt main=TransformTraversalKt expected=m1,m2,m3,m4,f2,f4,f6,f8:6
fun main() {
    val trace = mutableListOf<String>()
    val result = listOf(1, 2, 3, 4)
        .map { value -> trace += "m$value"; value * 2 }
        .filter { value -> trace += "f$value"; value > 4 }
        .take(1)

    println("${trace.joinToString(",")}:${result.single()}")
    // m1,m2,m3,m4,f2,f4,f6,f8:6
}
```

All four mappings finish, then all four filters finish, and only then does `take(1)` select the first retained value. The trace makes the two traversals deterministic without claiming a particular concrete result-list class or byte allocation count.

## Java comparison

Java Stream `map` and `filter` are intermediate operations and begin work only when a terminal operation such as `toList`, `findFirst`, or `count` requests elements. Kotlin collection operations behave more like invoking Java collection-to-collection helper methods immediately. Kotlin sequences provide the closer lazy-pipeline comparison.

## Common mistakes

Assuming a fluent chain is lazy, overlooking duplicate-key replacement in `associateBy`, choosing `map` plus `filterNotNull` when `mapNotNull` states the intent directly, or optimizing a short and clear eager chain without evidence that its allocations matter.

## Decision guidance

Prefer collection operations for bounded in-memory data when eager results and straightforward debugging are valuable. Combine operations when it clarifies intent or removes a measured extra pass. Consider a sequence when interleaved processing or early termination can avoid material work, and benchmark important hot paths rather than inferring performance from syntax.

## Knowledge check

In `items.map(::expand).filter(::valid).take(1)`, can `take(1)` prevent `expand` from running on later collection elements? No. Both preceding collection transformations have already materialized their results.

## Connections

[Collection interfaces](#collection-interfaces) distinguishes result capabilities and ownership. [Grouping](#grouping-aggregation) specializes accumulation by key. [Sequences](#sequences) change when and in what order equivalent-looking operations execute.

## Interview question

Given one million records and a requirement for the first ten normalized matches, predict the work performed by `records.map(::normalize).filter(::accepted).take(10)`. When would you keep it, fuse operations, or use a sequence?

## Essential points

- Collection transformations are eager and normally produce intermediate collection results.
- `take` cannot short-circuit work that earlier eager transformations already completed.
- The correct design depends on boundedness, pipeline depth, early termination, readability, and measured cost.

## Trade-offs

Eager intermediate results simplify inspection, reuse, and failure timing but add traversal and allocation. Fused loops can minimize overhead but become less declarative. Lazy pipelines may avoid work but add per-element machinery and can repeat work when consumed again.

## Common traps

Equating fluent syntax with laziness, promising exact allocation counts the standard library does not contract, or replacing every collection chain with a sequence without workload evidence.

## Follow-up probes

What changes if every element matches? How do duplicate association keys behave? When is an explicit loop the clearest performance choice?

## Sources

- [Kotlin documentation: Collection operations overview](https://kotlinlang.org/docs/collection-operations.html)
- [Kotlin documentation: Collection transformation operations](https://kotlinlang.org/docs/collection-transformations.html)
- [Kotlin documentation: Collection filtering](https://kotlinlang.org/docs/collection-filtering.html)
