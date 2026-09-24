---
id: state-flow-state
title: StateFlow for current state
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
prerequisiteIds: [flow-cold-lifecycle, coroutine-ownership, collection-interfaces, immutability, closed-domain-models]
relatedIds: [shared-flow-events, shared-state-synchronization]
aliases: [StateFlow, MutableStateFlow, stateIn]
---

## Overview

`StateFlow` is a hot stream for one current value that can change over time. It always has a value, replays the latest value to new collectors, and may skip intermediate updates for a slow collector.

## Why it matters to Java developers

An `AtomicReference` can expose a current value safely, but it does not also provide a suspending stream of changes to multiple collectors. StateFlow combines a readable current value with a hot Flow of updates.

## Mental model

Model one complete snapshot, then publish a replacement snapshot when state changes. A collector observes the current snapshot and later changes; it is not an audit log of every assignment. Use immutable values so an already emitted snapshot cannot be silently mutated behind a collector.

## Semantics

Create mutable state with `MutableStateFlow(initialValue)` and expose it as the read-only `StateFlow` interface. Reading `value` returns the current state synchronously. New collectors first receive the current value. Updates are conflated using equality: equal values do not produce a new emission, and a slow collector may skip older values while moving to the latest one. StateFlow never completes normally and cannot directly represent failure; include loading, success, and failure cases in the state type when those are part of the contract. Its operations are thread-safe, but a compound read-then-write expression is not automatically one atomic update. The `update` function performs an atomic transformation; keep its lambda free of side effects because it can be evaluated more than once under contention.

## Example

The collector sees the initial empty snapshot, then each distinct state. An acknowledgment after each value makes this example deterministic; an ordinary collector may skip intermediate updates. Replacing a snapshot with an equal one does not create an event.

```kotlin run id=streams-state-flow file=StateFlowState.kt main=StateFlowStateKt expected=0,1,2
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

data class CacheSnapshot(val entries: Set<String>)

fun main() = runBlocking {
    val state = MutableStateFlow(CacheSnapshot(emptySet()))
    val seen = mutableListOf<CacheSnapshot>()
    val observed = Channel<Unit>(Channel.RENDEZVOUS)
    val collector = launch {
        state.take(3).collect { snapshot ->
            seen += snapshot
            observed.send(Unit)
        }
    }
    observed.receive()
    state.value = CacheSnapshot(setOf("alpha"))
    observed.receive()
    state.value = CacheSnapshot(setOf("alpha"))
    state.value = CacheSnapshot(setOf("alpha", "beta"))
    observed.receive()
    collector.join()
    println(seen.map { it.entries.size }.joinToString(","))
}
```

## Java comparison

Java code can read a volatile or atomic reference, but Flow collection is a separate change-notification contract. A StateFlow reference crossing a Java boundary still needs an explicit Java-facing adapter if Java callers must consume it.

## Common mistakes

Using StateFlow as an event log, assuming every collector sees every intermediate assignment, exposing a MutableStateFlow that callers can modify, or mutating an object already stored in the flow. Calling `state.value = state.value.copy(...)` from concurrent writers can lose updates even though each property access is thread-safe.

## Decision guidance

Use StateFlow for a current snapshot when a late subscriber should immediately know the latest value and missing intermediate snapshots is acceptable. Use a sealed or otherwise explicit state model instead of overloading null or exceptions. Use `update` for a single atomic snapshot transformation, and protect larger invariants with a Mutex or a single state owner.

## Knowledge check

Will a new collector receive every StateFlow update made before it subscribed? No. It first receives the current value; intermediate history is not retained.

## Connections

[Cold Flow](#flow-cold-lifecycle) reruns its producer per collector; [SharedFlow](#shared-flow-events) supports configurable broadcast replay; [shared-state coordination](#shared-state-synchronization) addresses invariants that span more than one atomic snapshot.

## Interview question

A service exposes order status through MutableStateFlow. Explain what a late subscriber sees, whether updates can be skipped, and how concurrent handlers should change a snapshot without losing an update.

## Essential points

- StateFlow requires an initial/current value and replays the latest snapshot.
- Equal values are suppressed and a slow collector may skip intermediate snapshots.
- The flow is hot, thread-safe, and does not complete or carry failure separately.
- Use atomic update for a single snapshot and a stronger coordination mechanism for compound invariants.

## Trade-offs

StateFlow makes current state cheap to read and simple to observe, while intentionally discarding history. Immutable snapshots clarify ownership but allocate replacement values. A history requirement needs a separate event log or durable store.

## Common traps

Expecting exactly-once event delivery from a conflated state holder; performing side effects inside an update lambda; and confusing a thread-safe value property with a transaction over several mutable objects.

## Follow-up probes

When can StateFlow suppress a value? What does a late collector receive? Which state transitions belong in an immutable sealed model? Why must an update lambda be safe to retry?

## Sources

- [StateFlow API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/)
- [MutableStateFlow API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-mutable-state-flow/)
- [Kotlin Flows guide](https://kotlinlang.org/docs/coroutines-flow.html)
