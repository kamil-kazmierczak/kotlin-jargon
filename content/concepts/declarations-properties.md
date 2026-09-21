---
id: declarations-properties
title: Declarations and properties
profile: substantial
category: execution-semantics
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-20
prerequisiteIds: [jvm-execution]
relatedIds: [basic-syntax, initialization]
aliases: [val, var, getter, setter, backing field, const]
---

## Overview

`val` prevents assigning a new value through that declaration; `var` permits assignment. A property is an access contract, so reading a `val` property can execute a getter and return a different result each time.

## Why it matters to Java developers

Translating every `val` into “immutable field” hides two different issues: the referenced object can mutate, and a property need not store a value at all.

## Mental model

Distinguish a local binding, an object's mutable state, and an accessor. Ask which one the declaration restricts before promising immutability to a caller.

## Semantics

A local `val` can be assigned once; its inferred type remains fixed. A `var` can be reassigned with values compatible with its declared or inferred type. A property may store state in a backing field or compute its value. A custom getter runs on access. In an accessor, `field` refers to the backing field when one exists.

`const val` is a more restrictive compile-time constant declaration, permitted at top level or in an object/companion with a primitive or String constant initializer. Ordinary `val` is not a promise of compile-time inlining.

## Example

```kotlin run id=core-properties file=Properties.kt main=PropertiesKt expected=1:2:2
class Counter {
    var count = 0
        private set
    val next: Int get() = ++count
}
fun main() {
    val counter = Counter()
    val first = counter.next
    val second = counter.next
    println("$first:$second:${counter.count}") // 1:2:2
}
```

The example deliberately uses a surprising getter to expose the contract. `next` is read-only to callers but changes state; an explicit `next()` function would communicate that effect better.

This complete counterexample verifies that inferred declarations do not change type when assigned again.

```kotlin compile-fails id=core-fixed-type file=FixedType.kt category=type-mismatch
fun incompatibleAssignment() {
    var attempts = 1
    attempts = "two"
}
```

## Java comparison

An ordinary Kotlin public `var` usually exposes Java getters and setters, with storage hidden. A private setter keeps the Kotlin public read contract while restricting mutation. A local `val` resembles a final local variable more closely than it resembles a deeply immutable object.

## Common mistakes

Assuming that `val` makes a mutable collection immutable, caching a computed property's first result without considering change, or writing `count = value` inside its own setter instead of updating `field`.

## Decision guidance

Use `val` by default for bindings. Prefer cheap, predictable property reads; use functions to announce expensive or state-changing work. Design object immutability separately from assignment restrictions.

## Knowledge check

Would making `counter` a `var` change the output? No: no reassignment occurs. Would replacing `get() = ++count` with an initializer change it? Yes: initialization evaluates once, so both reads would return 1 and count would be 1.

## Connections

This stays on the path because property access affects [initialization](#initialization) and [equality](#equality). The [basic syntax](#basic-syntax) reminder is available off the path.

## Interview question

A service exposes `val next` and a teammate caches it because “val cannot change.” Use this example to explain the bug and redesign the API.

## Essential points

- Predict `1:2:2` by counting getter executions.
- Separate reassignment of the local variable from mutation of the Counter instance.
- Propose `next()` for the effect and a stable read-only property for observation.

## Trade-offs

Computed properties can avoid stale derived state; explicit functions communicate cost or effects more clearly. Returning a mutable object through `val` may be intentional but needs an honest contract.

## Common traps

Equating no setter with no mutation, or assuming every property has backing storage.

## Follow-up probes

What Java methods would you expect for count? Why would copying a mutable reference into another `val` not create a snapshot?

## Sources

- [Kotlin documentation: Properties](https://kotlinlang.org/docs/properties.html)
- [Kotlin specification: Property declarations](https://kotlinlang.org/spec/declarations.html#property-declaration)
