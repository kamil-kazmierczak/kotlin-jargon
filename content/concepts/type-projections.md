---
id: type-projections
title: Use-site and star projections
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
prerequisiteIds: [declaration-site-variance, collection-interfaces]
relatedIds: [generic-runtime-types, generic-constraints]
aliases: [use-site projection, type projection, out projection, in projection, star projection, captured type]
---

## Overview

A use-site projection gives one restricted view of a generic type whose declaration cannot promise a single variance role. `out T` permits safe production, `in T` permits safe consumption, and `*` preserves an unknown argument's safe capabilities. A projection restricts operations; it does not convert the underlying object.

## Why it matters to Java developers

Kotlin projections solve many of the same boundary problems as Java `? extends`, `? super`, and unbounded `?`. Kotlin also has declaration-site variance, and its star projection is a safe unknown type argument rather than an invitation to use an unchecked raw type.

## Mental model

View a projection as a capability filter placed on one reference. An `out` view lets values come out at a known upper type but prevents unsafe writes. An `in` view accepts a known lower type but reads only as a broad nullable value. A star says the argument exists but this code does not know it.

## Semantics

Invariant types such as `Array<T>` and `MutableList<T>` both produce and consume `T`. At one boundary, `Array<out T>` exposes safe reads and `Array<in T>` exposes safe writes. The compiler represents the hidden argument as a captured type and rejects operations that require knowledge the projection erased. For an invariant `Box<T : U>`, `Box<*>` reads values as `U`, while members that consume `T` accept no value through that projected reference; exact rules also account for declaration-site variance.

## Example

```kotlin run id=generics-projected-copy file=ProjectedCopy.kt main=ProjectedCopyKt expected=1|2|ready
fun <T> copy(from: Array<out T>, to: Array<in T>) {
    for (index in from.indices) to[index] = from[index]
}

fun main() {
    val numbers = arrayOf(1, 2)
    val values = arrayOfNulls<Any>(2)
    copy(numbers, values)
    println("${values.joinToString("|")}|ready")
    // 1|2|ready
}
```

The source is an `out` restricted view and the destination is an `in` restricted view. Their arrays remain ordinary allocated arrays; the function signature exposes only the operations its algorithm needs.

This example intentionally does not compile because the projected reference does not know which subtype of `Number` it contains.

```kotlin compile-fails id=generics-projection-restrictions file=ProjectionRestrictions.kt category=type-mismatch
fun append(values: MutableList<out Number>) {
    val writable: MutableList<Number> = values
    writable.add(1)
    values.add(1)
}
```

```kotlin run id=generics-star-projection file=StarProjection.kt main=StarProjectionKt expected=String:3
class Slot<T : Any>(private val value: T) {
    fun get(): T = value
    fun replace(next: T): Slot<T> = Slot(next)
}

fun inspect(slot: Slot<*>): String {
    val value: Any = slot.get()
    return "${value::class.simpleName}:${value.toString().length}"
}

fun main() {
    println(inspect(Slot("api")))
    // String:3
}
```

`Slot<*>` safely reads the upper bound `Any`. Calling `replace` is unavailable because the hidden type might not be the type of any proposed value.

## Java comparison

`Array<out Number>` resembles Java `Array<? extends Number>`, and `Array<in String>` resembles `Array<? super String>`. `Slot<*>` resembles `Slot<?>`, while a Java raw `Slot` discards generic checking and can permit unsafe operations with warnings. Kotlin projections integrate with declaration-site variance, so not every Kotlin use needs a wildcard-shaped annotation.

## Common mistakes

Treating `out` as a defensive copy; expecting to add a subtype through an `out` view; reading a precise `T` from an `in` view; equating `*` with `Any?` as an actual chosen argument; using `MutableList<*>` and then casting merely to regain mutation; or calling star projection a raw type.

## Decision guidance

Use a projection when a function needs only one direction from an otherwise invariant type. Prefer declaration-site variance when the abstraction always has that role. Use a star projection for safe inspection, routing, or classifier checks when the argument is genuinely unknown. If code must mutate or preserve the exact argument, redesign the boundary to capture or name the type instead of guessing it.

## Knowledge check

Why can `MutableList<out Number>` return a `Number` but not accept `1`? Its actual argument might be `Double`; reading has a safe upper type, while writing an Int could violate the hidden list's invariant element type.

## Connections

[Declaration-site variance](#declaration-site-variance) makes a role permanent for an abstraction. [Collection interfaces](#collection-interfaces) provide common invariant mutable boundaries. [Runtime generic types](#generic-runtime-types) use star projections for legal classifier checks while preserving erased arguments.

## Interview question

Design a copy function for invariant buffers and explain the operations available on `Buffer<out T>`, `Buffer<in T>`, and `Buffer<*>`. Diagnose why an attempted write through the producer view fails.

## Essential points

- A use-site projection is a restricted view of one reference.
- `out` supports safe reads, `in` supports safe writes, and invariance remains underneath.
- Star projection models an unknown argument while retaining only universally safe operations.
- Projections are safer and more precise than abandoning checks through raw types or unchecked casts.

## Trade-offs

Projections widen accepted inputs while intentionally reducing usable operations. Stars make heterogeneous inspection safe but lose exact element information. Naming or capturing the type preserves more information at the cost of a more specific API.

## Common traps

Calling projections conversions, claiming `*` means `Any?` in every variance position, or “repairing” a prohibited write with a cast instead of respecting the missing proof.

## Follow-up probes

What can be read from `MutableList<in String>`? How does an upper bound change a star-projected read? When is declaration-site variance clearer than repeating projections?

## Sources

- [Kotlin documentation: Type projections](https://kotlinlang.org/docs/generics.html#type-projections)
- [Kotlin documentation: Star projections](https://kotlinlang.org/docs/generics.html#star-projections)
- [Kotlin documentation: Calling Java from Kotlin—generics](https://kotlinlang.org/docs/java-interop.html#java-generics-in-kotlin)
