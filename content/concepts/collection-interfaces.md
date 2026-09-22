---
id: collection-interfaces
title: Collection capabilities, ownership, and aliases
profile: substantial
category: collections
depth: core
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-22
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-22
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-22
reviewReference: commit:c7dd3dd
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [immutability]
relatedIds: [collection-transformations, platform-types]
aliases: [read-only collections, mutable collections, List, MutableList, defensive copy]
---

## Overview

Kotlin separates read-only collection interfaces from mutable ones. That separation controls which operations a reference exposes; it does not prove that the backing object, its elements, or other aliases are immutable.

## Why it matters to Java developers

Java developers often transfer assumptions from `Collections.unmodifiableList`, `List.copyOf`, or a `final` reference. Kotlin's `List` is a read-only API, but a `MutableList` can be passed as a `List` without copying. Choosing an interface and choosing ownership are separate decisions.

## Mental model

Ask two questions: “What may this reference do?” and “Who else can mutate the same storage?” `List<T>` answers only the first. A stable snapshot additionally needs an ownership boundary, suitable element semantics, and usually a copy.

## Semantics

Read-only `Collection`, `List`, `Set`, and `Map` expose observation operations. Their mutable subtypes add writes. Read-only collection types are covariant where their element use is safe, while mutable types cannot generally be covariant because they both consume and produce elements. Conversion functions such as `toList()` return a list with the current elements, but that is a shallow copy: mutable element objects can still be shared. Neither a read-only view nor a shallow copy establishes deep immutability.

## Example

```kotlin run id=collections-read-only-alias file=ReadOnlyAlias.kt main=ReadOnlyAliasKt expected=queued|sent:queued:true
fun main() {
    val mutable = mutableListOf("queued")
    val view: List<String> = mutable
    val snapshot: List<String> = mutable.toList()

    mutable += "sent"

    println("${view.joinToString("|")}:${snapshot.joinToString("|")}:${mutable === view}")
    // queued|sent:queued:true
}
```

The view observes the later mutation and is the same object. The copied list retains its earlier structure. Because `String` is immutable, this particular shallow snapshot is stable; a list of mutable elements would need a stronger policy.

## Java comparison

Java's `List.copyOf` documents an unmodifiable result and may reuse an already unmodifiable input; `Collections.unmodifiableList` creates a read-only view whose contents still track its backing list. Kotlin's `List` resembles the capability restriction of a read-only view, not a promise about storage or runtime implementation. At Java boundaries, a Kotlin read-only declaration may still be seen through Java's mutable collection interfaces, so do not rely on the Kotlin type alone to enforce an invariant against Java callers.

## Common mistakes

Calling every `List` immutable, storing a caller-owned `MutableList` behind a read-only property, assuming `toList()` recursively copies elements, or returning internal mutable storage and trusting callers not to cast or mutate it.

## Decision guidance

Expose the narrowest capability clients need. When values must not change after acceptance, copy at the boundary and ensure the elements are immutable or separately copied. Preserve a live read-only view only when observing later owner-controlled changes is part of the contract. For Java-facing invariants, use an implementation and boundary operation that actually reject mutation.

## Knowledge check

If `val names: List<String>` refers to a mutable list held elsewhere, can `names` change? Yes. `val` prevents reassigning the reference and `List` prevents writes through that reference, but another alias can mutate the same object.

## Connections

[Immutability](#immutability) supplies the broader invariant and aliasing model. [Collection transformations](#collection-transformations) explains when operations create result collections, while Java interoperability determines what guarantees survive a JVM API boundary.

## Interview question

A service accepts `MutableList<Account>`, stores it as `List<Account>`, and returns that property. Predict what happens when the caller adds an account later, then design contracts for a live view and for a stable snapshot.

## Essential points

- The read-only interface removes mutators from one reference; it is not deep immutability.
- Retained aliases can mutate shared storage, and mutable elements can survive a shallow copy.
- A live view may be intentional; a snapshot needs an explicit ownership and element policy.

## Trade-offs

Copying spends time and memory to simplify ownership. A live view avoids copying and reflects current state but couples readers to mutation timing. Persistent immutable structures can support efficient updates, but they are a distinct contract and dependency rather than a property of Kotlin's standard `List`.

## Common traps

Using “immutable” and “read-only” interchangeably, promising isolation from `toList()` when elements are mutable, or treating a Kotlin type annotation as runtime enforcement for Java clients.

## Follow-up probes

How would nested mutable lists change the snapshot design? When is returning a live view useful? What would you test at a Java boundary?

## Sources

- [Kotlin documentation: Collections overview](https://kotlinlang.org/docs/collections-overview.html)
- [Kotlin documentation: Constructing collections](https://kotlinlang.org/docs/constructing-collections.html)
- [Kotlin documentation: Java collections interoperability](https://kotlinlang.org/docs/java-to-kotlin-collections-guide.html)
