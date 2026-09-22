---
id: sequences
title: Sequences, evaluation, and pipeline cost
profile: substantial
category: collections
depth: deep-dive
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-22
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-22
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-22
reviewReference: commit:3335de615b411fad4ba1b2bfed7a7e112f2bdd33
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [collection-transformations, grouping-aggregation]
relatedIds: [collection-interfaces, functions]
aliases: [Sequence, lazy pipeline, terminal operation, asSequence, short circuit]
---

## Overview

A Kotlin `Sequence` represents a potentially lazy element pipeline. Intermediate operations describe work; a terminal operation requests elements. Laziness changes evaluation order and can avoid work, but a sequence is not automatically faster.

## Why it matters to Java developers

Sequences are the closest standard Kotlin analogue to Java Streams in evaluation style, but they are Kotlin types with their own operations and contracts. Like streams, they move important behavior to terminal consumption; unlike Java Streams, many sequences can be iterated again, which can repeat their work.

## Mental model

Collections usually work operation by operation across all elements. Sequences work element by element through the pipeline. Draw the demand from the terminal operation backward, then count how many source elements and stateful buffers that demand requires.

## Semantics

Intermediate operations such as `map` and `filter` are lazy. Terminal operations such as `toList`, `count`, `first`, `any`, `fold`, and grouping aggregations trigger evaluation. Stateless operations can pass an element onward immediately; stateful operations such as sorting or removing duplicates may need retained state or the complete finite input. Short-circuiting terminals and operations such as `take` can stop upstream work. Reusing a sequence commonly reruns its pipeline and side effects, while some sequence producers are constrained to one iteration. Infinite sequences require a bounding or short-circuiting path before terminals that demand exhaustion.

## Example

```kotlin run id=collections-sequence-order file=SequenceOrder.kt main=SequenceOrderKt expected=m1,f2,m2,f4,m3,f6,m4,f8:4|8
fun main() {
    val trace = mutableListOf<String>()
    val result = (1..5).asSequence()
        .map { value -> trace += "m$value"; value * 2 }
        .filter { value -> trace += "f$value"; value % 4 == 0 }
        .take(2)
        .toList()

    println("${trace.joinToString(",")}:${result.joinToString("|")}")
    // m1,f2,m2,f4,m3,f6,m4,f8:4|8
}
```

Mapping and filtering interleave, and the terminal `toList` stops after the second match. Value 5 is never inspected.

```kotlin run id=collections-terminal-reuse file=TerminalReuse.kt main=TerminalReuseKt expected=0:1:1:1:2
fun main() {
    var evaluations = 0
    val values = sequenceOf(1, 2).map { value -> evaluations += 1; value }

    print("$evaluations:")
    print("${values.first()}:$evaluations:")
    print("${values.first()}:$evaluations")
    // 0:1:1:1:2
}
```

Constructing the pipeline does no mapping. Each `first()` is a separate terminal consumption and repeats enough upstream work to obtain its answer.

```kotlin run id=collections-report-pipeline file=ReportPipeline.kt main=ReportPipelineKt expected=EU=2,US=1:4:0
data class Sale(val region: String, val cents: Int, val refunded: Boolean)
data class Report(val counts: Map<String, Int>, val inspected: Int)

class SalesReportSource(input: Collection<Sale>) {
    private val ownedSnapshot = input.toList()

    fun report(limit: Int): Report {
        var inspected = 0
        val counts = ownedSnapshot.asSequence()
            .onEach { inspected += 1 }
            .filterNot { it.refunded }
            .map { it.region.uppercase() }
            .take(limit)
            .groupingBy { it }
            .eachCount()
        return Report(counts, inspected)
    }
}

fun main() {
    val mutable = mutableListOf(
        Sale("eu", 100, false),
        Sale("eu", 200, true),
        Sale("us", 300, false),
        Sale("eu", 400, false),
        Sale("apac", 500, false)
    )
    val source = SalesReportSource(mutable)
    mutable.clear()
    val report = source.report(limit = 3)
    val rendered = report.counts.toSortedMap().entries
        .joinToString(",") { (region, count) -> "$region=$count" }
    println("$rendered:${report.inspected}:${mutable.size}")
    // EU=2,US=1:4:0
}
```

The source retains a snapshot when it accepts the caller-owned structure, so clearing the caller's list before the later report does not erase the batch. Reporting lazily filters and normalizes until three accepted sales exist, then terminally counts by region. It inspects four of five immutable sale values. The copy supplies ownership across time, while the sequence supplies bounded evaluation; neither substitutes for the other.

## Java comparison

Java Streams are single-use: invoking another terminal operation after consumption fails. Kotlin sequences are not universally single-use, and the common pipelines above can be consumed again, rerunning work. In both APIs, stateful operations can limit streaming benefits and side effects inside intermediate operations become sensitive to terminal demand.

## Common mistakes

Adding `asSequence()` to every chain, forgetting a terminal operation, hiding observable side effects in `map` or `filter`, consuming an infinite sequence with `toList`, expecting sorting to stream without buffering, or consuming the same sequence twice without accounting for repeated work.

## Decision guidance

Keep eager collections for small or already-materialized data and simple chains. Consider sequences for long pipelines, expensive transformations, large inputs, generation without a prebuilt collection, or meaningful early termination. Put bounding operations before work they can safely limit. Measure representative workloads: sequence iterators and lambdas add overhead, so laziness is not automatically faster than eager collection operations or a direct loop.

## Knowledge check

Does `items.asSequence().map(::load)` call `load`? Not until a terminal operation requests values. Does that guarantee a speedup? No; the answer depends on input size, avoided work, operation shape, terminal demand, and runtime overhead.

## Connections

[Collection transformations](#collection-transformations) provide the eager comparison. [Grouping](#grouping-aggregation) supplies terminal aggregation, and [collection interfaces](#collection-interfaces) separates ownership guarantees from evaluation strategy.

## Interview question

A service needs the first 20 valid enriched records from 500,000 inputs; enrichment is expensive, and the result is consumed once. Choose an eager collection chain, a sequence, or a loop. Predict evaluation order, identify terminal and stateful operations, and state what measurement could reverse your choice.

## Essential points

- Intermediate sequence operations are lazy; terminal operations trigger demand.
- Element-wise processing and short-circuiting can avoid transformations and intermediate collection results.
- Stateful operations, repeated consumption, infinite inputs, and per-element overhead constrain the benefit.

## Trade-offs

Sequences can reduce unnecessary work and intermediate collections while making execution timing less obvious. Collections provide reusable materialized results and simpler debugging. Direct loops offer precise control and often low overhead at the cost of more manual state and less compositional code.

## Common traps

Treating laziness as automatic performance improvement, confusing a sequence with a cache, assuming all operations are stateless, or comparing pipelines with a microbenchmark that does not consume results or represent production data.

## Follow-up probes

What changes if all records are valid? Where should `sortedBy` appear? How would repeated consumers change the design? Which benchmark inputs and outputs must be controlled?

## Sources

- [Kotlin documentation: Sequences](https://kotlinlang.org/docs/sequences.html)
- [Kotlin documentation: Collection operations overview](https://kotlinlang.org/docs/collection-operations.html)
- [Kotlin documentation: Grouping](https://kotlinlang.org/docs/collection-grouping.html)
