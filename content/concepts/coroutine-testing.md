---
id: coroutine-testing
title: Test coroutine and Flow contracts
profile: substantial
category: streams-concurrency
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [coroutine-ownership, coroutine-cancellation, flow-backpressure]
relatedIds: [flow-cold-lifecycle, state-flow-state, shared-flow-events, coroutine-channels]
aliases: [kotlinx-coroutines-test, runTest, TestCoroutineScheduler, backgroundScope]
---

## Overview

The kotlinx-coroutines-test library provides `runTest` and a virtual-time scheduler for deterministic tests of suspending code and time-dependent Flow behavior.

## Why it matters to Java developers

Tests that wait with wall-clock sleeps are slow and can fail under machine load. A test coroutine scheduler controls delays without waiting for real time and gives the test explicit points to run scheduled work.

## Mental model

Control three things separately: virtual time, task scheduling, and readiness handshakes. Advancing time makes delayed work eligible; `runCurrent` executes work scheduled at the current time. A Channel, deferred value, or explicit signal can prove a collector has started before a test emits. Virtual time is not a substitute for a concurrency stress test.

## Semantics

`runTest` creates a test scope and scheduler, skips delays scheduled on test dispatchers, reports uncaught child failures, and times out a test that hangs. The standard test dispatcher queues launched work until the test suspends or the scheduler is advanced. `advanceTimeBy` moves virtual time; `runCurrent` runs work at the current point; `advanceUntilIdle` advances until ordinary queued work is drained. Long-lived jobs belong in `backgroundScope`, which is cancelled when the test finishes and does not keep advanceUntilIdle running forever. Work dispatched to a real dispatcher that does not share the TestCoroutineScheduler does not have its delay skipped. The test dispatcher normally executes test work on one thread, so it does not prove behavior under simultaneous thread execution.

## Example

The test advances one second, runs work scheduled at that virtual instant, then advances to completion. No wall-clock wait is needed.

```kotlin run id=streams-run-test file=RunTestExample.kt main=RunTestExampleKt expected=loaded/loaded,stored
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlin.time.Duration.Companion.seconds

fun main() = runTest {
    val events = mutableListOf<String>()
    val job = launch {
        delay(1.seconds)
        events += "loaded"
        delay(2.seconds)
        events += "stored"
    }

    advanceTimeBy(1.seconds)
    runCurrent()
    val afterFirstDelay = events.toList()
    advanceTimeBy(2.seconds)
    runCurrent()
    job.join()
    println(afterFirstDelay.joinToString(",") + "/" + events.joinToString(","))
}
```

## Java comparison

Java tests often use a fake Clock or manually completed future to control time and readiness. Coroutine tests add a scheduler for coroutine delay and dispatch, but code using an uninjected real executor still runs outside that virtual clock.

## Common mistakes

Using deprecated `runBlockingTest` APIs, relying on Thread.sleep, expecting launched work to run eagerly under StandardTestDispatcher, or assuming advanceUntilIdle can finish an infinite collector launched in the test scope. A test can also pass without checking that a hot-flow subscriber was registered before emission.

## Decision guidance

Inject dispatchers into time-sensitive components so tests can use a shared TestCoroutineScheduler. Advance virtual time for timeouts, retries, debounce, or scheduled emissions. Use explicit handshakes for subscription and cancellation order. Put intentionally long-lived work in backgroundScope. Test thread safety separately with actual concurrent dispatchers and completion barriers, without asserting a particular interleaving.

## Knowledge check

Does `runTest` make a delay on Dispatchers.Default virtual? No. A dispatcher not using the test scheduler executes its delay in real time.

## Connections

[Flow lifetime](#flow-cold-lifecycle), [hot streams](#shared-flow-events), and [backpressure](#flow-backpressure) define what the test should observe; [ownership](#coroutine-ownership) and [cancellation](#coroutine-cancellation) define which Jobs the test must finish or cancel.

## Interview question

A Flow test sometimes misses the first SharedFlow event and occasionally takes several seconds. Redesign the test around an explicit subscription handshake and virtual time, then identify what still needs a real concurrency test.

## Essential points

- Use runTest and TestCoroutineScheduler to control delays and queued work.
- runCurrent and advanceTimeBy control which scheduled work has executed.
- Handshakes establish collector and worker readiness; sleeps do not.
- Use backgroundScope for background work that should end with the test.
- Real dispatchers outside the test scheduler and true parallelism need separate handling.

## Trade-offs

Virtual time makes timing claims fast and repeatable, but the scheduler controls only code that uses it. Single-threaded tests simplify ordering while leaving thread races untested. Handshakes make readiness explicit but require a meaningful signal in the API or test seam.

## Common traps

Using legacy test APIs with subtly different scheduler behavior; asserting before queued work runs; treating a flow collector as subscribed merely because its Job was launched; and using a stress loop with wall-clock sleeps as a deterministic test.

## Follow-up probes

When does advanceUntilIdle stop for backgroundScope jobs? Why might a delay still take real time? How do you prove that a SharedFlow collector is ready before calling emit?

## Sources

- [kotlinx-coroutines-test API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/)
- [runTest API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/kotlinx.coroutines.test/run-test.html)
- [backgroundScope API](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/kotlinx.coroutines.test/-test-scope/background-scope.html)
