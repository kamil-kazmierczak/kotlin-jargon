---
id: data-classes
title: Data classes and generated value behavior
profile: substantial
category: domain-modeling
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [equality]
relatedIds: [immutability, classes-inheritance]
aliases: [data class, copy, componentN, destructuring, generated equals]
---

## Overview

A data class asks the compiler to derive value-oriented operations from its primary-constructor properties. It is a modeling choice about equality and observable structure, not merely a shorter class declaration.

## Why it matters to Java developers

Kotlin data classes resemble Java records at a glance, but a data class is not automatically a JVM record, its `copy` is shallow, and properties declared in the body are excluded from generated equality, hashing, destructuring, and copying.

## Mental model

Treat the primary constructor as the generated value boundary. Every property placed there participates in generated `equals`, `hashCode`, `toString`, `componentN`, and `copy`; state elsewhere does not.

## Semantics

The compiler derives `equals`/`hashCode`, `toString`, ordered `componentN` functions, and `copy` from primary-constructor properties. Explicit `equals`, `hashCode`, or `toString` can suppress their generated counterparts under the documented rules, but `copy` and `componentN` cannot be supplied explicitly. `copy` constructs another instance while reusing referenced components, so it is a shallow copy rather than a recursive clone.

## Example

```kotlin run id=domain-data-copy file=DataCopy.kt main=DataCopyKt expected=true:true:base|sale:changed
data class Line(val sku: String, val tags: MutableList<String>) {
    var auditNote: String = "new"
}

fun main() {
    val original = Line("A-7", mutableListOf("base"))
    val duplicate = original.copy()
    duplicate.tags += "sale"
    duplicate.auditNote = "changed"
    println("${original == duplicate}:${original.tags === duplicate.tags}:${original.tags.joinToString("|")}:${duplicate.auditNote}")
}
```

Equality remains true because both primary-constructor properties still compare equally: both lines share the same mutated list. `auditNote` is excluded, and the identical list reference demonstrates shallow copying.

## Java comparison

Java records fix their state description in record components and have record-specific JVM shape. Kotlin data classes remain classes with Kotlin-generated members unless they separately satisfy and opt into `@JvmRecord`. Neither construct makes a mutable component deeply immutable.

## Common mistakes

Assuming `copy` isolates nested collections, placing identity-relevant state in the class body, destructuring a domain object whose constructor order is not a stable public contract, or using a data class while requiring identity semantics.

## Decision guidance

Choose a data class when its primary-constructor properties honestly define value equality and copying. Prefer an ordinary class when identity, a carefully hidden representation, or custom lifecycle rules dominate. Snapshot or persistently model mutable components before relying on copies as independent values.

## Knowledge check

If `auditNote` differs between the two lines above, can their generated equality still be true? Yes. Body properties do not participate in generated equality; changing that fact requires redesigning the value boundary or defining equality explicitly.

## Connections

This builds on [equality](#equality). [Immutability](#immutability) determines whether generated copying yields independent snapshots, while [classes and inheritance](#classes-inheritance) explains why data classes are final.

## Interview question

An order data class contains a primary-constructor `MutableList<Line>` and a body `version`. A copied order changes when the original list is mutated and two different versions compare equal. Diagnose both outcomes and redesign the model.

## Essential points

- Generated operations use primary-constructor properties only.
- `copy` is shallow, so both orders can retain the same mutable list.
- Move equality-relevant versioning into the value boundary and remove or snapshot mutable aliases.

## Trade-offs

Generated value behavior removes boilerplate and makes intent visible, but exposes constructor membership and order as meaningful design choices. Custom classes cost more code but can protect representation and identity rules.

## Common traps

Calling `copy` a clone, equating data classes with records, or solving mutable equality by changing only `equals` while leaving `hashCode` inconsistent.

## Follow-up probes

When would `@JvmRecord` be useful? Why can mutable primary-constructor properties be dangerous as hash keys? What API compatibility concern follows from destructuring order?

## Sources

- [Kotlin documentation: Data classes](https://kotlinlang.org/docs/data-classes.html)
- [Kotlin documentation: Using Java records in Kotlin](https://kotlinlang.org/docs/jvm-records.html)
- [Kotlin specification: Data class declaration](https://kotlinlang.org/spec/declarations.html#data-class-declaration)
