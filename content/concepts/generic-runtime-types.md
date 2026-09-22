---
id: generic-runtime-types
title: Erased generic runtime types
profile: substantial
category: generics-abstraction
depth: deep-dive
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [type-projections, inline-reified-functions]
relatedIds: [platform-types, jvm-execution, smart-casts]
aliases: [type erasure, erased type, unchecked cast, reified alternative, runtime type information]
---

## Overview

Kotlin/JVM checks generic relationships at compile time, but ordinary objects generally do not retain their actual generic arguments for runtime tests. Code can test a classifier with a star projection, validate contents explicitly, accept a type token, or use a supported reified check. None of these makes nested generic arguments universally available.

## Why it matters to Java developers

The JVM erasure boundary is familiar from Java, but Kotlin makes illegal parameterized `is` checks explicit and combines star projections with inline reified parameters. Reification improves some Kotlin call sites; it is not a general replacement for Java class tokens or honest boundary validation.

## Mental model

Keep two ledgers. The compiler knows substitutions, bounds, variance, and projected capabilities while checking source. Runtime code sees classifiers and only the type evidence deliberately retained or generated. Never use a fact from the compile-time ledger to answer a runtime question without an explicit bridge.

## Semantics

At runtime, `List<String>` and `List<Int>` normally share the classifier `List`. Kotlin therefore permits `value is List<*>` but rejects `value is List<String>`. A cast to a parameterized type may be unchecked because the runtime cannot validate its arguments. An inline `reified T` can generate checks for a runtime-available `T`, but if `T` itself contains erased arguments, checks cannot prove those nested arguments. Arrays retain their component classifier only partially and do not restore nested generic information.

## Example

```kotlin run id=generics-erased-check file=ErasedCheck.kt main=ErasedCheckKt expected=list:2:String
fun describe(value: Any): String = when (value) {
    is List<*> -> "list:${value.size}:${value.firstOrNull()?.let { it::class.simpleName }}"
    else -> "other"
}

fun main() = println(describe(listOf("a", "b")))
```

The check proves only `List<*>`. Each element is `Any?`; observing that one element is a String does not prove the entire erased argument was `String`.

```kotlin run id=generics-reified-alternative file=ReifiedAlternative.kt main=ReifiedAlternativeKt expected=true:false
inline fun <reified T> Iterable<*>.allValuesAre(): Boolean = all { it is T }

fun main() {
    println("${listOf("a", "b").allValuesAre<String>()}:${listOf("a", 2).allValuesAre<String>()}")
}
```

This validates every element against the runtime-available classifier for `String`. Calling `allValuesAre<List<String>>()` could establish only that elements are lists, not that their own erased elements are strings.

```kotlin run id=generics-variant-api file=VariantApi.kt main=VariantApiKt expected=invoice:42|failed:timeout
sealed interface Result<out T> {
    data class Success<T>(val value: T) : Result<T>
    data class Failure(val reason: String) : Result<Nothing>
}

fun interface Renderer<in T> { fun render(value: T): String }

fun <T> display(result: Result<T>, renderer: Renderer<T>): String = when (result) {
    is Result.Success -> renderer.render(result.value)
    is Result.Failure -> "failed:${result.reason}"
}

fun main() {
    val invoice: Result<Int> = Result.Success(42)
    val broadRenderer: Renderer<Any> = Renderer { "invoice:$it" }
    println("${display(invoice, broadRenderer)}|${display(Result.Failure("timeout"), broadRenderer)}")
}
```

The variant is type-safe without inspecting a parameterized runtime type. `Result` produces its payload, `Renderer` consumes it, and `Failure` uses `Nothing` so it fits every result type. At runtime the `when` distinguishes only the concrete variant classifiers; the success value remains connected to `T` by the checked generic API.

## Java comparison

Java has the same erased limit and commonly accepts `Class<T>` for runtime evidence. Kotlin reified helpers need inline call sites and do not provide a normal Java call with a reified argument, so a cross-language library often keeps a token-based core. Kotlin declaration-site variance may also produce or suppress Java wildcards according to signature position; that generated surface belongs to explicit interoperability review.

## Common mistakes

Writing or imagining `value is List<String>`; suppressing an unchecked cast without validating every element or controlling the producer; claiming reified types defeat all erasure; assuming array checks validate nested arguments; using reflection when a sealed variant or typed boundary removes the runtime question; or exposing only a reified function to Java clients.

## Decision guidance

Keep generic work compile-time typed whenever possible. Use `is Container<*>` for safe structural inspection, validate contents before centralizing a necessary cast, and accept `Class<T>` or `KClass<T>` when runtime evidence is part of a reusable or Java-facing contract. Add a reified wrapper for Kotlin ergonomics only when its supported checks and inline API costs are appropriate.

## Knowledge check

Can `reified T` prove that an arbitrary value is `List<String>`? Not in general. If `T` is `List<String>`, the list classifier is runtime-available but its nested String argument is still erased; validate elements or preserve stronger evidence at the boundary.

## Connections

[Type projections](#type-projections) explain the `*` that keeps erased classifier checks safe. [Inline and reified functions](#inline-reified-functions) explain call-site generation and API costs. [Platform types](#platform-types) are a related Java boundary where nullability and generic evidence both need normalization, while [JVM execution](#jvm-execution) locates erasure in the runtime model.

## Interview question

An API accepts `Any` and casts it to `List<Order>` after checking `is List<*>`. Diagnose the unsound step, redesign the boundary with validation or a type token, and explain precisely what a reified helper can and cannot prove.

## Essential points

- Compile-time generic substitutability is separate from runtime type availability.
- Star-projected classifier checks are legal but do not prove an actual argument.
- Unchecked casts require a separately enforced invariant and a narrow trust boundary.
- Reified checks support runtime-available types, not arbitrary nested generic arguments.

## Trade-offs

Explicit validation costs a traversal but turns uncertain data into a checked invariant. Type tokens make runtime needs visible and work across Java boundaries. Reified wrappers improve Kotlin syntax while adding inline coupling and limited evidence. Avoiding the runtime question through typed variants is often simplest.

## Common traps

Equating a successful classifier check with verified contents, suppressing warnings globally, or describing reification as storing every type argument inside each object.

## Follow-up probes

When is a localized unchecked cast defensible? What changes for arrays? How would you expose the same operation to Java and test malformed input?

## Sources

- [Kotlin documentation: Generics type checks and casts](https://kotlinlang.org/docs/generics.html#generics-type-checks-and-casts)
- [Kotlin specification: Runtime type information](https://kotlinlang.org/spec/rtti.html)
- [Kotlin documentation: Calling Java from Kotlin—generics](https://kotlinlang.org/docs/java-interop.html#java-generics-in-kotlin)
