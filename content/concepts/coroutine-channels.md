---
id: coroutine-channels
title: Channels for point-to-point work
profile: substantial
category: streams-concurrency
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [coroutine-ownership, flow-backpressure, generic-constraints]
relatedIds: [shared-flow-events, shared-state-synchronization]
aliases: [Channel, rendezvous channel, worker queue]
---

## Overview

A Channel is a coroutine communication primitive with suspending send and receive operations. Multiple senders can place values in it; each element is received by one consumer.

## Why it matters to Java developers

A Channel can resemble a BlockingQueue, but sending to or receiving from a coroutine Channel suspends instead of blocking a thread. Capacity and overflow policy decide how producers interact with slow workers.

## Mental model

Treat a Channel as an owned in-memory queue or handoff. Draw the producer, the receiving workers, the capacity, and the component responsible for closing or cancelling the Channel. If every worker should see every value, a Channel is the wrong delivery shape; use broadcast. If a job must survive a process crash, use durable storage or a broker.

## Semantics

`Channel<T>` is both a SendChannel and a ReceiveChannel; expose only the side each component needs. Capacity zero is a rendezvous: send waits for a receiver. A positive capacity permits a bounded backlog; unlimited capacity never backpressures the sender and can grow memory use. Closing a Channel says no more elements will be sent; buffered elements can still be received before iteration completes. A Channel is not automatically tied to a coroutine owner, so its lifecycle must be explicit. Send and receive are cancellable. When transferring closeable resources, account for cancellation or overflow that can leave an element undelivered.

## Example

Two workers compete for three jobs. Each job is processed once, and sorting the results makes the output independent of which worker receives first.

```kotlin run id=streams-channel-workers file=ChannelWorkers.kt main=ChannelWorkersKt expected=10,20,30
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val work = Channel<Int>(capacity = 1)
    val completed = Channel<Int>(capacity = 3)
    coroutineScope {
        repeat(2) {
            launch {
                for (item in work) completed.send(item * 10)
            }
        }
        listOf(1, 2, 3).forEach { work.send(it) }
        work.close()
        val results = List(3) { completed.receive() }.sorted()
        println(results.joinToString(","))
    }
}
```

## Java comparison

`BlockingQueue.take` blocks its Java thread while waiting. Channel receive suspends its coroutine, allowing the worker thread to run other work. Neither queue alone persists accepted work when the process exits.

## Common mistakes

Using a Channel when every subscriber must receive every event, choosing unlimited capacity without a memory plan, leaving a long-lived Channel without a close owner, or assuming Channel send means a remote or durable consumer committed the work.

## Decision guidance

Use a Channel for in-process handoff or work distribution when each item should be handled by one receiver and a coroutine owner can bound the queue's lifetime. Choose rendezvous or a small explicit capacity to apply backpressure. Use SharedFlow for in-process broadcast. Persist first when accepted work needs recovery after restart; consider a durable broker for cross-process delivery.

## Knowledge check

If three workers receive from the same Channel, does each worker see every item? No. A successfully received item goes to one receiving worker.

## Connections

[SharedFlow](#shared-flow-events) broadcasts to active subscribers; [backpressure](#flow-backpressure) frames the capacity and overflow choice; [shared-state coordination](#shared-state-synchronization) explains when a single channel owner can simplify mutation.

## Interview question

A service launches four workers to process exports. Explain whether Channel, SharedFlow, or StateFlow fits, what happens at capacity, and which component closes the queue during shutdown.

## Essential points

- Channel send and receive suspend rather than block a thread.
- Each element is handed to one receiving consumer, not broadcast.
- Capacity sets rendezvous, bounded backlog, or potentially unbounded memory.
- Closing stops future sends while allowing buffered values to drain.
- An in-memory Channel does not provide process-crash durability.

## Trade-offs

Channels express ownership transfer and worker distribution directly. Bounded capacity limits memory and pushes pressure to producers. A single owner can simplify mutable state, but the owner can become a throughput bottleneck and must be supervised and shut down.

## Common traps

Equating a Channel with a Flow broadcast; using UNLIMITED as a substitute for load management; and calling an item delivered merely because send returned without defining what processing completion means.

## Follow-up probes

What happens when a rendezvous sender has no receiver? How does close differ from cancel? How should a transferred file handle be cleaned up if a receiver is cancelled?

## Sources

- [Channel API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/-channel/)
- [Channel factory API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.channels/channel.html)
- [Kotlin Flows guide](https://kotlinlang.org/docs/coroutines-flow.html)
