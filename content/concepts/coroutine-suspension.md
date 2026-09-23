---
id: coroutine-suspension
title: Suspension and threads
profile: substantial
category: coroutines
depth: core
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
baseline: kotlin-jvm-2026-09
publishedAt: 2026-09-23
verifiedAt: 2026-09-23
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-23
reviewReference: commit:1c367833447e18fb3694077985463468c2255ed4
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [functions, jvm-execution]
relatedIds: [coroutine-builders, coroutine-context-dispatchers]
aliases: [suspend function, continuation, blocking thread, delay]
---

## Overview

A suspending function can pause its coroutine and resume later. Suspension is a property of the computation, not a promise that every call pauses or that work moves to another thread.

## Why it matters to Java developers

A Java `Thread.sleep` occupies its thread while waiting. A coroutine `delay` suspends without occupying a thread during the wait. Calling a blocking Java client from a `suspend` function still blocks the executing thread.

## Mental model

Keep three questions separate: who owns the work, can it suspend, and which thread executes its current segment? A coroutine can resume on another thread according to its context; never use thread identity as its lifetime identity.

## Semantics

`suspend` marks a function callable from another suspending function or coroutine. It permits suspension points but does not create a coroutine or schedule parallel work. `delay` is cancellable and suspends. `Thread.sleep` blocks. A CPU-bound function with `suspend` but no suspension or cancellation checks can monopolize its worker.

## Example

The first task starts, suspends at `delay`, and the second task gets to run before the first resumes. The completion order is established by the explicit start and the scope's wait, not by measuring time.

```kotlin run id=coroutines-suspension file=Suspension.kt main=SuspensionKt expected=first,second,resumed
import kotlinx.coroutines.*

fun main() = runBlocking {
    val trace = mutableListOf<String>()
    coroutineScope {
        launch(start = CoroutineStart.UNDISPATCHED) {
            trace += "first"
            delay(1)
            trace += "resumed"
        }
        launch(start = CoroutineStart.UNDISPATCHED) { trace += "second" }
    }
    println(trace.joinToString(","))
}
```

## Java comparison

A `Future.get()` blocks its calling Java thread until the result arrives. Awaiting a `Deferred` from a coroutine suspends that coroutine. Neither abstraction alone defines the entire tree of work: the scope and Job relationships do.

## Common mistakes

Treating `suspend` as a background-thread annotation, assuming every suspend call actually suspends, or hiding a blocking driver inside a suspending signature.

## Decision guidance

Use suspending APIs for asynchronous waits. If a legacy call truly blocks, isolate that section on a dispatcher suited to blocking I/O and keep its request lifetime inside an owned scope. Measure workload behavior before claiming throughput improvements.

## Knowledge check

Does `suspend fun load() = legacyClient.read()` make `read()` non-blocking? No. The Java call still occupies its executing thread.

## Connections

[Builders](#coroutine-builders) create coroutines, [ownership](#coroutine-ownership) defines their lifetime, and [context](#coroutine-context-dispatchers) selects execution resources.

## Interview question

A service marks a method `suspend` but calls a synchronous JDBC driver. Explain what suspends, what blocks, and how to redesign the boundary without losing request cancellation.

## Essential points

- `suspend` permits suspension and does not launch a coroutine.
- `delay` releases the executing thread while suspended; a blocking call does not.
- Coroutine identity and Job lifetime are distinct from thread identity.

## Trade-offs

Adapting a blocking API to `Dispatchers.IO` keeps a clear lifetime but still consumes threads during the call. A truly asynchronous driver can avoid that occupancy, at the cost of another API and operational contract.

## Common traps

Calling every suspend function asynchronous, equating a continuation with a Java thread, and promising a particular resumed thread.

## Follow-up probes

What changes if `load` performs only CPU work? Why does `delay` make cancellation observable? How would you detect thread starvation from a blocking client?

## Sources

- [Kotlin coroutines basics](https://kotlinlang.org/docs/coroutines-basics.html)
- [Kotlin coroutine context and dispatchers](https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html)
