---
id: nullable-types
title: Nullable types
profile: compact
category: type-system
depth: core
publicationStatus: verified
publicationHistory: [draft, review-ready, verified]
publishedAt: 2026-09-19
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-19
reviewerKind: human
reviewedBy: kamil-kazmierczak
reviewedAt: 2026-09-19
reviewReference: commit:5031ac8
reviewPedagogicalClarity: true
reviewAuthoritativeSupport: true
reviewInterviewRealism: true
reviewGuaranteeWording: true
prerequisiteIds: []
relatedIds: []
aliases: [null safety, nullable, String?]
---

## Overview

A nullable type makes the possibility of a missing value explicit. In Kotlin, `String` promises a string while `String?` permits either a string or `null`.

## Why it matters to Java developers

Java reference types can usually contain `null` without saying so in their type. Kotlin separates nullable and non-null types, so the compiler requires you to handle absence before using a nullable value as though it were present.

## Semantics

`T` and `T?` are different types. A value of type `T` can be used where `T?` is expected, but a `T?` value must be checked or transformed before it can be used as `T`. A safe call such as `name?.length` produces `null` when its receiver is `null`; the Elvis operator supplies a fallback.

## Example

```kotlin fragment
fun displayName(nickname: String?): String =
    nickname?.trim()?.takeIf { it.isNotEmpty() } ?: "Anonymous"

displayName(null) // "Anonymous"
```

## Connections

Nullable types are the foundation for reasoning about platform types and Java nullability annotations. This first published concept has no prerequisites.

## Sources

- [Kotlin documentation: Null safety](https://kotlinlang.org/docs/null-safety.html)
- [Kotlin specification: Nullable types](https://kotlinlang.org/spec/type-system.html#nullable-types)
