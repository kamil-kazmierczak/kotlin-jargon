---
id: flow-backpressure
title: Flow backpressure and overload policies
profile: substantial
category: streams-concurrency
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [flow-cold-lifecycle, coroutine-cancellation, collection-transformations]
relatedIds: [shared-flow-events, coroutine-channels, coroutine-testing]
aliases: [Flow buffer, conflate, collectLatest, BufferOverflow]
---

## Overview

Backpressure describes what a producer does when downstream cannot keep up. Flow is sequential by default; operators can add a bounded handoff or deliberately discard values.

## Why it matters to Java developers

Reactive Streams specifies demand as part of its protocol. Kotlin Flow operators provide their own sequential, buffered, conflated, and cancellation-based policies; a Flow value does not imply a particular queue size or cross-language demand protocol.

## Mental model

Draw the producer, any buffer, and the consumer. Decide whether every value matters, how much lag is acceptable, and what happens at capacity. A bounded buffer separates producer and consumer for a while, but it cannot make a permanently slower consumer catch up without eventually suspending or losing values.

## Semantics

Ordinary Flow operators execute sequentially in the collecting coroutine unless an operator introduces a boundary. `buffer(capacity, onBufferOverflow)` creates a bounded upstream/downstream handoff. The default `BufferOverflow.SUSPEND` suspends upstream when the buffer is full. `DROP_OLDEST` keeps newer buffered values; `DROP_LATEST` rejects an arriving value while retaining the current buffer. `conflate` is a shortcut that lets the collector skip intermediate values and receive the latest one. `collectLatest` cancels the previous action block when a new value arrives; use it only when prior in-progress work is replaceable and cancellation cleanup is correct. Buffering can overlap producer and consumer work, but does not guarantee higher sustainable end-to-end throughput.

## Example

The collector acknowledges the first value, then holds it until the producer finishes. With capacity one and DROP_OLDEST, value 2 is replaced by 3 while the consumer is busy.

```kotlin run id=streams-backpressure file=FlowBackpressure.kt main=FlowBackpressureKt expected=1,3
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.flow.buffer
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.channels.BufferOverflow

fun main() = runBlocking {
    val firstReceived = CompletableDeferred<Unit>()
    val producerFinished = CompletableDeferred<Unit>()
    val seen = mutableListOf<Int>()
    val source = flow {
        emit(1)
        firstReceived.await()
        emit(2)
        emit(3)
        producerFinished.complete(Unit)
    }

    source.buffer(capacity = 1, onBufferOverflow = BufferOverflow.DROP_OLDEST)
        .collect { value ->
            if (value == 1) {
                firstReceived.complete(Unit)
                producerFinished.await()
            }
            seen += value
        }
    println(seen.joinToString(","))
}
```

## Java comparison

An unbounded Java queue lets producers outrun consumers until memory becomes the limiting policy. A bounded queue usually makes the producer wait, reject, or drop according to an explicit operation. Flow exposes similar decisions as operators while preserving coroutine cancellation.

## Common mistakes

Assuming `buffer` increases sustainable throughput without a bottleneck change, using an unlimited buffer to hide overload, dropping records that must be audited, or using `collectLatest` when cancelled work has already made irreversible side effects.

## Decision guidance

Use the default sequential flow when direct backpressure is acceptable. Add a small bounded buffer when a short burst should be absorbed. Use `SUSPEND` when all values matter and the producer can wait. Use conflate or a dropping overflow rule only when a newer snapshot makes older buffered values unnecessary. Use `collectLatest` for cancellable rendering or computation that becomes obsolete. Measure queue depth and processing lag in production.

## Knowledge check

With a capacity-one buffer using DROP_OLDEST, the consumer is handling 1 while 2 and then 3 arrive. What can it receive next? 3; 2 was replaced because it was the oldest buffered value.

## Connections

[Cold Flow](#flow-cold-lifecycle) explains sequential collection; [SharedFlow](#shared-flow-events) and [Channel](#coroutine-channels) also expose buffering and delivery choices; [coroutine tests](#coroutine-testing) use virtual time and handshakes to verify those choices.

## Interview question

A telemetry producer emits faster than a database writer can persist. Compare a bounded suspending Flow buffer, conflation, and drop policies. State which data each choice may lose and how you would observe overload.

## Essential points

- Default Flow collection applies sequential backpressure.
- A bounded buffer absorbs only a finite burst and can later suspend upstream.
- Conflation and overflow strategies intentionally sacrifice values.
- collectLatest cancels the prior action, so correctness depends on safe cancellation.
- Buffering is not a guarantee of higher end-to-end throughput.

## Trade-offs

Suspension protects completeness and bounds memory but can propagate latency to the producer. Dropping keeps a consumer current and queue bounded but loses history. A buffer can smooth bursts at the cost of extra in-flight work and memory.

## Common traps

Calling all buffer configurations “backpressure” without naming the full-buffer behavior; assuming a hot source can be slowed by every collector; and treating cancellation of an action as rollback of its external effects.

## Follow-up probes

When does DROP_OLDEST differ from DROP_LATEST? What does conflate preserve? What work is cancelled by collectLatest? How would you test a producer that suspends at capacity?

## Sources

- [Kotlin Flows guide](https://kotlinlang.org/docs/coroutines-flow.html)
- [buffer API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/buffer.html)
- [conflate API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/conflate.html)
- [BufferOverflow API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-buffer-overflow/)
