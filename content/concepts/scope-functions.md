---
id: scope-functions
title: Scope functions by receiver and result
profile: substantial
category: functions-idioms
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [lambdas-higher-order-functions, extensions-receivers]
relatedIds: [nullable-types, initialization, inline-reified-functions]
aliases: [let, run, with, apply, also, scope function]
---

## Overview

Kotlin's scope functions execute a block around an object. Their useful differences are not their names but two design choices: whether the object is available as a receiver (`this`) or an argument (`it`), and whether the call returns the block result or the original object.

## Why it matters to Java developers

Java code often spells the same patterns with a temporary variable, builder calls, or a utility callback. Scope functions can keep a short operation local, but a chain of similar-looking calls may hide which value continues through the expression. Explicit Java-style local variables remain a good Kotlin choice when they make state and control flow clearer.

## Mental model

Use a two-by-two grid. `let` uses `it` and returns the lambda result; `run` uses `this` and returns the lambda result; `also` uses `it` and returns the receiver; `apply` uses `this` and returns the receiver. `with(value)` uses `this` and returns the lambda result but is not called as an extension.

## Semantics

All five functions execute their block immediately in the ordinary call. `let` and `also` provide the context object as a lambda argument. `run`, `apply`, and `with` provide an implicit receiver. `let`, `run`, and `with` return the block's final expression; `apply` and `also` return the context object. The functions do not themselves make mutation, null handling, or chaining safe: those properties come from the receiver, the surrounding safe call, and the block.

## Example

```kotlin run id=functions-scope-results file=ScopeResults.kt main=ScopeResultsKt expected=true:true:3:ADA
data class Draft(var name: String)

fun main() {
    val draft = Draft(" ")
    val configured = draft.apply { name = "Ada" }
    val observed = draft.also { require(it.name.isNotBlank()) }
    val length = draft.run { name.length }
    val upper = draft.let { it.name.uppercase() }

    println("${configured === draft}:${observed === draft}:$length:$upper")
    // true:true:3:ADA
}
```

`apply` and `also` return the same `Draft`; `run` and `let` return the block results. The example demonstrates identity and result selection, not a recommendation to chain all four in production code.

## Java comparison

An explicit Java local such as `Draft draft = new Draft(); draft.setName("Ada");` makes the continuing value obvious. Kotlin's `apply` can compress that initialization when receiver members are unambiguous. Java's `Optional.map` is not a general equivalent of `let`: `let` always invokes its block when called, while null-conditional behavior comes from `value?.let { ... }`.

## Common mistakes

Memorizing names without tracking the returned value, using nested receiver blocks where `this` is unclear, assuming `let` means “only when non-null” without a safe call, using `also` for a transformation whose result is discarded, or forcing a long chain when local variables would expose the phases.

## Decision guidance

First decide whether a scope function improves locality at all. Choose argument form (`let` or `also`) when naming the value aids clarity or outer receivers are present. Choose receiver form (`run`, `apply`, or `with`) for a short cluster of unambiguous member operations. Then choose lambda result (`let`, `run`, `with`) versus original receiver (`also`, `apply`). Break a chain when effects, type changes, or receiver resolution require mental backtracking.

## Knowledge check

You must configure a new object and continue with that same object: which result category fits? Receiver-returning `apply` usually fits if `this` stays clear. To compute and continue with a different value, choose a block-result function such as `let` or `run` based on whether an argument name or receiver reads better.

## Connections

[Extensions and receivers](#extensions-receivers) explain implicit receiver lookup. [Nullable types](#nullable-types) explain why `?.let` is conditional, while [initialization](#initialization) helps distinguish concise configuration from unsafe partially initialized state.

## Interview question

Review a chain containing `?.let`, `apply`, and `also` that validates, mutates, logs, and maps a request. Explain every receiver and return value, then rewrite it for readability and defend which scope functions remain.

## Essential points

- Select by receiver representation (`this` or `it`) and return value (block result or receiver).
- Null-conditional execution comes from `?.`, not from `let` itself.
- Scope functions are optional readability tools, not a target style or correctness mechanism.

## Trade-offs

Scope functions reduce temporary naming and keep nearby work together. They can hide type transitions, mutation, and effects, particularly when nested. Explicit locals add lines but make each phase, value, and failure point easier to inspect.

## Common traps

Choosing by an English mnemonic alone, confusing `also` with a mapper, returning the receiver accidentally from `apply`, or allowing three implicit receivers to compete for the same unqualified member name.

## Follow-up probes

When is `with` preferable to `run`? How does `?.let` differ from `let` on a nullable value? Where would you split a fluent chain during debugging or review?

## Sources

- [Kotlin documentation: Scope functions](https://kotlinlang.org/docs/scope-functions.html)
- [Kotlin documentation: Higher-order functions and lambdas](https://kotlinlang.org/docs/lambdas.html)
- [Kotlin documentation: Null safety](https://kotlinlang.org/docs/null-safety.html)
