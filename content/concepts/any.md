---
id: any
title: Any and the top of the type system
profile: substantial
category: type-system
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [nullable-types]
relatedIds: [smart-casts, nothing, platform-types]
aliases: [Any?, top type, Object, universal supertype]
---

## Overview

`Any` is the common supertype of Kotlin's non-null types. `Any?`, not `Any`, is the top type when null is also possible.

## Why it matters to Java developers

Java APIs often expose `Object` as an escape hatch. Kotlin makes you preserve the missing distinction: `Any` rejects null, while `Any?` admits it. A broad top type still carries less domain meaning than a sealed hierarchy, interface, or specific nullable type.

## Mental model

Picture two related universes. Every non-null Kotlin value can flow up to `Any`; every nullable or non-null value can flow up to `Any?`. Moving upward forgets useful guarantees, so code normally checks and refines before doing domain work.

## Semantics

`Any` defines the common `equals`, `hashCode`, and `toString` operations. It does not mean “unknown dynamic value”: calls remain statically checked. `Any?` adds `null` to the possible values and therefore requires null handling before using `Any` members.

At a Java boundary, an unannotated `Object` is normally seen as the flexible platform type `Any!`, not automatically as the honest Kotlin type `Any`. Give the boundary an explicit `Any?` or a narrower type according to its real contract.

Kotlin 2.4 changes annotation behavior relevant to such boundaries. Recompiled Kotlin properties use the new default selection for annotation use-site targets, and annotations are written to Kotlin metadata by default. Tooling and Java-facing contracts should use explicit targets such as `@param:` or `@field:` when the location is part of the intended API rather than relying on an older compiler default.

The same baseline prohibits flexible explicit nullable type arguments for Java types when that flexibility could break type safety, and it enforces Jakarta nullability annotations as errors rather than leaving the declared contract as a warning. These are Kotlin 2.4 migration rules, not timeless descriptions of every Kotlin compiler.

## Example

The broad input is first checked for null and then refined by runtime type. Each branch returns the same deliberate `String` result type.

```kotlin run id=type-top-any file=AnyTop.kt main=AnyTopKt expected=String:3|null
fun inspect(value: Any?): String = when (value) {
    null -> "null"
    is String -> "String:${value.length}"
    else -> value::class.simpleName ?: "unknown"
}

fun main() = println("${inspect("Ada")}|${inspect(null)}") // String:3|null
```

## Java comparison

Kotlin/JVM maps the broad object concepts onto the JVM object model, but Kotlin source distinguishes nullable `Any?` from non-null `Any`. Neither `Object` nor `Any?` is a substitute for a meaningful boundary model.

## Common mistakes

Calling `Any` the supertype of null; treating `Any?` as dynamically typed; assigning an uncertain Java `Object` directly to `Any`; or returning `Any` from an API merely because several result shapes have not yet been modeled.

## Decision guidance

Use `Any?` at a genuinely heterogeneous or reflective edge, then validate and narrow immediately. Prefer a domain interface or sealed result when callers need to distinguish known cases. Use generics when the caller and implementation should preserve a type relationship rather than erase it to `Any`.

## Knowledge check

Can a `String?` be passed to a parameter of type `Any`? No: its value might be null. It can be passed to `Any?`, or checked and smart-cast before being passed to `Any`.

## Connections

[Nullable types](#nullable-types) explain why the true top is `Any?`. [Smart casts](#smart-casts) recover a useful subtype after validation. [Nothing](#nothing) sits at the opposite end of the subtype relation. [Platform types](#platform-types) explain why Java `Object` can arrive with flexible nullability instead of either ordinary Kotlin type.

## Interview question

An adapter accepts `Any?` from a legacy Java integration and returns `Any` to the domain layer. What guarantees are gained and lost, where can the call fail, and how would you redesign the boundary?

## Essential points

- `Any` covers non-null Kotlin types; `Any?` also permits null.
- A platform `Any!` has not proved either ordinary Kotlin contract.
- Validate at the edge and expose a specific domain type downstream.
- Annotation placement and metadata behavior on the Kotlin 2.4 baseline can affect tools that interpret the rebuilt API.

## Trade-offs

`Any?` accepts heterogeneous integrations with little ceremony but pushes validation to runtime. A specific type or sealed model adds conversion work while making supported states reviewable and exhaustive.

## Common traps

Equating broad typing with dynamic typing, forgetting the nullable top type, or believing a non-null assignment validates anything beyond nullness.

## Follow-up probes

Which methods are guaranteed on `Any`? When would a generic type parameter preserve more information? Why might explicit annotation use-site targets matter after a Kotlin 2.4 rebuild?

## Sources

- [Kotlin specification: Any and the type-system top](https://kotlinlang.org/spec/type-system.html#kotlinany)
- [Kotlin documentation: Type overview](https://kotlinlang.org/docs/types-overview.html)
- [Kotlin 2.4 compatibility guide](https://kotlinlang.org/docs/compatibility-guide-24.html)
- [Kotlin 2.4 release notes](https://kotlinlang.org/docs/whatsnew24.html)
