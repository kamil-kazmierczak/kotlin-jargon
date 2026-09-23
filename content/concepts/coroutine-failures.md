---
id: coroutine-failures
title: Coroutine failures and supervision
profile: substantial
category: coroutines
depth: deep-dive
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
baseline: kotlin-jvm-2026-09
publishedAt: 2026-09-23
verifiedAt: 2026-09-23
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-23
reviewReference: commit:d7f8333
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [coroutine-cancellation, coroutine-builders]
relatedIds: [coroutine-ownership, coroutine-context-dispatchers]
aliases: [exception propagation, supervisorScope, CoroutineExceptionHandler, child failure]
---

## Overview

An ordinary child failure propagates through its Job parent, cancels siblings, and reaches the enclosing scoped operation. Supervision changes sibling failure behavior, but does not silently handle exceptions.

## Why it matters to Java developers

A Java `Future` can hold a task exception until `get` is called; sibling tasks submitted to an executor do not automatically fail together. In a regular coroutine scope, an `async` child's failure affects the parent even if nobody calls `await`.

## Mental model

For each exception, ask where it originates, which Job is its parent, and whether a supervision boundary sits between it and siblings. Then ask who observes or handles the failure. The `CoroutineExceptionHandler` is a last-resort reporting mechanism for uncaught exceptions, not a `try/catch` replacement that resumes a failed coroutine.

## Semantics

A failing child with an ordinary exception cancels its parent and siblings. `coroutineScope` waits for children and then rethrows a failure to its caller. `async.await` also throws the Deferred's failure to the awaiter; ignoring the Deferred does not suppress parent propagation. `CancellationException` expresses normal cancellation and is treated differently from ordinary failure. `supervisorScope` lets one direct child fail without canceling its siblings; a failure of the supervisor block itself still cancels them. Handle each supervised `async` failure through `await` and each supervised `launch` failure through its own catch or a suitable handler. `CoroutineExceptionHandler` cannot intercept every child failure at its origin.

## Example

The failing child waits until its sibling is suspended. The scope then catches the propagated exception after the sibling's `finally` runs. Channels and `awaitCancellation` establish the order without timing assumptions.

```kotlin run id=coroutines-failures file=Failures.kt main=FailuresKt expected=true:true
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel

fun main() = runBlocking {
    val started = Channel<Unit>(1)
    var siblingCancelled = false
    val caught = try {
        coroutineScope {
            launch {
                try {
                    started.send(Unit)
                    awaitCancellation()
                } finally {
                    siblingCancelled = !currentCoroutineContext().isActive
                }
            }
            val result = async<Int> {
                started.receive()
                error("lookup failed")
            }
            result.await()
        }
        false
    } catch (failure: IllegalStateException) {
        failure.message == "lookup failed"
    }
    println("$caught:$siblingCancelled")
}
```

## Java comparison

An executor can run siblings independently unless the application coordinates cancellation. A coroutine scope makes ordinary failure fan out along Job edges. Supervision resembles an explicit independence policy, but it still requires observing and reporting each failed child.

## Common mistakes

Assuming an unawaited `Deferred` cannot affect its parent, installing a handler as if it could resume a failed child, or using supervision to discard errors.

## Decision guidance

Use ordinary scopes when sibling work forms one all-or-nothing operation. Use a bounded supervisor scope only when independent outcomes are the requirement and every child failure has an owner that handles it. Put `try/catch` around the suspending scope or awaited result when the caller must make a recovery decision.

## Knowledge check

Does an ignored `Deferred` failure leave an ordinary `coroutineScope` successful? No. The child failure cancels the scope, which ultimately fails after its children complete.

## Connections

[Builders](#coroutine-builders) define the result handle, [ownership](#coroutine-ownership) defines propagation edges, and [cancellation](#coroutine-cancellation) explains why siblings stop.

## Interview question

A request uses `async` for a lookup and `launch` for audit. The lookup throws before `await`; the audit is suspended. Trace both Jobs and the caller result. Then redesign only if audit failure independence is an actual requirement.

## Essential points

- Ordinary child failure cancels its parent and siblings.
- `await` observes a Deferred failure but does not create its parent link.
- Supervision separates sibling failures and requires explicit handling.

## Trade-offs

All-or-nothing scopes simplify consistency but discard sibling work on failure. Supervision preserves independent work while increasing the burden of reporting and joining outcomes.

## Common traps

Treating cancellation as a business error, hiding a failing child in an unawaited Deferred, or treating a handler as recovery logic.

## Follow-up probes

What if the supervisor block itself throws? Where should a `launch` failure be caught under supervision? When would an aggregate result type be clearer than throwing?

## Sources

- [Kotlin coroutine exception handling](https://kotlinlang.org/docs/exception-handling.html)
- [Kotlin supervisorScope API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/supervisor-scope.html)
- [Kotlin CoroutineExceptionHandler API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-exception-handler/)
