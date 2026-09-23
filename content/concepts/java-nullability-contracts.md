---
id: java-nullability-contracts
title: Java nullability contracts
profile: substantial
category: java-interoperability
depth: deep-dive
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-23
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-23
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-23
reviewReference: commit:e0ba68078b26d4a11eab9d9a0b00328434d9c55c
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: [platform-types, nullable-types]
relatedIds: [smart-casts, not-null-assertion]
aliases: [Jakarta nullability, JSpecify, Java nullability annotations]
---

## Overview

An annotation on a Java declaration can turn a Kotlin platform type into a checked nullable or non-null type. This lesson extends [Platform types](#platform-types): first identify what the Java declaration promises, then normalize the value at the boundary and decide what a broken promise means.

## Why it matters to Java developers

A Java library can be compiled with weak or absent nullability metadata. Kotlin's concise call syntax does not validate a foreign implementation. A senior backend API needs both a useful static contract and a deliberate runtime policy.

## Mental model

Separate three claims: Java's declaration, Kotlin's interpretation under the configured compiler, and the value actually returned. An annotation affects the first two, but cannot force the third.

## Semantics

An unannotated Java `String` enters Kotlin as `String!`, which cannot be written as a Kotlin source type. A Java `@Nullable` return recognized by Kotlin enters as `String?`. Under the pinned Kotlin 2.4 baseline, mismatches involving `jakarta.annotation.Nullable` or `jakarta.annotation.Nonnull` are errors; Kotlin 2.2 warned. JSpecify is strict by default as well. Annotation families and report levels vary, so check the actual dependency, target, and compiler flags. Type-use annotations can describe generic arguments, but target placement matters. Even a declared non-null Java method can violate its contract at runtime.

## Example

The unannotated Java API intentionally returns null. The Kotlin consumer normalizes immediately to `String?`, then chooses a fallback. `order=java-first` compiles the real Java declaration before its Kotlin caller.

```java run id=interop-null-boundary file=LegacyNames.java order=java-first main=NullBoundaryKt expected=Anonymous
public final class LegacyNames {
    public static String find(boolean present) {
        return present ? "Ada" : null;
    }
}
```

```kotlin run id=interop-null-boundary file=NullBoundary.kt order=java-first main=NullBoundaryKt expected=Anonymous
fun main() {
    val name: String? = LegacyNames.find(false)
    println(name?.trim() ?: "Anonymous") // Anonymous
}
```

## Java comparison

Java clients rely on documentation and annotations for nullability; Kotlin can enforce recognized annotations at compile time. Both clients still need a policy when an external implementation violates the declared contract.

## Common mistakes

Treating `String!` as a safe non-null promise; using `!!` before deciding how to handle absence; assuming every annotation package has the same severity; or calling a runtime null check proof that Java obeys its API.

## Decision guidance

At each Java entry point, choose nullable storage or validate a required non-null result once. Prefer accurate annotations on APIs you own, and compile Kotlin consumers against the published artifact and pinned version. Keep fallback, rejection, and contract-violation paths explicit.

## Knowledge check

If an unannotated `lookup()` returns null, what does `val x: String = lookup()` buy you? It compiles but can fail at a generated null check. `String?` retains the uncertainty for explicit handling.

## Connections

[Platform types](#platform-types) explains the flexible input; [nullable types](#nullable-types) and [smart casts](#smart-casts) govern handling after normalization. [Annotation boundaries](#java-annotation-boundaries) covers where metadata lands for Java tools.

## Interview question

A service upgrades to Kotlin 2.4 and a Java dependency marks `lookup()` with Jakarta `@Nullable`. A Kotlin non-null assignment now fails. Explain the failure, redesign the boundary, and plan a regression test.

## Essential points

- Kotlin 2.4 enforces the supported Jakarta nullability contract as an error.
- Unannotated Java values remain platform types; annotations are static evidence, not runtime validation.
- A boundary type and handling policy should make null behavior deliberate.

## Trade-offs

Failing fast detects an upstream contract violation; a nullable fallback maintains availability but may hide data quality trouble. Strict annotations improve callers but can expose existing source incompatibilities on upgrade.

## Common traps

Saying all Java annotations behave identically, or treating an annotated non-null result as impossible to violate at runtime.

## Follow-up probes

How would a type-use annotation on `List<String>` affect elements? What if the library annotation is absent from the consumer classpath? Where should a metric for broken contracts live?

## Sources

- [Kotlin documentation: Calling Java from Kotlin](https://kotlinlang.org/docs/java-interop.html)
- [Kotlin 2.4 compatibility guide: Jakarta nullability](https://kotlinlang.org/docs/compatibility-guide-24.html)
- [Kotlin documentation: Null safety](https://kotlinlang.org/docs/null-safety.html#platform-types)
