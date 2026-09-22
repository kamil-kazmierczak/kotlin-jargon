---
id: generic-constraints
title: Generic constraints and useful abstractions
profile: substantial
category: generics-abstraction
depth: core
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-22
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-22
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-22
reviewReference: commit:240c832b6954c4253b47924c6ca15b6484678dfa
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [functions, collection-interfaces, any]
relatedIds: [declaration-site-variance, type-projections, generic-runtime-types]
aliases: [generic function, type parameter, upper bound, where clause, invariant generic]
---

## Overview

A type parameter lets one declaration preserve relationships among types chosen by each caller. An upper bound states the operations every permitted type supplies. Good generic API design preserves useful type information while requiring only the capabilities the implementation actually needs.

## Why it matters to Java developers

Kotlin's `<T : Bound>` and `where` constraints play the role of Java upper bounds, with `:` where Java writes `extends`. Kotlin inference often removes call-site noise, but it does not change the design question: which values must share one type, and which capabilities must that type guarantee?

## Mental model

Treat `T` as one unknown but fixed type for a call. A constraint narrows the set of legal substitutions and grants operations inside the generic body. It does not discover a concrete runtime type, copy an object, or make two different type arguments interchangeable.

## Semantics

An unconstrained type parameter has the nullable upper bound `Any?`. `T : Any` excludes null. One bound can follow the type parameter; multiple bounds use `where`, and the chosen type must satisfy all of them. Type inference solves constraints from arguments and expected results. A generic class is invariant unless its declaration says `out` or `in`, because a type that both accepts and returns `T` cannot safely vary in either direction.

## Example

```kotlin run id=generics-bounded-selection file=BoundedSelection.kt main=BoundedSelectionKt expected=OPS-9:9
interface Identified { val id: String }

data class Ticket(override val id: String, val priority: Int) :
    Identified, Comparable<Ticket> {
    override fun compareTo(other: Ticket): Int = priority.compareTo(other.priority)
}

fun <T> highest(values: List<T>): T where T : Identified, T : Comparable<T> =
    values.maxOrNull() ?: error("at least one value is required")

fun main() {
    val selected = highest(listOf(Ticket("OPS-2", 2), Ticket("OPS-9", 9)))
    println("${selected.id}:${selected.priority}")
    // OPS-9:9
}
```

The function preserves `Ticket` as its result type. Its two bounds permit `id` and comparison, but no Ticket-specific operation. The nonempty requirement is a value-level contract and therefore still needs explicit handling; a type bound cannot prove list size.

## Java comparison

The corresponding Java shape uses `<T extends Identified & Comparable<T>>`. Both languages enforce bounds at compile time and usually erase the chosen argument at runtime. Kotlin's default bound is nullable `Any?`, which matters when an implementation needs non-null `Any` operations or a Java generic boundary has uncertain nullability.

## Common mistakes

Returning `Any` and forcing callers to cast when a type parameter could preserve the relationship; adding a concrete base class merely to access one operation; confusing a bound with a runtime test; assuming `MutableList<Dog>` is a subtype of `MutableList<Animal>`; or using a generic type when a closed sealed model would express the variants more honestly.

## Decision guidance

Introduce a type parameter when multiple positions must use the same caller-chosen type or when the result type depends on an input type. Add the smallest meaningful bound. Prefer a domain interface for a real shared capability, a function parameter for one local operation, and a sealed hierarchy when the alternatives are intentionally closed. Keep mutable producer-and-consumer containers invariant.

## Knowledge check

Why does `<T : Comparable<T>>` permit comparison but not prove that `T` is present at runtime? The bound is a compile-time substitution rule. Ordinary type parameters are erased, and the function must still handle value-level facts such as an empty input.

## Connections

[Functions](#functions) supply generic declarations and inference sites. [Collection interfaces](#collection-interfaces) show why mutable ownership and invariant element positions matter. [Any](#any) explains the default broad nullable bound. [Declaration-site variance](#declaration-site-variance) changes safe substitutability, while [runtime generic types](#generic-runtime-types) cover erasure.

## Interview question

Design a function that selects the highest-priority identified value while returning the caller's exact type. State its bounds, empty-input policy, and why neither `Any` nor a cast-based result is an adequate design.

## Essential points

- `T` preserves a relationship among input and result positions.
- Bounds grant compile-time capabilities and should be no broader than necessary.
- Multiple bounds use `where`; all must be satisfied by one chosen type.
- Value-level invariants and runtime type evidence are separate concerns.

## Trade-offs

Generics preserve reusable static information but can make signatures harder to read. A narrow interface bound gives a stable vocabulary; a behavior parameter can avoid coupling for a one-off operation. More bounds make implementation easier while excluding callers and increasing abstraction weight.

## Common traps

Saying inference makes the API dynamically typed, treating a bound as a runtime classifier, adding bounds for implementation convenience, or using recursive bounds without explaining the operation they enable.

## Follow-up probes

When would a comparator parameter be better than `Comparable<T>`? Why is the default bound `Any?` relevant? How would an empty-result type change the signature?

## Sources

- [Kotlin documentation: Generics and generic constraints](https://kotlinlang.org/docs/generics.html)
- [Kotlin specification: Declarations with type parameters](https://kotlinlang.org/spec/declarations.html#declarations-with-type-parameters)
