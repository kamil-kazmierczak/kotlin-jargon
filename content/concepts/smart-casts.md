---
id: smart-casts
title: Smart casts and stable checks
profile: substantial
category: type-system
depth: core
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-21
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-21
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-21
reviewReference: commit:673e2d3
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [nullable-types]
relatedIds: [any, nothing, platform-types]
aliases: [flow typing, type check, is check, stable value, smart cast impossible]
---

## Overview

A smart cast lets Kotlin use a more specific compile-time type after control flow proves a stable value has that type or is not null. The proof belongs to a program point; it is not a mutation or a hidden runtime conversion.

## Why it matters to Java developers

Java pattern variables make some checks similarly concise, but Kotlin's flow analysis also follows null checks, early returns, `when`, logical operators, safe calls, and Elvis expressions. The important interview skill is explaining why a proof remains valid—or why mutation, an open getter, or concurrency makes it unsafe.

## Mental model

Treat every smart cast as a compiler-maintained fact: “at this point, this stable expression satisfies these constraints.” Trace which branch established the fact and whether anything could make a later read produce a different value.

## Semantics

Checks such as `value != null`, `value is String`, and their negated early-return forms refine a stable sink. Local `val` values are straightforward. A local `var` can be smart-cast only while the compiler can prove it is not changed between the check and use or captured by code that may change it. A mutable property is read through its getter each time, so checking one read does not prove the next read has the same value.

Kotlin may infer a non-denotable intersection after multiple compatible `is` checks. This is compiler type information, not source syntax to copy into an API.

On the Kotlin 2.4 baseline, an always-false `is` check between definitely incompatible types is an error. Kotlin 2.4 also requires an `else` branch or a branch matching the base itself when a `when` expression handles a non-abstract Java sealed class: Java can instantiate that permitted base directly, so subclass branches alone are not exhaustive.

## Example

The early return leaves a stable `String` in the remaining control-flow branch.

```kotlin run id=smart-cast-stable file=SmartCastStable.kt main=SmartCastStableKt expected=3:ADA|not-text
fun describe(value: Any?): String {
    if (value !is String) return "not-text"
    return "${value.length}:${value.uppercase()}"
}

fun main() = println("${describe("Ada")}|${describe(null)}") // 3:ADA|not-text
```

This example is expected not to compile. `nickname` is mutable, so another read may call a getter that returns a different value.

```kotlin compile-fails id=smart-cast-mutable-property file=SmartCastMutableProperty.kt category=smart-cast-impossible
class Profile(var nickname: String?)

fun nicknameLength(profile: Profile): Int {
    if (profile.nickname != null) {
        return profile.nickname.length
    }
    return 0
}
```

Snapshotting once makes the checked value stable: `val nickname = profile.nickname` followed by a null check is both compilable and an honest statement about which read is used.

## Java comparison

Java's `instanceof String text` also binds a type-refined value. Kotlin commonly refines the existing expression instead. In both languages, flow proof is local; neither turns a changing property into an immutable fact.

## Common mistakes

Repeating an explicit cast after a successful stable check; assuming a mutable property keeps the checked value; forcing compilation with `!!`; or calling a non-abstract Java sealed hierarchy exhaustive after listing only its permitted subclasses.

## Decision guidance

Prefer a smart cast when control flow naturally proves the fact. Snapshot mutable or custom-getter state when one observation is the intended input. Use an explicit safe cast (`as?`) when failure should become null, and an explicit checked failure when an unexpected type violates a boundary contract.

## Knowledge check

Why can `if (profile.nickname != null) profile.nickname.length` fail to smart-cast while `val name = profile.nickname; if (name != null) name.length` succeeds? The property can produce another value on its second read; the local `val` cannot be reassigned and represents one observation.

## Connections

[Nullable types](#nullable-types) supply the null check being refined. [Any](#any) is a common broad input narrowed by runtime checks, while [Nothing](#nothing) explains why an early-return or throwing branch can leave a narrower type behind. [Platform types](#platform-types) are a Java-boundary association: normalize their uncertainty before relying on ordinary Kotlin flow facts.

## Interview question

A service checks a mutable nullable property, but Kotlin refuses the following dereference. Explain the refusal, repair the code without `!!`, and describe how the answer changes for a local `val`, a captured `var`, and a non-abstract Java sealed class on Kotlin 2.4.

## Essential points

- A smart cast is flow-sensitive compile-time refinement, not a conversion.
- The checked expression must be stable enough that the fact still holds at the use.
- A one-read local snapshot is often the correct repair for mutable or custom-getter state.
- Kotlin 2.4 tightened definitely impossible `is` checks and non-abstract Java sealed-class exhaustiveness.

## Trade-offs

Snapshots give consistent reasoning but intentionally ignore later changes. Re-reading observes current state but needs fresh handling. A safe cast turns mismatch into nullable data; rejection preserves a strict invariant but ends the operation.

## Common traps

Blaming “compiler weakness” instead of identifying a changing read, using `!!` to silence the proof obligation, or claiming all Java sealed hierarchies are exhaustively matched by their permitted subclasses.

## Follow-up probes

When can an inline lambda preserve a smart cast of a captured variable? What internal type can multiple `is` checks infer? Why is a branch for the Java base itself sufficient where only subclass branches are not?

## Sources

- [Kotlin documentation: Type checks and casts](https://kotlinlang.org/docs/typecasts.html)
- [Kotlin specification: Smart casts](https://kotlinlang.org/spec/type-inference.html#smart-casts)
- [Kotlin 2.4 compatibility guide](https://kotlinlang.org/docs/compatibility-guide-24.html)
