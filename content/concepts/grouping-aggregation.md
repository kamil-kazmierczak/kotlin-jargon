---
id: grouping-aggregation
title: Grouping and incremental aggregation
profile: substantial
category: collections
depth: core
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-22
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-22
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-22
reviewReference: commit:c7dd3dd
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [collection-transformations]
relatedIds: [sequences, collection-interfaces]
aliases: [groupBy, groupingBy, eachCount, fold, aggregate]
---

## Overview

Grouping partitions values by a key, but the desired output determines the right abstraction. `groupBy` materializes lists of members; `groupingBy` supports terminal aggregation without requiring a list for every group.

## Why it matters to Java developers

The choice resembles Java Stream collectors such as `groupingBy(toList())` versus `groupingBy(counting())`. Kotlin makes the distinction visible through `groupBy` and the `Grouping` terminal operations, even when no sequence is involved.

## Mental model

Design backward from the result. If consumers need every member, build groups. If they need a count, sum, fold, or custom accumulator, accumulate that summary directly.

## Semantics

`groupBy` traverses the source and returns a map whose values are lists, optionally transforming values. `groupingBy` returns a `Grouping` facade that defers key selection and traversal until a terminal operation such as `eachCount`, `fold`, `reduce`, or `aggregate`. A terminal grouping operation consumes the source and maintains accumulator state per key. The returned map's iteration order or concrete implementation should not be used as a portable sorting guarantee; sort explicitly when order is part of the output contract.

## Example

```kotlin run id=collections-grouping file=Grouping.kt main=GroupingKt expected=a=2,b=1:a=2,b=1
fun main() {
    val words = listOf("ant", "ape", "bee")
    val lists = words.groupBy { it.first() }
    val counts = words.groupingBy { it.first() }.eachCount()

    fun render(values: Map<Char, Int>) = values.toSortedMap()
        .entries.joinToString(",") { (key, value) -> "$key=$value" }

    println("${render(lists.mapValues { it.value.size })}:${render(counts)}")
    // a=2,b=1:a=2,b=1
}
```

Both approaches produce the same counts. The first also retains three strings in per-key lists; the second stores counts as its intended result. Explicit sorting makes the displayed order contractual in the example.

## Java comparison

Java collectors encode the downstream aggregation inside `Collectors.groupingBy`. Kotlin's `groupingBy` plus a terminal operation plays a similar role. Kotlin `groupBy` is the direct choice when the lists themselves are the required result, not an inferior form to avoid universally.

## Common mistakes

Building lists only to count them, using `associateBy` when multiple values per key must be retained, assuming grouping sorts keys, or using a mutable accumulator in `fold` without understanding whether instances are shared between keys.

## Decision guidance

Use `groupBy` when later logic needs members of each group. Use `groupingBy().eachCount()` for frequencies and `fold` or `aggregate` for a compact per-key result. If output order matters, select an ordered map strategy or sort at the boundary. For an unbounded source, do not expect standard terminal grouping to produce an answer without a bound.

## Knowledge check

Why can `associateBy(Customer::region)` lose customers while `groupBy(Customer::region)` does not? `associateBy` keeps one value per key and later duplicates replace earlier values; `groupBy` retains a list of all members.

## Connections

[Collection transformations](#collection-transformations) provide the general eager result model. [Sequences](#sequences) can feed a terminal grouping operation lazily element by element, but the final map still retains one accumulator or result per observed key.

## Interview question

You must compute request counts per tenant from a bounded batch and later show no individual requests. Choose between `groupBy`, `associateBy`, and `groupingBy().eachCount()`, and explain traversal, retained data, duplicate keys, and ordering.

## Essential points

- `groupBy` retains member lists; `groupingBy` performs work when a terminal aggregation runs.
- `associateBy` overwrites duplicate keys rather than forming groups.
- Aggregation reduces retained per-group data, but still consumes the bounded source and builds a result per key.

## Trade-offs

Member lists preserve maximum downstream flexibility at a memory cost. Direct accumulation records less data and better expresses a known summary, but cannot later recover discarded members. Ordering work adds cost and should follow an explicit output requirement.

## Common traps

Calling `groupingBy` a reusable stored grouping, forgetting its terminal operation, claiming it makes an unbounded sequence safe, or treating observed insertion order as a sorting contract.

## Follow-up probes

How would you compute totals rather than counts? What happens with a high-cardinality key? When would a database aggregation be a better boundary?

## Sources

- [Kotlin documentation: Grouping](https://kotlinlang.org/docs/collection-grouping.html)
- [Kotlin documentation: Aggregate operations](https://kotlinlang.org/docs/collection-aggregate.html)
- [Kotlin documentation: Collection transformation operations](https://kotlinlang.org/docs/collection-transformations.html)
