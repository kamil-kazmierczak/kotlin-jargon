---
id: shared-flow-events
title: SharedFlow for broadcast events
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
prerequisiteIds: [flow-cold-lifecycle, state-flow-state, coroutine-ownership]
relatedIds: [flow-backpressure, coroutine-channels]
aliases: [SharedFlow, MutableSharedFlow, shareIn, replay cache]
---

## Overview

`SharedFlow` is a hot broadcast stream. Every active collector can observe an emission, while replay and buffer settings decide what a late or slow collector can receive.

## Why it matters to Java developers

A Java listener list or event bus also broadcasts, but its thread, buffering, and subscription lifetime are often separate conventions. SharedFlow exposes these choices alongside coroutine collection and cancellation.

## Mental model

Choose the audience and retention policy before choosing replay settings. An active subscriber is one audience member; the replay cache is a bounded in-memory handoff to later subscribers, not a durable event log. The scope that starts a `shareIn` upstream owns that shared producer.

## Semantics

Construct `MutableSharedFlow(replay, extraBufferCapacity, onBufferOverflow)` and expose its read-only SharedFlow view. Values are broadcast to active subscribers. New subscribers first receive the replay cache, then new emissions. A default `MutableSharedFlow()` has no replay or extra buffer: emit suspends until active subscribers receive the value, but returns immediately and loses the value when there are no subscribers. Extra buffer capacity lets active slow subscribers lag; it does not add retention when there are no subscribers. SharedFlow never completes normally and cannot carry failure except as an explicit value. A cold Flow can be converted into a shared hot source with `shareIn(scope, started, replay)`.

## Example

The default stream drops an emission made without a subscriber. A separate stream with replay one gives a late collector the most recent value.

```kotlin run id=streams-shared-flow file=SharedFlowEvents.kt main=SharedFlowEventsKt expected=accepted:latest
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val events = MutableSharedFlow<String>()
    events.emit("missed")
    val activeValues = mutableListOf<String>()
    val active = launch(start = CoroutineStart.UNDISPATCHED) {
        events.take(1).toList(activeValues)
    }
    events.emit("accepted")
    active.join()

    val latest = MutableSharedFlow<String>(replay = 1)
    latest.emit("latest")
    val lateValues = mutableListOf<String>()
    latest.take(1).toList(lateValues)
    println(activeValues.single() + ":" + lateValues.single())
}
```

## Java comparison

An event bus that buffers forever may appear to guarantee every listener can catch up, but it transfers backlog and memory policy to its implementation. SharedFlow makes replay and overflow explicit; it still does not persist events across process restart.

## Common mistakes

Assuming default SharedFlow retains an event for future collectors, using replay as a substitute for a durable queue, or forgetting that the shared collection started by `shareIn` needs an owner. Using an unlimited effective backlog can let a slow subscriber consume unbounded memory.

## Decision guidance

Use SharedFlow when multiple current consumers need the same in-process event and its loss or bounded replay policy is acceptable. Use StateFlow for latest state. Configure replay only for the number of recent values late subscribers actually need. For durable delivery, persist before publishing; for one-worker-at-a-time work distribution, use a Channel or a durable queue.

## Knowledge check

Does `extraBufferCapacity = 32` preserve 32 events emitted while there are no subscribers? No. Without subscribers, SharedFlow retains only the configured replay values.

## Connections

[StateFlow](#state-flow-state) is the specialized current-state form; [backpressure](#flow-backpressure) explains slow collector policies; [channels](#coroutine-channels) distribute each queued element to a receiver rather than broadcasting it.

## Interview question

A backend publishes payment notifications through MutableSharedFlow with default settings. What happens when no client is collecting, and how would replay, a Channel, or a durable broker change the delivery contract?

## Essential points

- SharedFlow broadcasts to active collectors and is independent of them.
- New collectors receive only the configured replay cache before live emissions.
- Default MutableSharedFlow loses values emitted with no subscribers.
- Replay and buffers are in-memory delivery policy, not durable storage.
- A shared upstream started by shareIn requires a scope and start strategy.

## Trade-offs

Broadcasting avoids producer duplication and reaches several active consumers. Backpressure can couple a producer to the slowest subscriber; dropping overflow trades delivery completeness for latency and bounded memory. Replay improves late subscription behavior but does not recover process loss.

## Common traps

Claiming SharedFlow always suspends until a consumer accepts a value; treating it as a queue where one subscriber takes each item; and mistaking configured replay for a persistence guarantee.

## Follow-up probes

What is retained with replay zero and no subscribers? What does extraBufferCapacity do when a subscriber is slow? Who cancels a flow shared with WhileSubscribed?

## Sources

- [SharedFlow API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-shared-flow/)
- [shareIn API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/share-in.html)
- [BufferOverflow API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-buffer-overflow/)
