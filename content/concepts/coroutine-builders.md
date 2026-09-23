---
id: coroutine-builders
title: Coroutine builders and results
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
prerequisiteIds: [coroutine-ownership]
relatedIds: [coroutine-suspension, coroutine-failures]
aliases: [launch, async, Deferred, runBlocking, withContext]
---

## Overview

Builders connect a suspending body to an owned coroutine or scope. Choose them by the work's result and lifetime, not by an assumption that one is inherently faster.

## Why it matters to Java developers

`launch` returns a `Job` for completion and cancellation; `async` returns a `Deferred<T>` with a value obtained by `await`. These resemble some uses of executor tasks and futures, but their parent scope also determines completion and failure propagation.

## Mental model

Start with the owner. In that scope, use `launch` for a child whose result is not a value, `async` for a child whose value will be consumed, and `withContext` for a scoped context switch with a direct result. Use `runBlocking` at a synchronous entry boundary, not inside a suspending request path.

## Semantics

`launch` and `async` start children by default. `join` waits for a Job's completion; `await` returns a Deferred value or throws its failure. `coroutineScope` is a suspending scope that waits for its children. `withContext` suspends its caller until its block completes and returns the block result. `runBlocking` blocks its caller's thread while its coroutine tree runs, which is useful for `main` and bridging synchronous code. A `Deferred` is also a Job, so not awaiting it does not detach it from its parent.

## Example

The scope waits for both children. `async` supplies a value, while `launch` records an effect. The channel handshakes make the output independent of scheduler timing.

```kotlin run id=coroutines-builders file=Builders.kt main=BuildersKt expected=audit:42
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel

fun main() = runBlocking<Unit> {
    val signal = Channel<Unit>(1)
    coroutineScope {
        launch { signal.send(Unit) }
        val answer = async { signal.receive(); 40 + 2 }
        answer.await().also { println("audit:$it") }
    }
}
```

## Java comparison

An executor's `submit` returns a `Future`, but the executor does not by itself require a submitting request to await every task. A coroutine child stays in its scope's lifetime even if its handle is ignored. `runBlocking` is the explicit bridge back to a blocked Java-style caller.

## Common mistakes

Using `async` for ignored results, calling `runBlocking` inside suspending code, or assuming `await` is the operation that gives a child its parent.

## Decision guidance

Use `coroutineScope` for concurrent operations with a bounded lifetime; use `withContext` when only the context must change. Preserve and consume meaningful Deferred results. Put `runBlocking` at a narrow synchronous boundary.

## Knowledge check

If an `async` child is never awaited, may its ordinary failure still cancel `coroutineScope`? Yes. Parent-child failure propagation does not depend on calling `await`.

## Connections

[Ownership](#coroutine-ownership) explains the parent relation; [failure](#coroutine-failures) explains the difference between observing a result and containing a failure.

## Interview question

A request fires two lookups with `async`, ignores one Deferred, and returns from `coroutineScope`. Explain when the request can finish and what happens if the ignored lookup throws.

## Essential points

- Builders require a scope and produce children of its Job.
- `launch` exposes a Job; `async` exposes a Deferred value.
- `runBlocking` blocks its caller; `coroutineScope` suspends its caller.

## Trade-offs

Concurrent children can reduce elapsed wait when independent operations overlap, but add cancellation and failure interactions. A direct `withContext` result is simpler when parallelism is unnecessary.

## Common traps

Treating `Deferred` like a detached Java future or using `GlobalScope` to make a missing owner disappear.

## Follow-up probes

When is `join` enough? When does `withContext` make an `async` redundant? Which boundary should own work that outlives one HTTP request?

## Sources

- [Kotlin coroutines basics](https://kotlinlang.org/docs/coroutines-basics.html)
- [Kotlin CoroutineScope API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/)
