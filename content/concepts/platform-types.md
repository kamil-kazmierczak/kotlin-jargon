---
id: platform-types
title: Platform types
profile: compact
category: java-interoperability
depth: deep-dive
publicationStatus: verified
publishedAt: 2026-09-19
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-19
prerequisiteIds: [nullable-types]
relatedIds: [nullable-types]
aliases: [String!, Java interop nullability]
---

## Overview

A platform type is Kotlin's flexible view of a Java type whose nullability Kotlin cannot prove. It is displayed as `String!` in documentation and IDEs, but `!` is not syntax you write in Kotlin. Kotlin lets you use that value in nullable or non-null positions; that convenience moves some null-safety responsibility to the Java boundary.

## Why it matters to Java developers

Java APIs commonly use `null` without a type-level contract. Kotlin makes the uncertainty visible at the call site: treat an unannotated Java return as a boundary to normalize, rather than as a Kotlin non-null guarantee.

## Semantics

For an unannotated Java `String` return, Kotlin infers a platform type. Assigning it to `String?` preserves the possible `null`; assigning it to `String` asks Kotlin to insert a runtime null check. The latter may throw before your code continues if Java returns `null`.

Java nullability annotations can improve the type Kotlin sees, but they do not replace an explicit boundary policy.

## Example

The Java API has no nullability annotation, so `findNickname` enters Kotlin as a platform type. The safe path makes the nullable decision explicitly and produces deterministic output.

```java fragment
public final class JavaDirectory {
    public static String findNickname(boolean found) {
        return found ? "  Ada  " : null;
    }
}
```

```kotlin run id=platform-safe-boundary file=PlatformSafeBoundary.kt main=PlatformSafeBoundaryKt expected=Anonymous
fun main() {
    val nickname: String? = null // JavaDirectory.findNickname(false)
    println(nickname?.trim() ?: "Anonymous")
}
```

Static result: `Anonymous`. In a real boundary call, use `JavaDirectory.findNickname(false)` and keep the declared `String?` type.

## Connections

Platform types depend on [nullable types](#nullable-types). They are related to [not-null assertion](#not-null-assertion): `!!` hides nullability uncertainty instead of choosing a boundary policy.

## Sources

- [Kotlin documentation: Null safety — platform types](https://kotlinlang.org/docs/null-safety.html#platform-types)
- [Kotlin documentation: Calling Java from Kotlin](https://kotlinlang.org/docs/java-interop.html)
- [Kotlin specification: Platform types](https://kotlinlang.org/spec/java-interop.html#platform-types)
