---
id: immutability
title: Immutability, aliases, and stable invariants
profile: substantial
category: domain-modeling
depth: core
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-21
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-21
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-21
reviewReference: commit:bac7636
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [data-classes, nullable-types]
relatedIds: [delegation, equality, initialization]
aliases: [immutable model, read-only collection, val, defensive copy, persistent update]
---

## Overview

Kotlin distinguishes non-reassignable references and read-only interfaces from deep immutability. Stable domain invariants require controlling every mutation path, including aliases held by callers and shallow data-class copies.

## Why it matters to Java developers

`val` is closer to a Java final reference than to an immutable object. Kotlin's `List` interface has no mutating operations, yet a mutable implementation can still change through another reference.

## Mental model

Trace capabilities, not keywords. Ask who can mutate the object, its nested values, or the backing collection, and whether any read-only view shares the same mutable storage.

## Semantics

A `val` cannot be reassigned after initialization but the referenced object may be mutable. Read-only collection interfaces expose only reads and are covariant; they do not guarantee immutable storage. Mutable collections can be assigned to read-only views, so later mutations remain visible. Data-class `copy` is shallow. A stable snapshot therefore requires immutable elements plus ownership, a defensive copy, or a persistent immutable collection contract.

## Example

```kotlin run id=domain-read-only-alias file=ReadOnlyAlias.kt main=ReadOnlyAliasKt expected=2:placed|paid
fun main() {
    val mutable = mutableListOf("placed")
    val readOnly: List<String> = mutable
    mutable += "paid"
    println("${readOnly.size}:${readOnly.joinToString("|")}")
}
```

The read-only view changes because its backing object changes through another alias.

```kotlin run id=domain-order-model file=OrderModel.kt main=OrderModelClient expected=A-7:submitted:125:EXPRESS:USD:2:true
@JvmInline
value class OrderId(val value: String) {
    init { require(value.isNotBlank()) }
}

enum class Currency { USD, EUR }
enum class Priority { STANDARD, EXPRESS }

sealed interface OrderState {
    data object Draft : OrderState
    data class Submitted(val totalCents: Int) : OrderState
    data class Rejected(val reason: String) : OrderState
}

class Order private constructor(
    val id: OrderId,
    val state: OrderState,
    val priority: Priority,
    val tags: List<String>
) {
    fun javaId(): String = id.value

    companion object {
        @JvmStatic
        fun submit(id: String, cents: Int, tags: Collection<String>, priority: Priority): Order =
            Order(OrderId(id.trim()), OrderState.Submitted(cents), priority, java.util.List.copyOf(tags))
    }
}

interface CurrencyPolicy { fun currency(): Currency }
object UsdPolicy : CurrencyPolicy { override fun currency() = Currency.USD }
class Checkout(policy: CurrencyPolicy) : CurrencyPolicy by policy

fun describe(state: OrderState): String = when (state) {
    OrderState.Draft -> "draft"
    is OrderState.Submitted -> "submitted:${state.totalCents}"
    is OrderState.Rejected -> "rejected:${state.reason}"
}
```

```java run id=domain-order-model file=OrderModelClient.java main=OrderModelClient expected=A-7:submitted:125:EXPRESS:USD:2:true
import java.util.ArrayList;
import java.util.List;

public final class OrderModelClient {
    public static void main(String[] args) {
        var tags = new ArrayList<>(List.of("new", "priority"));
        var order = Order.submit(" A-7 ", 125, tags, Priority.EXPRESS);
        tags.add("caller-change");
        var checkout = new Checkout(UsdPolicy.INSTANCE);
        boolean getterRejectedMutation;
        try {
            order.getTags().add("break-invariant");
            getterRejectedMutation = false;
        } catch (UnsupportedOperationException expected) {
            getterRejectedMutation = true;
        }
        System.out.println(
            order.javaId() + ":" +
            OrderModelKt.describe(order.getState()) + ":" +
            order.getPriority() + ":" +
            checkout.currency() + ":" +
            order.getTags().size() + ":" +
            getterRejectedMutation
        );
    }
}
```

The complete model chooses a value class for the internal ID, sealed payload variants for state, enums for singleton priority and currency choices, an ordinary class with a private constructor to guard every creation path, an object strategy, implementation delegation, and an unmodifiable snapshot of incoming tags. A data class would reintroduce a public generated `copy` path accepting an arbitrary `List`. The String-taking static bridge keeps the value-class lowering out of the Java construction API, while the compiled Java client proves the selected getter and singleton shapes and verifies that neither the caller's retained alias nor the returned Java list can mutate stored tags.

## Java comparison

Java final references and unmodifiable views have the same aliasing distinction. Kotlin makes read-only interfaces idiomatic and can make update-by-copy concise, but neither feature supplies deep immutability by itself.

## Common mistakes

Equating `val` with immutability, returning a read-only view over an internally mutable list, accepting a mutable collection and storing it directly, or using mutable equality components as hash keys.

## Decision guidance

Prefer `val` properties, expose the narrowest read-only types, and copy mutable inputs at ownership boundaries. Use persistent immutable structures when frequent updates and structural sharing matter. Document whether snapshots are shallow or deep, and keep mutable entities out of value-based hash keys.

## Knowledge check

Does changing a parameter type from `MutableList<Line>` to `List<Line>` prove callers cannot change the order? No. It removes mutation through that parameter but does not remove aliases, mutable implementations, or mutable `Line` elements.

## Connections

[Data classes](#data-classes) provide shallow copy, [equality](#equality) makes mutation dangerous in hash-based collections, [initialization](#initialization) helps establish valid snapshots, and [delegation](#delegation) can share a mutable collaborator.

## Interview question

An `Order(val lines: List<Line>)` changes after construction and disappears from a `HashSet`. Explain how both are possible and design an API with stable invariants.

## Essential points

- `List` is a read-only interface, not a deep immutable guarantee.
- The caller may retain a mutable alias, and mutable equality state can change hash codes.
- Copy inputs, use immutable elements, and avoid mutable hash keys or identity-changing updates.

## Trade-offs

Defensive copies simplify ownership at allocation cost. Persistent data structures make immutable updates cheaper but add a dependency and different performance characteristics. Controlled mutable entities can be appropriate when identity and synchronization are explicit.

## Common traps

Wrapping rather than copying, overlooking nested mutable elements, or claiming functional update syntax eliminates allocation and aliasing concerns.

## Follow-up probes

When is a read-only live view desirable? How would you expose snapshots to Java? What tests reveal shallow-copy aliasing?

## Sources

- [Kotlin documentation: Collections overview](https://kotlinlang.org/docs/collections-overview.html)
- [Kotlin documentation: Properties](https://kotlinlang.org/docs/properties.html)
- [Kotlin documentation: Data class copying](https://kotlinlang.org/docs/data-classes.html#copying)
