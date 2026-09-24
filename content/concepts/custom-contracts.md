---
id: custom-contracts
title: User-defined contracts and flow analysis
profile: substantial
category: advanced-kotlin
depth: deep-dive
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
baseline: kotlin-jvm-2026-09
publishedAt: 2026-09-24
verifiedAt: 2026-09-24
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-24
reviewReference: commit:3d9b168bf1b92909c911083b92def0083b878afa
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [smart-casts, inline-reified-functions]
relatedIds: [nullable-types, type-safe-dsls]
aliases: [contracts DSL, returns implies, callsInPlace, ExperimentalContracts]
---

## Overview

A user-defined contract tells the Kotlin compiler a limited fact about a function's normal return or its lambda invocation. Use one only when that fact improves repeated call sites and the implementation really guarantees it.

## Why it matters to Java developers

This resembles a static-analysis annotation, but it changes Kotlin flow analysis. A false contract can make apparently safe callers fail at runtime.

## Mental model

The contract is a promise to the compiler, not a runtime check. First write the check; then describe only the effect that every normal exit actually has.

## Semantics

The standard-library `kotlin.contracts` declaration DSL is marked `ExperimentalContracts` on the pinned Kotlin 2.4.20 baseline. A declaring function needs `@OptIn(ExperimentalContracts::class)`. `returns() implies (x != null)` allows a caller's stable local `x` to be smart cast after normal return. `callsInPlace` describes how many times a lambda is invoked during the call; it is not a substitute for actually invoking it. The Kotlin specification treats user contracts as experimental and does not make the DSL a timeless language guarantee. The compiler trusts a contract rather than proving it from the body.

## Example

The verified program checks before it returns, so the declared implication is true. The local variable is stable, allowing the subsequent `length` access.

```kotlin run id=advanced-contract file=Contract.kt main=ContractKt expected=3
import kotlin.contracts.ExperimentalContracts
import kotlin.contracts.contract

@OptIn(ExperimentalContracts::class)
fun requirePresent(value: String?) {
    contract { returns() implies (value != null) }
    require(value != null)
}

fun main() {
    val name: String? = "Ada"
    requirePresent(name)
    println(name.length) // 3
}
```

## Java comparison

Java's `Objects.requireNonNull` returns a non-null value, which is often enough in Kotlin too: `val checked = requireNotNull(value)`. A Java caller does not gain Kotlin's smart-cast effect from this contract.

## Common mistakes

Declaring an implication that holds only on one normal-return path, confusing a contract with validation, or declaring `EXACTLY_ONCE` for a callback that may be skipped or stored.

## Decision guidance

Prefer `requireNotNull` or an explicit returned value when they make the invariant obvious. Add a user contract for a frequently used, truthful control-flow abstraction, and keep its opt-in local. Recheck it when changing the function body.

## Knowledge check

If `requirePresent` returns normally with null, is the contract harmless? No. The compiler may smart cast the caller's value based on a false declaration.

## Connections

[Smart casts](#smart-casts) explain the caller effect; [inline functions](#inline-reified-functions) provide a common setting for `callsInPlace`; [DSLs](#type-safe-dsls) should not use contracts to conceal runtime validation.

## Interview question

A shared assertion helper makes nullable locals usable after a call. When is a custom contract justified, and what breaks if the helper returns normally for null?

## Essential points

- Name `ExperimentalContracts` and opt in at the declaration.
- Explain the normal-return implication and stable-local smart cast.
- Treat the contract as a promise to compiler analysis, backed by runtime behavior.

## Trade-offs

The call site can become concise, but reviewers must verify every return path. A returned non-null value is more explicit and needs no experimental declaration API.

## Common traps

Assuming the compiler proves custom effects or that an opt-in makes an API stable across Kotlin versions.

## Follow-up probes

What must `callsInPlace(EXACTLY_ONCE)` guarantee? Why might a mutable property still resist a smart cast? How would you test a contract after refactoring its body?

## Sources

- [Kotlin contracts API and opt-in](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.contracts/)
- [Kotlin specification: user contracts](https://kotlinlang.org/spec/kotlin-spec.html)
