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

## Interview question

A Java API returns an unannotated `String`. Kotlin shows its type as `String!`. How would you use that value in Kotlin, and what risks and boundary decisions would you explain to an interviewer?

## Essential points

- `String!` is an IDE and documentation notation for a platform type, not Kotlin source syntax.
- Kotlin cannot prove whether the Java value is null, so it permits both nullable and non-null uses.
- Assigning to `String?` keeps the uncertainty explicit; assigning to `String` inserts a runtime null check.
- A deliberate boundary policy should turn the platform value into an ordinary Kotlin nullable or non-null type as early as practical.

## Trade-offs

- Preserving `String?` costs explicit handling but keeps a Java contract failure in the type system.
- Choosing `String` is convenient when the external contract is trustworthy, but a bad Java value fails at runtime.
- Nullability annotations improve Kotlin's view of Java APIs, while still requiring judgment about whether the external contract is reliable.

## Common traps

- Calling `String!` a type that can be written in Kotlin source.
- Assuming Kotlin has proved an unannotated Java value non-null.
- Reaching immediately for `!!`, which only changes where and how the failure happens.
- Giving a single memorized prescription instead of explaining how the API contract changes the boundary choice.

## Follow-up probes

- What changes when the Java declaration gains `@Nullable` or `@NotNull`?
- Where would you normalize a platform type in a larger codebase?
- How does assigning a platform value to `String` differ from using `!!` later?
- What would you do if annotations and observed Java behavior disagree?

## Sources

- [Kotlin documentation: Null safety — platform types](https://kotlinlang.org/docs/null-safety.html#platform-types)
- [Kotlin documentation: Calling Java from Kotlin](https://kotlinlang.org/docs/java-interop.html)
- [Kotlin specification: Platform types](https://kotlinlang.org/spec/java-interop.html#platform-types)
