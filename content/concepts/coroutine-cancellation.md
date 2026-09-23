---
id: coroutine-cancellation
title: Cooperative cancellation and cleanup
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
prerequisiteIds: [coroutine-ownership, coroutine-context-dispatchers]
relatedIds: [coroutine-failures, coroutine-suspension]
aliases: [CancellationException, cancelAndJoin, ensureActive, NonCancellable]
---

## Overview

Cancellation requests that a Job and its children stop. It is cooperative: suspending operations and explicit checks observe it, while arbitrary CPU loops or blocking Java calls may continue until they cooperate.

## Why it matters to Java developers

`Future.cancel(true)` requests thread interruption. Coroutine cancellation follows the Job tree and usually appears as `CancellationException` at cancellable suspension points. It is not a general-purpose thread interrupt or a forced stop of synchronous Java code.

## Mental model

Trace cancellation downward from the owner. At each child, identify its next cancellable suspension or explicit active check. Put cleanup in `finally`, and decide separately whether cleanup needs suspension.

## Semantics

`cancelAndJoin` requests cancellation and waits for completion. `delay`, channel operations, and other cancellable suspensions respond by throwing `CancellationException`. A loop doing CPU work should call `ensureActive()` or check `isActive`. Broad `catch (Exception)` blocks must rethrow `CancellationException`, or cancellation can be swallowed. A normal `finally` block runs on exit; suspending cleanup within an already canceled context needs a short, deliberate `withContext(NonCancellable)` section. This should not be used to keep ordinary work alive indefinitely.

## Example

The child announces it has started before the parent cancels it. `cancelAndJoin` waits for `finally`, so output does not depend on a sleep or scheduler race.

```kotlin run id=coroutines-cancellation file=Cancellation.kt main=CancellationKt expected=true:true
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel

fun main() = runBlocking {
    val started = Channel<Unit>(1)
    var cleaned = false
    val child = launch {
        try {
            started.send(Unit)
            awaitCancellation()
        } finally {
            cleaned = true
        }
    }
    started.receive()
    child.cancelAndJoin()
    println("${child.isCancelled}:$cleaned")
}
```

## Java comparison

Java interruption is a thread-level signal that blocking methods may observe. Coroutine cancellation is a Job-level signal propagated through structured children; a blocking library may require its own cancellation or close operation. Do not assume moving a blocking call to `Dispatchers.IO` makes that library respond to cancellation.

## Common mistakes

Catching `CancellationException` and returning success, assuming cancellation preempts CPU code, or launching cleanup into an unrelated scope without an owner.

## Decision guidance

Keep cancellation observable at each long-running step. Use cancellable suspending APIs where possible. For a blocking client, consult its cancellation contract and close resources explicitly. Keep non-cancellable cleanup minimal.

## Knowledge check

Will a tight `while (true)` inside a coroutine automatically stop when its Job is canceled? No. It needs an active check or a cancellable suspension point.

## Connections

[Ownership](#coroutine-ownership) determines which children receive cancellation; [failures](#coroutine-failures) distinguishes cancellation from an ordinary exception.

## Interview question

A disconnected HTTP request cancels its scope, but a child running a blocking driver continues and a CPU loop never stops. Explain each observation and give a deterministic test for cleanup.

## Essential points

- Cancellation propagates along Job parent-child links and is cooperative.
- `CancellationException` should normally be rethrown from broad catches.
- `cancelAndJoin` can prove completion and cleanup without elapsed-time assumptions.

## Trade-offs

Frequent active checks improve responsiveness but add some overhead. Non-cancellable cleanup can protect a narrow invariant, but delays completion if it is unbounded.

## Common traps

Equating cancellation with thread interruption or assuming `finally` may safely call any suspending function in a canceled context.

## Follow-up probes

When is `NonCancellable` justified? How should a Java client's close method be integrated? What does `cancelAndJoin` prove that `cancel` alone does not?

## Sources

- [Kotlin cancellation and timeouts](https://kotlinlang.org/docs/cancellation-and-timeouts.html)
- [Kotlin Job API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-job/)
