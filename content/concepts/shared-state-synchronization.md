---
id: shared-state-synchronization
title: Coordinate shared mutable state
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
prerequisiteIds: [coroutine-context-dispatchers, coroutine-channels, immutability, collection-interfaces]
relatedIds: [state-flow-state, coroutine-ownership]
aliases: [shared mutable state, Mutex, thread confinement]
---

## Overview

Coroutines running on a multithreaded dispatcher have the same shared-state races as threads. Choose atomic operations, confinement, or mutual exclusion according to the invariant that must stay intact.

## Why it matters to Java developers

Kotlin coroutines do not make a mutable object safe just because only one coroutine was intended to use it. Dispatchers can execute coroutine segments in parallel on different threads, and suspension can expose interleavings even on one thread.

## Mental model

Name the invariant and every writer before choosing a primitive. An atomic variable protects one supported operation; it does not make a larger read-modify-write sequence atomic. Confinement gives one owner exclusive access. A Mutex protects a critical section when there is no natural single owner.

## Semantics

Use atomic classes for simple operations such as increment. Use coarse-grained confinement when all access can go through one dispatcher or owner coroutine; every read and write must follow that policy. A coroutine Channel can send commands to one owner, which processes them serially. `Mutex.withLock` suspends a contending coroutine instead of blocking its thread and releases the lock after the action. A Mutex is non-reentrant; keep the protected section short and do not call code that could try to acquire it again. StateFlow methods themselves are thread-safe, but separate mutable fields or read-modify-write code around them still need a complete invariant strategy. An immutable snapshot updated atomically is a good boundary for observable state.

## Example

Two reservations start together on a multithreaded dispatcher and each requests seven of ten units. The Mutex makes the check and decrement one critical section, so exactly one reservation succeeds.

```kotlin run id=streams-mutex-invariant file=MutexInvariant.kt main=MutexInvariantKt expected=1:3
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class Inventory(initialAvailable: Int) {
    private val mutex = Mutex()
    private var available = initialAvailable

    suspend fun reserve(amount: Int): Boolean = mutex.withLock {
        if (available < amount) false else {
            available -= amount
            true
        }
    }

    suspend fun remaining(): Int = mutex.withLock { available }
}

fun main() = runBlocking {
    val inventory = Inventory(10)
    val ready = Channel<Unit>(capacity = 2)
    val start = CompletableDeferred<Unit>()
    val results = Channel<Boolean>(capacity = 2)
    coroutineScope {
        repeat(2) {
            launch(Dispatchers.Default) {
                ready.send(Unit)
                start.await()
                results.send(inventory.reserve(7))
            }
        }
        repeat(2) { ready.receive() }
        start.complete(Unit)
        val successes = List(2) { results.receive() }.count { it }
        println(successes.toString() + ":" + inventory.remaining())
    }
}
```

## Java comparison

Java `synchronized` and locks also protect critical sections but block an executing thread when contended. Mutex.lock suspends. AtomicInteger corresponds to an atomic operation, not to a transaction across multiple fields.

## Common mistakes

Assuming `volatile` makes increment atomic, guarding writes but not reads with the same policy, accessing confined state from an unconfined caller, or placing arbitrary blocking work inside a critical section.

## Decision guidance

Prefer immutable state that is replaced atomically for snapshots. Use an atomic class for a single independent counter or reference operation. Confine a cohesive state machine to one owner when all commands can be serialized there. Use Mutex for a small compound transition shared by independent callers. If the operation needs durable consistency, in-process synchronization is not a replacement for a database transaction.

## Knowledge check

Does marking an integer volatile make `counter++` atomic? No. The read and write inside increment remain a compound operation that can interleave.

## Connections

[Coroutine context](#coroutine-context-dispatchers) explains where coroutine segments may execute; [Channel](#coroutine-channels) can send work to one state owner; [StateFlow](#state-flow-state) exposes a current snapshot but does not protect unrelated mutable state.

## Interview question

Two coroutines on Dispatchers.Default decrement a shared inventory after checking availability. Identify the race and compare an atomic counter, a Mutex, and one command-processing owner.

## Essential points

- Multithreaded coroutine execution permits ordinary data races.
- Atomic operations protect only the operation they provide.
- Confinement works only when every access follows the same owner or dispatcher.
- Mutex.withLock suspends contenders and protects a compound critical section.
- In-memory synchronization does not provide database or crash consistency.

## Trade-offs

Atomics are efficient for simple invariants. Confinement makes transitions easy to reason about but serializes work. Mutex permits independent callers while protecting a critical section, adding waiting and possible contention.

## Common traps

Using a thread-safe container for a multi-step business invariant; mixing confined and direct accesses; blocking inside a lock; and calling a mutex-protected method recursively from its own critical section.

## Follow-up probes

When is AtomicInteger enough? Why can coarse-grained confinement be more efficient than switching for each field access? What consistency boundary does a database transaction add?

## Sources

- [Shared mutable state and concurrency](https://kotlinlang.org/docs/shared-mutable-state-and-concurrency.html)
- [Mutex API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.sync/-mutex/)
- [StateFlow API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-state-flow/)
