---
id: platform-types
title: Platform types
profile: focused
category: java-interoperability
depth: core
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

## Mental model

Think of `String!` as **unknown nullability from Java**, not as a third Kotlin nullability kind. Kotlin permits both `String` and `String?` views so gradual Java interop is practical. Choose the nullable view when absence is legitimate; validate immediately when the Java contract says absence is a bug.

## Semantics

For an unannotated Java `String` return, Kotlin infers a platform type. Assigning it to `String?` preserves the possible `null`; assigning it to `String` asks Kotlin to insert a runtime null check. The latter may throw before your code continues if Java returns `null`.

Java nullability annotations can improve the type Kotlin sees, but their meaning depends on supported annotations and compiler configuration. An annotation is useful documentation; it is not a substitute for making a boundary policy explicit.

## Worked example

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

Static result: `Anonymous`. In the actual boundary call, replace `null` with `JavaDirectory.findNickname(false)` and keep the declared `String?` type.

## Java comparison

In Java, the same API returns `String`; a caller must remember that it may be `null`. In Kotlin, making the receiving variable `String?` forces safe access or an explicit fallback. Declaring it as `String` is an assertion about Java's contract, and a violated assertion becomes a runtime null-check failure.

```kotlin fragment
val optional: String? = JavaDirectory.findNickname(false)
val label = optional?.trim() ?: "Anonymous"

val required: String = JavaDirectory.findNickname(false)
// Kotlin accepts this boundary assertion; a null return fails at runtime.
```

## Common mistakes

- Writing `String!` in Kotlin source. It is display notation only.
- Treating every platform type as non-null because the Java declaration says `String`.
- Spreading platform values through Kotlin code instead of converting them at the first boundary.
- Using `!!` to silence uncertainty. It hides the policy and usually gives a worse failure location.

## Decision guidance

Use `T?` when Java can legitimately omit a value and give the Kotlin caller a fallback or branch. Use `T` only after validating an invariant close to the boundary, with an error message that identifies the Java contract. Prefer annotating Java APIs under your control, then continue defending against external or legacy APIs where contracts are unclear.

## Knowledge check

**Question:** An unannotated Java method returns `String` and may return `null`. Which Kotlin declaration best preserves that fact at the boundary?

**Answer:** `val value: String? = javaApi.value()`. It records the uncertainty and requires a deliberate null-handling step.

## Interview question

**How do platform types affect Kotlin null safety when calling Java?**

## Model reasoning

Kotlin cannot infer a reliable nullability contract from an ordinary Java reference type. It therefore permits flexible use at the boundary. A strong answer explains that Kotlin's compiler helps only after the developer chooses a nullable or validated non-null Kotlin type; the Java implementation can still violate an assumed non-null contract at runtime.

## Deep Dive

### Version-sensitive annotation enhancement

Kotlin recognizes several Java nullability annotations and may enhance the type it presents to Kotlin. Exact enhancement behavior can vary with annotation family, compiler version, and compiler flags. For the baseline recorded here, consult Kotlin's Java interop documentation before relying on an annotation from a third-party library. Keep this detail separate from the core rule: unknown Java nullability should be normalized at the boundary.

## Sources

- [Kotlin documentation: Null safety — platform types](https://kotlinlang.org/docs/null-safety.html#platform-types)
- [Kotlin documentation: Calling Java from Kotlin](https://kotlinlang.org/docs/java-interop.html)
- [Kotlin specification: Platform types](https://kotlinlang.org/spec/java-interop.html#platform-types)
