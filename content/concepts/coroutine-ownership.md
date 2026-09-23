---
id: coroutine-ownership
title: Scopes, Jobs, and structured ownership
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
reviewReference: commit:d7f8333
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [coroutine-suspension]
relatedIds: [coroutine-builders, coroutine-cancellation, coroutine-failures]
aliases: [structured concurrency, parent Job, child Job, coroutineScope]
---

## Overview

Structured concurrency gives concurrent work an owner. A `CoroutineScope` carries the context used to create children; its `Job` relationship determines which work must complete and which work is canceled with the owner.

## Why it matters to Java developers

A Java executor owns worker resources, while a submitted task's relationship to a request is usually application code. A coroutine scope makes that relationship explicit. It does not automatically close unrelated files, sockets, or executor resources.

## Mental model

Draw a tree of Jobs before drawing a thread diagram. The parent waits for children and cancellation flows downward. An ordinary failing child cancels its parent; the sibling effect follows from that parent failure. A long-lived component may own a scope, but the component must cancel it when its lifetime ends.

## Semantics

`coroutineScope` creates a bounded child scope and returns only after its children finish. `launch` and `async` inherit the parent context, with a new child Job. `job.children` exposes currently attached children, though it is a live view and should not be used as a synchronization substitute. Passing a different Job in a builder context changes parentage and can break the intended tree; use a scoped builder or an explicitly owned scope for a separate lifetime. A `Job` is a lifecycle handle, not itself a coroutine builder.

## Example

The channel confirms that the child has started. The parent relationship is checked while the child waits; closing the scope awaits its completion.

```kotlin run id=coroutines-ownership file=Ownership.kt main=OwnershipKt expected=true:true
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import kotlin.coroutines.coroutineContext

fun main() = runBlocking {
    val parent = coroutineContext[Job]!!
    val started = Channel<Unit>(1)
    val finish = Channel<Unit>(1)
    val child = launch {
        started.send(Unit)
        finish.receive()
    }
    started.receive()
    val attached = parent.children.any { it === child }
    finish.send(Unit)
    child.join()
    println("$attached:${child.isCompleted}")
}
```

## Java comparison

`ExecutorService.submit` gives a task handle, and `Future.cancel` can request interruption. Neither call requires the submitting method to wait for that task or connects its failure to sibling tasks. The coroutine Job tree defines those relationships, though cancellation remains cooperative.

## Common mistakes

Using `GlobalScope` for request work, creating an untracked application scope, or replacing the builder's Job simply to select a dispatcher.

## Decision guidance

For a request, use `coroutineScope` or the framework's request-owned scope. For component lifetime, create a scope whose owner has a matching close or cancel operation. Keep the Job inherited when changing dispatcher or name.

## Knowledge check

Does `launch(Dispatchers.IO)` make the child independent of the caller's Job? No. It changes the dispatcher element and keeps the inherited parent Job.

## Connections

[Context and dispatchers](#coroutine-context-dispatchers) govern execution; [cancellation](#coroutine-cancellation) and [failure](#coroutine-failures) follow Job edges.

## Interview question

A handler launches logging and persistence work, then returns a response. Draw the intended tree, identify which work must finish first, and explain how a disconnect should affect each child.

## Essential points

- Scopes establish lifetime ownership; Jobs represent lifecycle and parent-child links.
- A scope waits for children before it completes.
- Choosing a dispatcher need not change parentage.

## Trade-offs

Owned work can delay completion while children finish. Detaching work requires a separate, explicit owner and a deliberate failure policy, not an accidental context override.

## Common traps

Treating an executor as a complete request lifetime model or treating `Job()` as a convenient launch function.

## Follow-up probes

Who cancels a service-owned scope on shutdown? What if a child starts another child? Why is `job.children` unsuitable as the sole completion test?

## Sources

- [Kotlin coroutines basics](https://kotlinlang.org/docs/coroutines-basics.html)
- [Kotlin CoroutineScope API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-coroutine-scope/)
