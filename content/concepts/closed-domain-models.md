---
id: closed-domain-models
title: Closed domain models with sealed hierarchies and enums
profile: substantial
category: domain-modeling
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
prerequisiteIds: [classes-inheritance, expressions-control-flow, nothing]
relatedIds: [data-classes, objects-and-companions]
aliases: [sealed class, sealed interface, enum class, exhaustive when, closed hierarchy]
---

## Overview

Enums model a fixed set of singleton values. Sealed classes and interfaces model a closed family of variants whose instances can carry different data. They share exhaustive `when` checking but encode different state spaces.

## Why it matters to Java developers

The choice parallels Java enums versus sealed hierarchies, but Kotlin makes exhaustive `when` a central expression-level design tool and permits data classes, data objects, and enums to cooperate under a sealed interface.

## Mental model

Ask whether each case is only a named singleton or a distinct shape with per-instance payload. Use an enum for the former and a sealed hierarchy for the latter; combine them when an orthogonal finite classification belongs inside richer variants.

## Semantics

Each enum entry is a single value of its enum type and receives generated `name`, `ordinal`, `entries`, and `valueOf` behavior. A sealed type restricts direct subclasses to the permitted package and module boundary. A subject-based `when` is exhaustive when all enum entries or all relevant direct non-sealed subtypes are covered. Indirect extensibility still depends on whether a direct subclass is sealed, final, or open.

## Example

```kotlin run id=domain-exhaustive-order file=ClosedOrder.kt main=ClosedOrderKt expected=queued:2
enum class Priority { STANDARD, EXPRESS }

sealed interface OrderState {
    data object Draft : OrderState
    data class Queued(val items: Int, val priority: Priority) : OrderState
    data class Rejected(val reason: String) : OrderState
}

fun describe(state: OrderState): String = when (state) {
    OrderState.Draft -> "draft"
    is OrderState.Queued -> "queued:${state.items}"
    is OrderState.Rejected -> "rejected:${state.reason}"
}

fun main() = println(describe(OrderState.Queued(2, Priority.EXPRESS)))
```

An enum entry is not a subtype that can represent a new payload-bearing case:

```kotlin compile-fails id=domain-invalid-enum-state file=InvalidEnumState.kt category=unresolved-reference
enum class DeliveryState { DRAFT, DISPATCHED }

fun onlyDraft(state: DeliveryState.DRAFT): String = state.name
```

## Java comparison

Java sealed types also control permitted subclasses, while Java enums likewise provide fixed constants. Kotlin's concise data variants and exhaustive `when` expressions make the algebraic shape more direct, but Java callers still see classes, interfaces, enum constants, and generated accessors rather than a special JVM sum type.

## Common mistakes

Using an enum when each occurrence needs different data, adding `else` to a deliberately closed `when` and thereby hiding new variants, assuming every descendant must be in one file, or forgetting that an open direct child reopens part of a sealed hierarchy.

## Decision guidance

Use an enum for stable singleton choices such as priority. Use a sealed interface or class when cases have different payloads or behavior and the variant set belongs under coordinated control. Omit `else` when exhaustive maintenance feedback is the point; validate external strings rather than treating enum names or ordinals as durable wire formats.

## Knowledge check

Would adding `OrderState.Paid(val receipt: String)` break `describe`? Yes: its exhaustive `when` must handle the new direct subtype. Adding an enum value similarly requires exhaustive enum matches to be updated.

## Connections

This applies [classes and inheritance](#classes-inheritance), [expressions and control flow](#expressions-control-flow), and [Nothing](#nothing) to closed state spaces. [Data classes](#data-classes) are useful payload variants, and [objects and companions](#objects-and-companions) provide singleton cases and factories.

## Interview question

Model an order that can be draft, submitted with lines, paid with a receipt, or rejected with a reason. Explain why one enum plus nullable fields is weaker than a sealed hierarchy, and identify when an enum still belongs in the model.

## Essential points

- Nullable field combinations permit states that should be impossible.
- Sealed data variants make case-specific payloads mandatory and enable exhaustive handling.
- Enums remain appropriate for payload-free singleton classifications such as priority.

## Trade-offs

Closed models strengthen local reasoning and migration feedback but require coordinated releases when consumers compile exhaustive matches. Extensible interfaces support third-party cases but cannot promise the same closed-world handling.

## Common traps

Claiming sealed means all descendants are runtime-known forever, persisting `ordinal`, or using an `else` branch that swallows a newly added business case.

## Follow-up probes

What changes if a direct sealed subtype is open? Can an enum implement a sealed interface? How would Java callers distinguish the variants?

## Sources

- [Kotlin documentation: Sealed classes and interfaces](https://kotlinlang.org/docs/sealed-classes.html)
- [Kotlin documentation: Enum classes](https://kotlinlang.org/docs/enum-classes.html)
- [Kotlin specification: Exhaustive when expressions](https://kotlinlang.org/spec/expressions.html#exhaustive-when-expressions)
