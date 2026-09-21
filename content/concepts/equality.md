---
id: equality
title: Equality and identity
profile: substantial
category: execution-semantics
depth: core
publicationStatus: review-ready
publicationHistory: [draft, review-ready]
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-20
prerequisiteIds: [classes-inheritance]
relatedIds: [declarations-properties, expressions-control-flow]
aliases: [==, ===, equals, hashCode, contentEquals, structural equality]
---

## Overview

Kotlin uses `==` for null-safe equality and `===` for identity. Value equality still depends on a type's equals contract; an ordinary class does not gain field-by-field equality automatically.

## Why it matters to Java developers

Porting Java reference comparisons mechanically changes meaning. Conversely, assuming Kotlin's “structural equality” compares every object's fields leads to surprising cache and test behavior.

## Mental model

Ask whether the business question is “same instance” or “equal value,” then identify the concrete equality implementation. Keep equals and hashCode consistent whenever values enter hashed collections.

## Semantics

For ordinary nullable references, `a == b` behaves like `a?.equals(b) ?: (b === null)`. An ordinary class inheriting Any's equality compares identity. A data class generates equality from primary-constructor properties; properties declared in its body do not participate. This is a preview of data-class semantics, not the later domain-modeling design lesson.

Arrays use identity equality with `==`; use contentEquals for element comparison. Avoid identity-based reasoning about boxed numbers. Floating-point equality has type-sensitive rules: statically Float/Double operands use IEEE behavior, while equality through broader types can differ.

## Example

```kotlin run id=core-equality file=Equality.kt main=EqualityKt expected=false:true:false:false:true
class Ticket(val id: Int)
data class TicketValue(val id: Int) {
    var note: String = ""
}
fun main() {
    val left = TicketValue(7)
    val right = TicketValue(7)
    right.note = "changed"
    val a = intArrayOf(1, 2)
    val b = intArrayOf(1, 2)
    println("${Ticket(7) == Ticket(7)}:${left == right}:${left === right}:${a == b}:${a.contentEquals(b)}")
    // false:true:false:false:true
}
```

Different notes do not distinguish TicketValue instances because note is outside the primary constructor. The arrays need an explicit content comparison.

## Java comparison

Kotlin `===` expresses the object identity question commonly asked with Java `==`. Kotlin `==` generally asks equals with null handling; it does not recursively compare arbitrary object graphs.

## Common mistakes

Changing fields used by hashCode while an object is a map key, expecting array contents to participate in ==, or assuming all data-class state contributes to equality.

## Decision guidance

Choose equality from the domain's identity rule. Prefer stable equality-relevant state for keys. Use ordinary classes for intentional instance identity and explicit content comparison for arrays.

## Knowledge check

If note moves into TicketValue's primary constructor, would these two values remain equal? No, once note differs it participates in generated equality. That also changes generated hashCode.

## Connections

This path step connects [classes](#classes-inheritance) to [control-flow](#expressions-control-flow) decisions. [Properties](#declarations-properties) explain why a val reference alone cannot stabilize a key's mutable state.

## Interview question

A deduplication step merges TicketValue objects whose notes differ but retains two Ticket objects with the same ID. Diagnose both outcomes and decide which equality contract is appropriate for a cache key.

## Essential points

- Ordinary Ticket instances inherit identity equality.
- TicketValue compares primary-constructor id and excludes body property note.
- Choose a stable domain key, preserve the equals/hashCode contract, and test both equal and unequal cases.

## Trade-offs

Using only ID can deliberately ignore descriptive changes; including mutable descriptive state may make hashing unsafe. Instance identity is appropriate for entities with independent lifetimes but not automatic value deduplication.

## Common traps

Calling == a universal deep comparison, forgetting hashCode, or treating data classes as automatically immutable.

## Follow-up probes

How do arrays change your test assertion? Why is a val pointing to a mutable key insufficient protection?

## Sources

- [Kotlin documentation: Equality](https://kotlinlang.org/docs/equality.html)
- [Kotlin documentation: Data classes](https://kotlinlang.org/docs/data-classes.html)
- [Kotlin documentation: Numbers and floating-point comparison](https://kotlinlang.org/docs/numbers.html#floating-point-numbers-comparison)
