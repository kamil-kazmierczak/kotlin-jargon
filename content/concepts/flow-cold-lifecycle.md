---
id: flow-cold-lifecycle
title: Cold Flow and collection lifetime
profile: substantial
category: streams-concurrency
depth: core
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
baseline: kotlin-jvm-2026-09
publishedAt: 2026-09-24
verifiedAt: 2026-09-24
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-24
reviewReference: commit:06cfe81
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [coroutine-suspension, coroutine-ownership, sequences, collection-transformations]
relatedIds: [state-flow-state, shared-flow-events, flow-backpressure]
aliases: [cold flow, Flow collection, flowOn]
---

## Overview

A regular `Flow` describes how to produce values. It starts when a terminal operation collects it, and each collector runs the cold producer independently.

## Why it matters to Java developers

A Java `Stream` is also a pipeline, but it is normally consumed once. A Kotlin cold Flow can be collected again; each collection can repeat a database query, network subscription, or other upstream work.

## Mental model

Treat a cold Flow as a suspending recipe plus one collection. Ask who calls the terminal operator, how long that coroutine lives, and whether a second collector should repeat the work. The Flow value itself does not launch work or own a long-lived subscription.

## Semantics

The `flow` builder runs its block for each terminal collection. Intermediate operators such as `map` and `filter` describe transformations; operators such as `collect`, `first`, and `toList` start collection. Emission and collection are sequential by default: an upstream `emit` waits for downstream processing. Collection is cancellable with its collecting coroutine, and cancellation propagates upstream. The `flowOn` operator changes the context of upstream operators while the collector stays in its own context; it does not detach the work from the collecting Job.

## Example

Creating `pages` performs no request. The first and second collection each execute the producer and get a distinct request number.

```kotlin run id=streams-cold-collection file=ColdCollection.kt main=ColdCollectionKt expected=2:page-1-1/page-1-2|page-2-1/page-2-2
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    var requestCount = 0
    val pageFlow = flow {
        requestCount += 1
        val request = requestCount
        emit("page-" + request + "-1")
        emit("page-" + request + "-2")
    }

    val first = pageFlow.toList()
    val second = pageFlow.toList()
    println(requestCount.toString() + ":" + first.joinToString("/") + "|" + second.joinToString("/"))
}
```

## Java comparison

Java Flow and Reactive Streams publishers can also describe asynchronous values, but their subscription and backpressure protocols are separate API contracts. Do not assume that a Kotlin Flow is automatically a Java Publisher or that constructing one has already subscribed to its source.

## Common mistakes

Assuming a cold Flow starts when a repository method returns it, collecting twice without noticing duplicated work, or treating `flowOn` as a new owner. A non-cancellable blocking call in the producer can still hold up cancellation.

## Decision guidance

Return a cold Flow when each caller should start its own query or observation. Use `shareIn` or `stateIn` only when several consumers should share one upstream run, and put that sharing coroutine in a scope with the intended component lifetime. Use `first` or `take` when the caller needs only a bounded part of the source.

## Knowledge check

If two request handlers collect the same cold Flow object, how many producer executions occur? Two: each terminal collection starts the recipe independently.

## Connections

[StateFlow](#state-flow-state) exposes a hot current value; [SharedFlow](#shared-flow-events) broadcasts hot values; [backpressure](#flow-backpressure) determines how collection responds to a slow downstream. Coroutine [ownership](#coroutine-ownership) still determines who cancels each collection.

## Interview question

A repository returns a Flow from a database query, and three services collect it. Explain when the query runs, whether it runs once or three times, and how you would share it safely if one query is intended.

## Essential points

- A Flow value is a description; a terminal operator starts a collection.
- Each collection of a cold Flow executes its upstream again.
- The collecting coroutine owns cancellation; `flowOn` changes upstream context without detaching that Job.
- Sharing work requires an explicit sharing scope and start policy.

## Trade-offs

Cold flows make work and cancellation caller-scoped and avoid hidden shared state. Repeated collections can repeat expensive work. Sharing can avoid duplication but introduces a longer-lived owner and a policy for when the upstream starts and stops.

## Common traps

Comparing Flow and Java Stream as if their single-use and subscription rules were identical; collecting only to log values and accidentally rerunning a query; and placing a component-wide shared Flow in a request scope.

## Follow-up probes

What does collecting with `first` do to the upstream? Which thread runs the collector after `flowOn`? Who cancels an upstream started by `shareIn`?

## Sources

- [Kotlin Flows guide](https://kotlinlang.org/docs/coroutines-flow.html)
- [flow builder API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow.html)
- [flowOn API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/flow-on.html)
