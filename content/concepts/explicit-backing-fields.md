---
id: explicit-backing-fields
title: Explicit backing fields in Kotlin 2.4
profile: substantial
category: advanced-kotlin
depth: reference
pathExclusionReason: Specialized Kotlin 2.4 property syntax is useful at selected API boundaries but is not required for the main advanced design scenario.
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
prerequisiteIds: [declarations-properties, immutability]
relatedIds: [context-parameters, type-safe-dsls]
aliases: [field declaration, backing field, read-only facade, Kotlin 2.4 properties]
---

## Overview

An explicit backing field lets a read-only property expose a broad type while storing a narrower private type. Kotlin 2.4 stabilizes this syntax.

## Why it matters to Java developers

It resembles a private mutable field plus a public getter. The property type restricts Kotlin callers' operations, but does not by itself make the value immutable or safe to share between threads.

## Mental model

The public property is a view; the private field is the stored representation. Ask whether callers need a live view or a snapshot.

## Semantics

On Kotlin 2.4.20, `val items: List<T> field = mutableListOf<T>()` gives the field a private narrower type. An explicit backing field is limited to a non-open, non-delegated `val` without a custom getter or `const`; its type must be a subtype of the property type. These are documented language rules for this version. The `List` facade is read-only at the Kotlin type level, not deeply immutable. A Java caller may see a mutable implementation through a getter, and concurrent mutation needs separate ownership or synchronization. Older Kotlin source levels do not treat this 2.4 syntax as the stable baseline.

## Example

The fixture demonstrates a live view. A production API needing isolation should return an immutable snapshot instead.

```kotlin run id=advanced-backing-field file=BackingField.kt main=BackingFieldKt expected=one,two
class Ledger {
    val entries: List<String> field = mutableListOf()
    fun add(value: String) { entries.add(value) }
}

fun main() {
    val ledger = Ledger()
    val view = ledger.entries
    ledger.add("one")
    ledger.add("two")
    println(view.joinToString(",")) // one,two: the view is live
}
```

## Java comparison

Java code often writes the private `ArrayList` and public `List` getter by hand. Neither language obtains immutability merely by widening the exposed interface.

## Common mistakes

Equating a read-only facade with a snapshot, assuming safe concurrent access, or using the syntax where a custom getter is needed.

## Decision guidance

Use an explicit backing field when the live view is intentional and the 2.4 source requirement is acceptable. Use a private backing property and a copying getter for a snapshot or custom transformation. Keep shared mutable state behind a clear owner.

## Knowledge check

After a caller stores `ledger.entries`, can later `add` calls appear through that reference? Yes. It is a live view of the same mutable list.

## Connections

[Properties](#declarations-properties) explain accessors; [immutability](#immutability) explains aliasing; [context parameters](#context-parameters) are another Kotlin 2.4 source-level design choice.

## Interview question

A cache exposes `val entries: List<Entry> field = mutableListOf()`. Does that guarantee a snapshot or thread safety, and when would this syntax be worth using?

## Essential points

- State the Kotlin 2.4 version boundary and property restrictions.
- Distinguish public read-only operations from immutable storage.
- Explain aliasing and concurrency limits.

## Trade-offs

The syntax keeps one property name and a narrow public type, but can hide a live mutable representation. A conventional backing property makes custom snapshot behavior more explicit.

## Common traps

Claiming `List` prevents Java mutation or that compiler-generated representation is a cross-version binary guarantee.

## Follow-up probes

How would you return a stable snapshot? When does a custom getter rule out this syntax? How would you test a Java consumer?

## Sources

- [Kotlin documentation: Properties and explicit backing fields](https://kotlinlang.org/docs/properties.html#explicit-backing-fields)
- [Kotlin 2.4 release notes](https://kotlinlang.org/docs/whatsnew24.html)
