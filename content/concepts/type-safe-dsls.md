---
id: type-safe-dsls
title: Type-safe builders and DSL receiver scope
profile: substantial
category: advanced-kotlin
depth: deep-dive
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
baseline: kotlin-jvm-2026-09
publishedAt: 2026-09-24
verifiedAt: 2026-09-24
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-24
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [extensions-receivers, lambdas-higher-order-functions]
relatedIds: [custom-contracts, annotation-processing-boundaries]
aliases: [DSL builder, @DslMarker, lambda with receiver, nested receiver]
---

## Overview

A type-safe builder turns a nested configuration into Kotlin calls with receivers. It is useful when many related declarations need a readable, constrained structure.

## Why it matters to Java developers

It resembles a fluent Java builder, but implicit receivers can expose outer methods inside nested blocks. That convenience can also make mistakes hard to spot.

## Mental model

The builder is ordinary code running in a receiver scope. `@DslMarker` limits which implicit receivers participate in lookup; it does not validate domain rules.

## Semantics

A function parameter of type `RouteBuilder.() -> Unit` runs with a receiver, so calls inside the lambda can omit `this`. Nested receivers are normally available implicitly. Annotating builder types with one `@DslMarker` makes only the nearest marked receiver implicit; explicitly qualified access is still possible. This is Kotlin language receiver resolution, not a magic parser. A builder must still check duplicate names, missing handlers, and ownership of mutable state. The pinned JVM example uses only stable receiver and DSL-marker features; it does not depend on Kotlin 2.4 experimental context arguments.

## Example

The nested `group` block has a second marked receiver. Its `post` call resolves on `GroupBuilder`; an unqualified `get` inside that block would be rejected because it belongs to the outer marked `RouteBuilder`. The returned list is a detached snapshot, so later builder changes cannot alter it.

```kotlin run id=advanced-dsl file=Routes.kt main=RoutesKt expected=GET:/health,POST:/orders
@DslMarker
annotation class RouteDsl

@RouteDsl
class RouteBuilder {
    private val entries = mutableListOf<String>()
    fun get(path: String) { entries += "GET:$path" }
    fun group(prefix: String, block: GroupBuilder.() -> Unit) {
        GroupBuilder(prefix, entries).block()
    }
    fun build(): List<String> = entries.toList()
}

@RouteDsl
class GroupBuilder(private val prefix: String, private val entries: MutableList<String>) {
    fun post(path: String) { entries += "POST:$prefix$path" }
}

fun routes(block: RouteBuilder.() -> Unit): List<String> =
    RouteBuilder().apply(block).build()

fun main() {
    val configured = routes {
        get("/health")
        group("/orders") {
            post("")
            // get("/wrong") would require an explicit outer receiver.
        }
    }
    println(configured.joinToString(",")) // GET:/health,POST:/orders
}
```

## Java comparison

Java fluent builders usually name the builder object at each call. Kotlin receiver lambdas save that repetition but make receiver ownership part of API design.

## Common mistakes

Adding a DSL for two calls, assuming `@DslMarker` checks runtime uniqueness, or returning the builder's mutable list directly.

## Decision guidance

Use a regular constructor or explicit builder for a small fixed shape. A DSL earns its complexity when nested syntax materially clarifies many valid configurations and validation has one owner. Add a marker when nested builders of the same language could call the wrong outer receiver.

## Knowledge check

Does `@DslMarker` prevent an explicitly qualified outer receiver call? No. It controls implicit receiver lookup.

## Connections

[Extensions and receivers](#extensions-receivers) explain lookup; [lambdas](#lambdas-higher-order-functions) explain callback execution; [immutability](#immutability) explains why the builder returns a snapshot.

## Interview question

A routing DSL allows an inner route block to call a server-level method by accident. What does a DSL marker fix, and what must the builder still validate?

## Essential points

- Name the receiver lambda and its runtime execution.
- Explain the nearest-marked-receiver rule and its limit.
- Validate domain invariants and snapshot mutable builder state.

## Trade-offs

Readable nested syntax can reduce repetition, but introduces receiver lookup and hidden mutation. A plain API is often easier for Java callers and tooling.

## Common traps

Confusing scope restriction with access control, or claiming the DSL enforces invariants solely through types.

## Follow-up probes

How would you support Java callers? How would you reject duplicate routes? When would an ordinary data class be clearer?

## Sources

- [Kotlin documentation: Type-safe builders](https://kotlinlang.org/docs/type-safe-builders.html)
- [Kotlin documentation: DSL markers](https://kotlinlang.org/docs/type-safe-builders.html#scope-control-dslmarker)
