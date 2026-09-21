---
id: nothing
title: Nothing and non-returning control flow
profile: substantial
category: type-system
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [expressions-control-flow]
relatedIds: [nullable-types, smart-casts, any, unit, platform-types]
aliases: [Nothing, bottom type, never returns, throw expression, Nothing?]
---

## Overview

`Nothing` is Kotlin's bottom type: it has no values and is a subtype of every well-formed Kotlin type. An expression of type `Nothing` cannot complete normally.

## Why it matters to Java developers

Java methods can always throw, but their declared return type does not usually express “this path never returns.” Kotlin uses `Nothing` to make throwing helpers, infinite computations, and control-flow exits compose precisely with expressions such as `when` and Elvis.

## Mental model

Do not imagine a special object being returned. Imagine an edge disappearing from the normal control-flow graph. Since that branch produces no value, it cannot contradict the result type produced by branches that do return.

## Semantics

No runtime value has type `Nothing`. A function declared `Nothing` must not return normally; it can throw or run forever. `throw` is an expression of type `Nothing`, which is why `value ?: error("missing")` can have the non-null type of `value`.

`Nothing?` is different: its only possible value is `null`, and it is the bottom of the nullable type universe. Inferred empty or always-throwing expressions sometimes expose these bottom types, but public APIs should normally state the domain type callers need.

## Example

The rejection branch has type `Nothing`, so the whole `when` still returns `String`.

```kotlin run id=type-nothing-flow file=NothingFlow.kt main=NothingFlowKt expected=Anonymous|Ada|invalid:Int
fun reject(value: Any?): Nothing =
    throw IllegalArgumentException("invalid:${value?.let { it::class.simpleName }}")

fun label(value: Any?): String = when (value) {
    null -> "Anonymous"
    is String -> value.trim().ifEmpty { "Anonymous" }
    else -> reject(value)
}

fun main() {
    val failure = try { label(7) } catch (error: IllegalArgumentException) { error.message }
    println("${label(null)}|${label(" Ada ")}|$failure")
}
```

### Group scenario: uncertain Java customer boundary

This complete example makes one observation of the unannotated Java result, normalizes it to `Any?`, refines it with stable checks, returns a deliberate fallback, and rejects a wrong runtime type. The `Unit` audit result is intentionally ignored; no branch uses `!!`.

```java run id=type-system-boundary file=LegacyCustomerApi.java main=TypeSystemBoundaryKt expected=Ada|Anonymous|Anonymous|invalid:Int order=java-first
public final class LegacyCustomerApi {
    public static Object lookup(String id) {
        return switch (id) {
            case "name" -> "  Ada  ";
            case "blank" -> "   ";
            case "missing" -> null;
            default -> 42;
        };
    }
}
```

```kotlin run id=type-system-boundary file=TypeSystemBoundary.kt main=TypeSystemBoundaryKt expected=Ada|Anonymous|Anonymous|invalid:Int order=java-first
fun rejectBoundary(value: Any?): Nothing =
    throw IllegalArgumentException("invalid:${value?.let { it::class.simpleName }}")

fun normalizeCustomerName(value: Any?): String = when (value) {
    null -> "Anonymous"
    is String -> value.trim().takeIf { it.isNotEmpty() } ?: "Anonymous"
    else -> rejectBoundary(value)
}

fun auditCustomerName(label: String): Unit {
    check(label.isNotBlank())
}

fun displayName(id: String): String {
    val uncertain: Any? = LegacyCustomerApi.lookup(id)
    val label = normalizeCustomerName(uncertain)
    auditCustomerName(label)
    return label
}

fun main() {
    val invalid = try { displayName("wrong") } catch (error: IllegalArgumentException) { error.message }
    println("${displayName("name")}|${displayName("missing")}|${displayName("blank")}|$invalid")
}
```

## Java comparison

A Java helper declared to return `String` may throw on every path, but callers and flow analysis still see the declared `String` contract. Kotlin can declare the non-returning fact as `Nothing`, allowing surrounding expressions to keep their precise successful type.

## Common mistakes

Looking for a `Nothing` instance; confusing `Nothing` with `Unit`; exposing `List<Nothing>` when the public API should state its element type; or using a throwing helper where a recoverable domain result is required.

## Decision guidance

Use `Nothing` for helpers whose contract is genuinely non-returning. Prefer a typed result, nullable value, or exception translated at the boundary when failure is expected and recoverable. Give empty collections an explicit domain element type at public seams rather than relying on bottom-type inference.

## Knowledge check

Why can `val name: String = nullableName ?: reject(null)` compile? The left branch produces `String`; the rejection branch never produces a conflicting value, and `Nothing` is a subtype of `String`.

## Connections

[Control flow](#expressions-control-flow) establishes that `throw`, Elvis, and `when` are expressions. [Smart casts](#smart-casts) benefit when non-returning branches remove impossible paths. [Unit](#unit) completes normally with one value; `Nothing` never completes normally. [Platform types](#platform-types) motivate the group scenario but remain an interoperability association rather than a prerequisite for bottom-type reasoning.

## Interview question

A validation helper currently returns `Unit` and always throws on failure. When should it instead return `Nothing`, how does that change inference in an Elvis or `when`, and when would either exception-based design be the wrong API?

## Essential points

- `Nothing` has no values and marks a path that cannot return normally.
- Its bottom-type position lets a throwing branch compose with any successful result type.
- `Unit` means normal completion, so it cannot replace `Nothing` in the same flow proof.
- Expected recoverable outcomes usually deserve an explicit domain model rather than a non-returning helper.

## Trade-offs

A `Nothing` helper makes fatal control flow and inference precise but commits to abrupt completion. A result type adds handling while keeping failure inside ordinary control flow. Exceptions cross Java boundaries naturally but can hide expected cases from the signature.

## Common traps

Returning `Unit` from a helper described as non-returning, claiming `null` has type `Nothing`, or using bottom-type inference as a public API design.

## Follow-up probes

What is the only value of `Nothing?`? How does an infinite loop satisfy a `Nothing` contract? Why can an empty `listOf()` infer `List<Nothing>` in a context-free expression?

## Sources

- [Kotlin specification: Nothing](https://kotlinlang.org/spec/built-in-types-and-their-semantics.html#kotlinnothing)
- [Kotlin specification: Type-system bottom](https://kotlinlang.org/spec/type-system.html#kotlinnothing)
- [Kotlin documentation: Exceptions](https://kotlinlang.org/docs/exceptions.html#the-nothing-type)
