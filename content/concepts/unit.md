---
id: unit
title: Unit as a real result type
profile: substantial
category: type-system
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [functions]
relatedIds: [any, nothing]
aliases: [Unit, void, side effect, no meaningful result]
---

## Overview

`Unit` is a type with one value, also named `Unit`. A function returning `Unit` completes normally without carrying domain information in its result.

## Why it matters to Java developers

`Unit` fills the role often associated with Java `void`, but it participates as an ordinary Kotlin type and value. That difference matters in function types and generics: an effectful callback can have type `() -> Unit` without a special “no type” hole.

## Mental model

Separate “the computation completed” from “the computation produced domain data.” `Unit` records the first fact with exactly one possible value. It does not mean the function did nothing.

## Semantics

If a block-bodied function has no explicit return type, Kotlin infers `Unit`. An explicit `return Unit` is normally unnecessary; `return` ends a `Unit` function. Because every successful call produces the same value, callers learn no additional domain fact from the result.

`Unit` and `Nothing` are opposites in control-flow reasoning: `Unit` means normal completion with one possible value, while a `Nothing` expression never completes normally.

## Example

The generic helper can collect the result of an effectful callback because `Unit` is a proper type. Both calls run; both result values are the singleton `Unit`.

```kotlin run id=type-unit-value file=UnitValue.kt main=UnitValueKt expected=2:true
fun record(log: MutableList<String>, value: String): Unit {
    log += value
}

fun <T> twice(action: () -> T): Pair<T, T> = action() to action()

fun main() {
    val log = mutableListOf<String>()
    val results: Pair<Unit, Unit> = twice { record(log, "saved") }
    println("${log.size}:${results.first === Unit}") // 2:true
}
```

## Java comparison

Java uses `void` for methods with no return value and `Void` as a reference type when an API demands one. Kotlin's `Unit` consistently supplies a type and a singleton value at the language level; JVM interop may expose ordinary `Unit` functions in the familiar void-shaped form.

## Common mistakes

Saying a `Unit` function returns nothing; assuming it is pure or side-effect free; using `Unit?` when success and absence really need a domain result; or confusing a completed `Unit` call with a `Nothing` expression that never returns.

## Decision guidance

Return `Unit` when callers only need completion or failure through the surrounding effect mechanism. Return a domain value when the outcome changes the caller's next decision. Use a modeled result rather than nullable `Unit` when multiple success or failure states deserve names.

## Knowledge check

Why can `() -> Unit` be passed through a generic `() -> T` API while Java `void` cannot be used as a generic type argument? `Unit` is an actual Kotlin type whose one value becomes `T`; `void` is not a Java reference type argument.

## Connections

[Functions](#functions) establish the return-type and function-type syntax. [Any](#any) is above `Unit` like every non-null type. [Nothing](#nothing) contrasts one successful value with no possible normally returned value.

## Interview question

An API changes a callback from `() -> Boolean` to `() -> Unit` and ignores the old result. Explain the semantic change, its effect on generic higher-order code, and when `Unit` is the honest contract.

## Essential points

- `Unit` is a type with one value and represents normal completion without domain data.
- A `Unit` callback can be used as a generic value-producing function.
- Dropping a previous result removes information callers may have used.
- Side effects and failure behavior remain part of the contract even when the result is `Unit`.

## Trade-offs

`Unit` keeps effect-only APIs simple. A domain result makes outcomes explicit but adds cases and handling. Silently discarding a meaningful value simplifies the signature at the cost of observability or control.

## Common traps

Describing `Unit` as absence of execution, treating it as Java's boxed `Void`, or using it where callers need to distinguish accepted, skipped, and rejected work.

## Follow-up probes

What does a block-bodied function infer when its return type is omitted? How would exceptions or a result type change the meaning of “completed”? Why is `Unit?` rarely a good two-state domain model?

## Sources

- [Kotlin specification: Unit](https://kotlinlang.org/spec/built-in-types-and-their-semantics.html#kotlinunit)
- [Kotlin documentation: Functions](https://kotlinlang.org/docs/functions.html)
- [Kotlin API: Unit](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin/-unit/)
