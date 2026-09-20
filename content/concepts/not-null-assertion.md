---
id: not-null-assertion
title: Not-null assertion
profile: compact
category: type-system
depth: reference
publicationStatus: verified
publishedAt: 2026-09-19
baseline: kotlin-jvm-2026-09
verifiedAt: 2026-09-19
prerequisiteIds: [nullable-types]
relatedIds: [platform-types]
aliases: [double bang, !!]
---

## Overview

The not-null assertion operator, `!!`, converts a nullable value to a non-null one or throws if the value is `null`.

## Why it matters to Java developers

It resembles an unchecked assertion at a Java boundary: useful only when an invariant is already established, and a poor substitute for expressing a null policy.

## Semantics

`value!!` returns the non-null value when present and throws a `NullPointerException` when absent. Prefer a safe call, an Elvis fallback, or an explicit validation with a useful message.

## Example

```kotlin fragment
val nickname: String? = null
val required: String = nickname!! // throws
```

## Connections

This is a reference follow-up to [nullable types](#nullable-types), and is especially tempting when handling [platform types](#platform-types) from Java.

## Sources

- [Kotlin documentation: Null safety](https://kotlinlang.org/docs/null-safety.html)
