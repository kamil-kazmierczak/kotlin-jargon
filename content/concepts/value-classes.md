---
id: value-classes
title: Value classes and representation boundaries
profile: substantial
category: domain-modeling
depth: deep-dive
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-21
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-21
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-21
reviewReference: commit:3773fec1c9c5fd479b2f7975029b083abc710fcd
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [data-classes, any]
relatedIds: [jvm-execution, objects-and-companions]
aliases: [value class, inline value class, JvmInline, boxing wrapper, domain primitive]
---

## Overview

A JVM value class introduces a distinct Kotlin type around one underlying value while allowing the compiler to use the underlying representation in many call sites. It is a domain-typing tool with representation and interop caveats, not a universal allocation guarantee.

## Why it matters to Java developers

It resembles a tiny wrapper class in source but may compile to mangled methods using the underlying type, or to a wrapper where boxing is required. Java construction and calls therefore need explicit API planning.

## Mental model

Separate the semantic type from its physical representation. Kotlin type checking distinguishes `OrderId` from `String`; the JVM boundary may use either the underlying string or a generated wrapper depending on usage.

## Semantics

An `@JvmInline value class` has one primary-constructor property and is final. It can validate construction and implement interfaces but cannot hold additional backing fields. Direct uses are candidates for underlying representation; uses as a nullable type, interface, generic type, or another broad type require boxing. Referential equality is prohibited because representation identity is not stable.

## Example

```kotlin run id=domain-value-boxing file=ValueBoxing.kt main=ValueBoxingKt expected=true:true
@JvmInline
value class OrderId(val value: String) {
    init { require(value.isNotBlank()) }
}

fun widen(id: OrderId): Any = id

fun main() {
    val id = OrderId("A-7")
    println("${widen(id) is OrderId}:${id == OrderId("A-7")}")
}
```

Widening to `Any` crosses a boxing boundary. Value equality remains meaningful; wrapper identity does not.

## Java comparison

A normal Java wrapper has a consistently reference-shaped public API. Kotlin's default value-class lowering can make constructors and mangled methods awkward or unavailable from Java. On the Kotlin 2.4 baseline, experimental `@JvmExposeBoxed` or the corresponding compiler option can generate boxed Java-facing entry points, but adopting them creates a deliberate binary API.

## Common mistakes

Promising zero allocation, exposing a default-lowered value class to Java without compiling a consumer, using it where multiple fields define the invariant, or treating it as a type alias.

## Decision guidance

Choose a value class for a single-value domain distinction with useful validation and high Kotlin usage. Choose a data or ordinary class for multi-field state, stable object identity, or a conventional Java API. Measure allocation-sensitive code and test every public JVM boundary rather than reasoning only from source syntax.

## Knowledge check

Why can `OrderId?`, `Any`, or `List<OrderId>` allocate wrappers even though direct `OrderId` calls may not? Those contexts must preserve type/null/generic distinctions that the underlying representation alone cannot always carry.

## Connections

[Data classes](#data-classes) suit multi-property values. [Any](#any) is a boxing boundary in the example, [JVM execution](#jvm-execution) distinguishes source semantics from lowering, and [objects and companions](#objects-and-companions) covers explicit Java-facing bridges and factories.

## Interview question

Should a public order service replace every `String` ID with a value class when half its callers are Java? Defend a design that accounts for invariants, boxing, method mangling, and migration compatibility.

## Essential points

- A value class creates a distinct Kotlin type, unlike a type alias.
- Representation varies by usage; boxing is expected at nullable, generic, interface, and broad-type boundaries.
- Java accessibility and binary signatures must be designed and compiled, not guessed.

## Trade-offs

Domain-specific types prevent argument swaps and can avoid wrappers in common Kotlin paths. They add conversion and interop complexity, and experimental boxed exposure may constrain future API evolution.

## Common traps

Calling the class “always inline,” checking referential identity, or exposing the underlying primitive/string everywhere and thereby erasing the type-safety gain.

## Follow-up probes

Why are functions mangled? When is boxing unavoidable? How does a value class differ from a data class and a type alias?

## Sources

- [Kotlin documentation: Inline value classes](https://kotlinlang.org/docs/inline-classes.html)
- [Kotlin documentation: Calling Kotlin from Java](https://kotlinlang.org/docs/java-to-kotlin-interop.html#inline-value-classes)
- [Kotlin specification: Value class declaration](https://kotlinlang.org/spec/declarations.html#value-class-declaration)
